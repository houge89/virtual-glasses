// AR 试戴页面主逻辑
(function() {
    // DOM 元素
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('overlayCanvas');
    const startBtn = document.getElementById('startCameraBtn');
    const stopBtn = document.getElementById('stopCameraBtn');
    const captureBtn = document.getElementById('captureBtn');
    const placeholder = document.getElementById('cameraPlaceholder');
    const wrapper = document.getElementById('cameraWrapper');
    const glassesList = document.getElementById('tryonGlassesList');
    const selectedName = document.getElementById('selectedGlassesName');
    const selectedPrice = document.getElementById('selectedPrice');
    const selectedImg = document.getElementById('selectedGlassesImg');
    const tips = document.getElementById('cameraTips');

    // 截图相关
    const captureModal = document.getElementById('captureModal');
    const captureImage = document.getElementById('captureImage');
    const modalClose = document.getElementById('modalClose');
    const downloadBtn = document.getElementById('downloadBtn');
    const retakeBtn = document.getElementById('retakeBtn');

    // 状态
    let stream = null;
    let animationId = null;
    let faceTracker = null;
    let renderer = null;
    let selectedGlasses = null;
    let isTracking = false;

    // ===== 强制释放摄像头（关键修复）=====
    function forceReleaseCamera() {
        // 停止所有媒体轨道
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
            });
            stream = null;
        }
        // 清除 video 的 srcObject
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(t => t.stop());
            video.srcObject = null;
        }
        video.pause();
        isTracking = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    // ===== 初始化 =====
    async function init() {
        tips.textContent = '正在加载人脸检测模型，请稍候…';

        // 页面关闭/刷新时强制释放摄像头（防止第二次打不开）
        window.addEventListener('pagehide', forceReleaseCamera);
        window.addEventListener('beforeunload', forceReleaseCamera);

        // 初始化人脸跟踪器
        faceTracker = new FaceTracker();
        const ok = await faceTracker.initialize();
        if (!ok) {
            tips.textContent = '⚠️ 人脸检测模型加载失败，可尝试刷新页面';
            tips.style.color = '#ef4444';
        } else {
            tips.textContent = '模型加载成功！请点击「开启摄像头」';
            tips.style.color = '#22c55e';
        }

        // 初始化渲染器
        renderer = new GlassesRenderer(canvas, video);

        // 渲染眼镜列表
        renderGlassesList();

        // 绑定事件
        bindEvents();

        // 检查 URL 参数
        const params = new URLSearchParams(window.location.search);
        const glassesId = params.get('glasses');
        if (glassesId) {
            const g = glassesData.find(item => item.id === parseInt(glassesId));
            if (g) selectGlasses(g);
        }
    }

    // ===== 渲染眼镜列表 =====
    function renderGlassesList() {
        glassesList.innerHTML = glassesData.map(g => `
            <div class="tryon-glasses-item" data-id="${g.id}">
                <div class="thumb">${g.svg}</div>
                <div class="info">
                    <h4>${g.name}</h4>
                    <span>${categoryNames[g.category] || g.category}</span>
                </div>
                <div class="price-tag">${g.price}</div>
            </div>
        `).join('');

        glassesList.querySelectorAll('.tryon-glasses-item').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.dataset.id);
                const g = glassesData.find(item => item.id === id);
                if (g) selectGlasses(g);
            });
        });
    }

    // ===== 选择眼镜 =====
    function selectGlasses(g) {
        selectedGlasses = g;
        renderer.setGlasses(g);

        glassesList.querySelectorAll('.tryon-glasses-item').forEach(el => {
            el.classList.toggle('active', parseInt(el.dataset.id) === g.id);
        });
        selectedName.textContent = g.name;
        selectedPrice.textContent = g.price;
        tips.textContent = `已选择: ${g.name} — 请正对摄像头查看效果`;
        tips.style.color = '';

        if (stream && !isTracking) {
            tips.textContent = `已选择: ${g.name} — 请正对摄像头`;
        }
    }

    // ===== 摄像头控制（修复版 v2）=====
    async function startCamera() {
        // 【关键】先强制释放旧流，防止第二次开启失败
        forceReleaseCamera();

        tips.textContent = '正在请求摄像头权限…';
        tips.style.color = '#3b82f6';

        try {
            // 尝试多种约束，兼容更多设备
            const constraintOptions = [
                // 方案1：优先前置摄像头（手机）
                {
                    video: {
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                },
                // 方案2：不指定朝向（桌面/部分安卓）
                {
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                },
                // 方案3：最宽松约束（兜底）
                {
                    video: true,
                    audio: false
                }
            ];

            let lastError = null;

            for (const constraints of constraintOptions) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia(constraints);
                    break; // 成功则跳出
                } catch (e) {
                    lastError = e;
                    console.warn('摄像头约束失败，尝试下一种:', e.name, e.message);
                }
            }

            if (!stream) {
                throw lastError || new Error('所有摄像头方案均失败');
            }

            // 绑定视频流
            video.srcObject = stream;

            // 等待视频可以播放（带超时）
            await new Promise((resolve) => {
                const onCanPlay = () => {
                    cleanup();
                    resolve();
                };
                const onError = () => {
                    cleanup();
                    resolve(); // 继续，不阻塞
                };
                const cleanup = () => {
                    video.removeEventListener('canplay', onCanPlay);
                    video.removeEventListener('error', onError);
                };

                video.addEventListener('canplay', onCanPlay);
                video.addEventListener('error', onError);

                // 主动触发 play()
                const p = video.play();
                if (p) p.catch(() => {});

                // 超时保护 8 秒
                setTimeout(() => {
                    cleanup();
                    resolve();
                }, 8000);
            });

            // 隐藏占位，显示控件
            placeholder.style.display = 'none';
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
            captureBtn.style.display = 'inline-flex';

            // 视频尺寸同步到 canvas
            const vw = video.videoWidth || 640;
            const vh = video.videoHeight || 480;
            canvas.width = vw;
            canvas.height = vh;
            wrapper.style.aspectRatio = `${vw} / ${vh}`;

            // 开始跟踪
            startTracking();

            tips.textContent = selectedGlasses
                ? `已选择: ${selectedGlasses.name} — 请正对摄像头`
                : '摄像头已开启！请选择眼镜后正对摄像头';
            tips.style.color = '#22c55e';

        } catch (err) {
            console.error('摄像头开启失败:', err);
            forceReleaseCamera(); // 失败时也释放
            let msg = '摄像头开启失败：';
            if (err.name === 'NotAllowedError' || err.message.includes('Permission')) {
                msg += '请允许浏览器访问摄像头权限，然后刷新页面重试';
            } else if (err.name === 'NotFoundError') {
                msg += '未检测到摄像头设备';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                msg += '摄像头被其他应用占用，请关闭其他使用摄像头的程序后重试';
            } else if (err.name === 'OverconstrainedError') {
                msg += '摄像头不支持请求的分辨率，将尝试降级';
            } else {
                msg += err.message || '未知错误，请刷新页面重试';
            }
            tips.textContent = msg;
            tips.style.color = '#ef4444';
        }
    }

    function stopCamera() {
        forceReleaseCamera();
        renderer.clear();

        placeholder.style.display = 'flex';
        startBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'none';
        captureBtn.style.display = 'none';

        tips.textContent = '摄像头已关闭，可重新开启';
        tips.style.color = '';
    }

    // ===== 人脸跟踪循环 =====
    function startTracking() {
        if (animationId) return;
        isTracking = true;

        function trackLoop() {
            if (!isTracking) return;

            if (video.readyState >= 2 && selectedGlasses) {
                const result = faceTracker.detect(video);
                if (result) {
                    const anchorPoints = faceTracker.getGlassesAnchorPoints();
                    const headRotation = faceTracker.getHeadRotation();
                    if (anchorPoints) {
                        renderer.render(
                            anchorPoints,
                            headRotation,
                            video.videoWidth || canvas.width,
                            video.videoHeight || canvas.height
                        );
                    }
                }
            }

            animationId = requestAnimationFrame(trackLoop);
        }

        trackLoop();
    }

    // ===== 拍照 =====
    function capturePhoto() {
        const vw = video.videoWidth || canvas.width;
        const vh = video.videoHeight || canvas.height;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = vw;
        tempCanvas.height = vh;
        const ctx = tempCanvas.getContext('2d');

        // 先画视频帧
        ctx.drawImage(video, 0, 0, vw, vh);
        // 再画眼镜 canvas
        ctx.drawImage(canvas, 0, 0, vw, vh);

        const dataUrl = tempCanvas.toDataURL('image/png');
        captureImage.src = dataUrl;
        captureModal.classList.add('show');
    }

    function downloadPhoto() {
        const link = document.createElement('a');
        link.download = `virtual-glasses-${selectedGlasses ? selectedGlasses.name : 'tryon'}.png`;
        link.href = captureImage.src;
        link.click();
    }

    // ===== 绑定事件 =====
    function bindEvents() {
        startBtn.addEventListener('click', startCamera);
        stopBtn.addEventListener('click', stopCamera);
        captureBtn.addEventListener('click', capturePhoto);
        modalClose.addEventListener('click', () => captureModal.classList.remove('show'));
        downloadBtn.addEventListener('click', downloadPhoto);
        retakeBtn.addEventListener('click', () => captureModal.classList.remove('show'));

        captureModal.addEventListener('click', (e) => {
            if (e.target === captureModal) captureModal.classList.remove('show');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') captureModal.classList.remove('show');
        });
    }

    // ===== 启动 =====
    init();
})();
