// 眼镜渲染器 - 在 Canvas 上绘制眼镜
class GlassesRenderer {
    constructor(canvas, video) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.video = video;
        this.currentGlasses = null;  // { svg, name, id }
        this.currentAnchor = null;
        this.scale = 1.0;
        this.yOffset = 0;
    }

    // 设置眼镜
    setGlasses(glassesItem) {
        this.currentGlasses = glassesItem;
    }

    // 清除画布
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 调整画布尺寸
    resize() {
        const rect = this.video.getBoundingClientRect();
        this.canvas.width = this.video.videoWidth || rect.width;
        this.canvas.height = this.video.videoHeight || rect.height;
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    // 在指定位置渲染眼镜
    render(anchorPoints, headRotation, videoWidth, videoHeight) {
        if (!this.currentGlasses || !anchorPoints) return;

        // 确保 canvas 尺寸与视频一致
        if (this.canvas.width !== videoWidth || this.canvas.height !== videoHeight) {
            this.canvas.width = videoWidth;
            this.canvas.height = videoHeight;
        }

        this.ctx.clearRect(0, 0, videoWidth, videoHeight);

        // 计算眼镜的位置和大小
        const leftX = anchorPoints.leftEyeOuter.x * videoWidth;
        const leftY = anchorPoints.leftEyeOuter.y * videoHeight;
        const rightX = anchorPoints.rightEyeOuter.x * videoWidth;
        const rightY = anchorPoints.rightEyeOuter.y * videoHeight;
        const noseX = anchorPoints.noseBridge.x * videoWidth;
        const noseY = anchorPoints.noseBridge.y * videoHeight;

        // 眼镜宽度 = 两眼外角距离 * 1.8
        const eyeDistance = Math.sqrt(
            Math.pow(rightX - leftX, 2) + Math.pow(rightY - leftY, 2)
        );
        const glassWidth = eyeDistance * 1.8 * this.scale;
        const glassHeight = glassWidth * 0.4; // 高宽比

        // 眼镜中心点上移（在鼻梁上方一点）
        const centerX = (leftX + rightX) / 2;
        const centerY = noseY - glassHeight * 0.15 + this.yOffset;

        // 计算旋转角度
        const rotation = headRotation ? headRotation.roll * (Math.PI / 180) : 0;

        // 创建临时 canvas 来渲染 SVG
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = glassWidth;
        tempCanvas.height = glassHeight;
        const tempCtx = tempCanvas.getContext('2d');

        // 渲染 SVG 到临时 canvas
        const svgBlob = new Blob([this.currentGlasses.svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(rotation);

            // 根据 yaw 调整透明度/缩放（侧面效果）
            if (headRotation && Math.abs(headRotation.yaw) > 15) {
                const scaleX = Math.max(0.6, 1 - Math.abs(headRotation.yaw) / 90);
                this.ctx.scale(scaleX, 1);
                this.ctx.globalAlpha = Math.max(0.5, 1 - Math.abs(headRotation.yaw) / 120);
            }

            this.ctx.drawImage(img, -glassWidth / 2, -glassHeight / 2, glassWidth, glassHeight);
            this.ctx.restore();
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            // SVG 绘制失败时的回退
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(rotation);
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(-glassWidth/2, -glassHeight/2, glassWidth, glassHeight);
            this.ctx.restore();
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }
}
