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
    let detectionInterval = null;

    // ===== 初始化 =====
    async function init() {
        // 初始化人脸跟踪器
        faceTracker = new FaceTracker();
        const ok = await faceTracker.initialize();
        if (!ok) {
            tips.textContent = '⚠️ 人脸检测模型加载失败，可以继续试戴但无自动定位';
            tips.style.color = '#ef4444';
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

        // 点击选择眼镜
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

        // 更新 UI
        glassesList.querySelectorAll('.tryon-glasses-item').forEach(el => {
            el.classList.toggle('active', parseInt(el.dataset.id) === g.id);
        });
        selectedName.textContent = g.name;
        selectedPrice.textContent = g.price;
        tips.textContent = `已选择: ${g.name} — 请正对摄像头查看效果`;

        // 如果摄像头已开启但无人脸，显示提示
        if (stream && !isTracking) {
            tips.textContent = `已选择: ${g.name} — 请正对摄像头`;
        }
    }

    // ===== 摄像头控制 =====
    async function startCamera() {
        try {
            // 优先使用前置摄像头（手机）
            const constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            };

            stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            await video.play();

            // 隐藏占位，显示控件
            placeholder.style.display = 'none';
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
            captureBtn.style.display = 'inline-flex';

            // 等待视频元数据加载
            video.addEventListener('loadedmetadata', () => {
                video.width = video.videoWidth;
                video.height = video.videoHeight;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                wrapper.style.aspectRatio = `${video.videoWidth}/${video.videoHeight}`;
            }, { once: true });

            // 等待足够帧后开始跟踪
            await new Promise(resolve => {
                const check = () => {
                    if (video.readyState >= 2 && video.videoWidth > 0) {
                        resolve();
                    } else {
                        requestAnimationFrame(check);
                    }
                };
                check();
            });

            // 开始人脸追踪循环
            startTracking();

            tips.textContent = selectedGlasses
                ? `已选择: ${selectedGlasses.name} — 面部正对摄像头`
                : '📸 请先选择一副眼镜开始试戴';

        } catch (err) {
            console.error('摄像头启动失败:', err);
            tips.textContent = '⚠️ 摄像头启动失败，请确保已授予摄像头权限';
            tips.style.color = '#ef4444';
        }
    }

    function stopCamera() {
        stopTracking();

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        video.srcObject = null;

        // 清空画面
        renderer.clear();

        placeholder.style.display = 'flex';
        startBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'none';
        captureBtn.style.display = 'none';

        tips.textContent = '💡 提示：请在光线充足的环境下使用，面部正对摄像头';
        tips.style.color = '';
    }

    // ===== 人脸追踪循环 =====
    function startTracking() {
        if (animationId) return;

        isTracking = true;

        function trackLoop() {
            if (!isTracking) return;

            if (video.readyState >= 2 && selectedGlasses) {
                // 检测人脸
                const result = faceTracker.detect(video);
                if (result) {
                    const anchorPoints = faceTracker.getGlassesAnchorPoints();
                    const headRotation = faceTracker.getHeadRotation();

                    if (anchorPoints) {
                        renderer.render(
                            anchorPoints,
                            headRotation,
                            video.videoWidth,
                            video.videoHeight
                        );
                    }
                }
            }

            animationId = requestAnimationFrame(trackLoop);
        }

        trackLoop();
    }

    function stopTracking() {
        isTracking = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    // ===== 截图功能 =====
    function capturePhoto() {
        // 创建一个临时 canvas 来合并视频和眼镜
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const ctx = tempCanvas.getContext('2d');

        // 绘制视频帧
        ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

        // 绘制眼镜叠加
        ctx.drawImage(canvas, 0, 0);

        // 显示截图
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

    // ===== 事件绑定 =====
    function bindEvents() {
        startBtn.addEventListener('click', startCamera);
        stopBtn.addEventListener('click', stopCamera);
        captureBtn.addEventListener('click', capturePhoto);
        modalClose.addEventListener('click', () => captureModal.classList.remove('show'));
        downloadBtn.addEventListener('click', downloadPhoto);
        retakeBtn.addEventListener('click', () => captureModal.classList.remove('show'));

        // 点击模态框外部关闭
        captureModal.addEventListener('click', (e) => {
            if (e.target === captureModal) captureModal.classList.remove('show');
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') captureModal.classList.remove('show');
        });
    }

    // ===== 启动 =====
    init();
})();
