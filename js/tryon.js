// AR 试戴页面主逻辑（优化版：覆盖层一键开启）
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
    const tips = document.getElementById('cameraTips');

    // 覆盖层相关
    const startOverlay = document.getElementById('startOverlay');
    const btnStartTryon = document.getElementById('btnStartTryon');
    const overlayPreview = document.getElementById('overlayPreview');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayDesc = document.getElementById('overlayDesc');

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

    // ===== 强制释放摄像头 =====
    function forceReleaseCamera() {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
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

        // 页面关闭时释放摄像头
        window.addEventListener('pagehide', forceReleaseCamera);
        window.addEventListener('beforeunload', forceReleaseCamera);

        // 初始化人脸跟踪器
        faceTracker = new FaceTracker();
        const ok = await faceTracker.initialize();
        if (!ok) {
            tips.textContent = '⚠️ 人脸检测模型加载失败，可尝试刷新页面';
            tips.style.color = '#ef4444';
        } else {
            tips.textContent = '模型加载成功！';
            tips.style.color = '#22c55e';
        }

        // 初始化渲染器
        renderer = new GlassesRenderer(canvas, video);

        // 渲染眼镜列表
        renderGlassesList();

        // 绑定事件
        bindEvents();

        // 检查 URL 参数：?glasses=ID
        const params = new URLSearchParams(window.location.search);
        const glassesId = params.get('glasses');
        if (glassesId) {
            const g = glassesData.find(item => item.id === parseInt(glassesId));
            if (g) selectGlasses(g);
        }

        // 显示覆盖层（无论是否预选了眼镜）
        showStartOverlay();
    }

    // ===== 显示启动覆盖层 =====
    function showStartOverlay() {
        if (!selectedGlasses) {
            overlayPreview.textContent = '👓';
            overlayTitle.textContent = '选择眼镜并开始试戴';
            overlayDesc.textContent = '请先从右侧选择一副眼镜，然后点击开始';
            btnStartTryon.textContent = '📷 开启摄像头';
        } else {
            // 用 SVG 第一字符作为预览（或显示 emoji）
            overlayPreview.innerHTML = selectedGlasses.svg
                ? selectedGlasses.svg.substring(0, 120) + '…'
                : '👓';
            overlayTitle.textContent = `准备试戴：${selectedGlasses.name}`;
            overlayDesc.textContent = '点击下方按钮开启摄像头，眼镜将自动适配您的面部';
            btnStartTryon.textContent = `📷 开始试戴「${selectedGlasses.name}」`;
        }
        startOverlay.classList.remove('hidden');
    }

    function hideStartOverlay() {
        startOverlay.classList.add('hidden');
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

        // 如果覆盖层还在，更新按钮文字
        if (!startOverlay.classList.contains('hidden')) {
            btnStartTryon.textContent = `📷 开始试戴「${g.name}」`;
            overlayTitle.textContent = `准备试戴：${g.name}`;
        }

        if (stream && !isTracking) {
            tips.textContent = `已选择: ${g.name} — 请正对摄像头`;
        }
    }

    // ===== 开启摄像头（由覆盖层按钮或开始按钮触发）=====
    async function startCamera() {
        forceReleaseCamera();

        tips.textContent = '正在请求摄像头权限…';
        tips.style.color = '#3b82f6';

        try {
            const constraintOptions = [
                { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
                { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
                { video: true, audio: false }
            ];

            let lastError = null;
            for (const c of constraintOptions) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia(c);
                    break;
                } catch (e) {
                    lastError = e;
                    console.warn('摄像头约束失败:', e.name);
                }
            }

            if (!stream) throw lastError || new Error('所有方案均失败');

            video.srcObject = stream;

            await new Promise((resolve) => {
                const clean = () => { video.removeEventListener('canplay', onCanPlay); video.removeEventListener('error', onError); };
                const onCanPlay = () => { clean(); resolve(); };
                const onError = () => { clean(); resolve(); };
                video.addEventListener('canplay', onCanPlay);
                video.addEventListener('error', onError);
                const p = video.play();
                if (p) p.catch(() => {});
                setTimeout(() => { clean(); resolve(); }, 8000);
            });

            // 隐藏占位和覆盖层
            placeholder.style.display = 'none';
            hideStartOverlay();
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
            captureBtn.style.display = 'inline-flex';

            const vw = video.videoWidth || 640;
            const vh = video.videoHeight || 480;
            canvas.width = vw;
            canvas.height = vh;
            wrapper.style.aspectRatio = `${vw} / ${vh}`;

            startTracking();

            tips.textContent = selectedGlasses
                ? `✅ 已选择: ${selectedGlasses.name} — 请正对摄像头`
                : '摄像头已开启！请选择眼镜';
            tips.style.color = '#22c55e';

        } catch (err) {
            console.error('摄像头开启失败:', err);
            forceReleaseCamera();
            let msg = '摄像头开启失败：';
            if (err.name === 'NotAllowedError') {
                msg += '请允许浏览器访问摄像头权限，然后重新点击';
            } else if (err.name === 'NotFoundError') {
                msg += '未检测到摄像头设备';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                msg += '摄像头被占用，请关闭其他应用后重试';
            } else {
                msg += err.message || '未知错误';
            }
            tips.textContent = msg;
            tips.style.color = '#ef4444';

            // 显示覆盖层，允许用户重试
            showStartOverlay();
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

        // 显示覆盖层
        showStartOverlay();
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
                            anchorPoints, headRotation,
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
        ctx.drawImage(video, 0, 0, vw, vh);
        ctx.drawImage(canvas, 0, 0, vw, vh);
        captureImage.src = tempCanvas.toDataURL('image/png');
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
        // 覆盖层「开始试戴」按钮（主要入口）
        btnStartTryon.addEventListener('click', startCamera);
        // 备用：原来的开启摄像头按钮
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
