// 鐪奸暅娓叉煋鍣?- 鍦?Canvas 涓婄粯鍒剁溂闀?// 淇鐗堬細棰勬覆鏌?SVG銆佸悓姝ョ粯鍒躲€佹纭€傞厤闈㈤儴
class GlassesRenderer {
    constructor(canvas, video) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.video = video;
        this.currentGlasses = null;

        // 棰勬覆鏌撶紦瀛橈細SVG 鈫?Image 瀵硅薄
        this.cachedGlassesId = null;
        this.cachedImg = null;
        this.cacheReady = false;

        this.scale = 1.0;
        this.yOffset = 0;
    }

    // 璁剧疆鐪奸暅锛堝悓鏃堕娓叉煋 SVG 鍒?Image 瀵硅薄锛?    setGlasses(glassesItem) {
        if (!glassesItem) return;
        this.currentGlasses = glassesItem;

        // 濡傛灉宸茬紦瀛樺垯璺宠繃
        if (this.cachedGlassesId === glassesItem.id) return;

        this.cacheReady = false;
        this.cachedGlassesId = glassesItem.id;

        const svgStr = glassesItem.svg || '';
        if (!svgStr) return;

        const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            this.cachedImg = img;
            this.cacheReady = true;
            URL.revokeObjectURL(url);
            console.log(`GlassesRenderer: 棰勬覆鏌撳畬鎴?[${glassesItem.name}]`);
        };
        img.onerror = () => {
            console.warn(`GlassesRenderer: SVG 鍔犺浇澶辫触 [${glassesItem.name}]`);
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }

    // 娓呴櫎鐢诲竷
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 娓叉煋鐪奸暅锛堝悓姝ワ紝鍦?requestAnimationFrame 涓皟鐢級
    // anchorPoints: getGlassesAnchorPoints() 杩斿洖鍊?    // headRotation: getHeadRotation() 杩斿洖鍊?    // videoWidth/videoHeight: 瑙嗛灏哄
    render(anchorPoints, headRotation, videoWidth, videoHeight) {
        if (!this.currentGlasses || !anchorPoints) return;

        // 纭繚 canvas 灏哄涓庤棰戜竴鑷?        if (this.canvas.width !== videoWidth || this.canvas.height !== videoHeight) {
            this.canvas.width = videoWidth;
            this.canvas.height = videoHeight;
        }

        this.ctx.clearRect(0, 0, videoWidth, videoHeight);

        // 鈹€鈹€ 瀹氫綅璁＄畻 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
        // 鎵€鏈夊潗鏍囧凡褰掍竴鍖?(0~1)锛岄渶杞负鐢诲竷鍍忕礌鍧愭爣
        const lx = anchorPoints.leftEyeOuter.x  * videoWidth;   // 宸︾溂澶栫溂瑙掞紙鐢婚潰鍙充晶锛?        const ly = anchorPoints.leftEyeOuter.y  * videoHeight;
        const rx = anchorPoints.rightEyeOuter.x * videoWidth;   // 鍙崇溂澶栫溂瑙掞紙鐢婚潰宸︿晶锛?        const ry = anchorPoints.rightEyeOuter.y * videoHeight;
        const nbx = anchorPoints.noseBridge.x   * videoWidth;  // 榧绘涓績 x
        const nby = anchorPoints.noseBridge.y   * videoHeight; // 榧绘涓績 y

        // 鐬宠窛锛堜袱鐪煎鐪艰涔嬮棿鐨勮窛绂伙級
        const eyeDist = Math.sqrt((rx - lx) ** 2 + (ry - ly) ** 2);

        // 鐪奸暅瀹藉害 = 鐬宠窛 脳 2.2锛堣鐩栧埌澶槼绌翠綅缃紝鏇磋嚜鐒讹級
        const glassWidth  = eyeDist * 2.2 * this.scale;
        // 鐪奸暅楂樺害鎸?SVG 瀹介珮姣旇绠?        const svgAspect = this.cachedImg ? (this.cachedImg.naturalWidth / this.cachedImg.naturalHeight) : 2.5;
        const glassHeight = glassWidth / svgAspect;

        // 鐪奸暅涓績 x = 榧绘涓績 x
        const centerX = nbx;
        // 鐪奸暅涓績 y = 榧绘 y 鍐嶅悜涓婂亸绉伙紙鐪奸暅鎴村湪榧绘涓婃柟锛?        const centerY = nby - glassHeight * 0.20 + this.yOffset;

        // 鈹€鈹€ 鏃嬭浆璁＄畻 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
        const roll  = headRotation ? (headRotation.roll  || 0) * (Math.PI / 180) : 0;
        const yaw   = headRotation ? (headRotation.yaw   || 0) : 0;
        const pitch = headRotation ? (headRotation.pitch || 0) : 0;

        // 鈹€鈹€ 缁樺埗 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(roll);

        // Yaw 渚ч潰鏁堟灉锛氬ご閮ㄤ晶杞椂閫傚綋鍘嬫墎+闄嶄綆閫忔槑搴?        if (Math.abs(yaw) > 10) {
            const scaleX = Math.max(0.5, 1.0 - Math.abs(yaw) / 100);
            this.ctx.scale(scaleX, 1);
            this.ctx.globalAlpha = Math.max(0.4, 1.0 - Math.abs(yaw) / 100);
        }

        if (this.cacheReady && this.cachedImg) {
            // 姝ｅ父缁樺埗缂撳瓨濂界殑 SVG Image
            this.ctx.drawImage(
                this.cachedImg,
                -glassWidth / 2,
                -glassHeight / 2,
                glassWidth,
                glassHeight
            );
        } else {
            // 鍥為€€锛氱粯鍒剁畝鍗曠煩褰㈡
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(-glassWidth / 2, -glassHeight / 2, glassWidth, glassHeight);
            // 榧绘涓嚎
            this.ctx.beginPath();
            this.ctx.moveTo(0, -glassHeight / 2);
            this.ctx.lineTo(0,  glassHeight / 2);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }
}
