// 人脸跟踪 - MediaPipe Face Landmarks
// 关键点索引说明（MediaPipe Face Mesh，以人物自身视角为准）：
//   左眼内眼角: 33      左眼外眼角: 133
//   右眼内眼角: 263     右眼外眼角: 362
//   鼻尖: 1             鼻根(两眼之间): 168
//   左太阳穴附近: 162    右太阳穴附近: 389
class FaceTracker {
    constructor() {
        this.faceLandmarker = null;
        this.lastResults = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return true;

        try {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm/'
            );

            this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    // 正确模型地址（float16 轻量版，加载更快）
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: 'GPU'
                },
                outputFaceBlendshapes: false,
                runningMode: 'VIDEO',
                numFaces: 1
            });

            this.initialized = true;
            console.log('FaceTracker: 初始化成功');
            return true;
        } catch (err) {
            console.error('FaceTracker: 初始化失败', err);
            return false;
        }
    }

    // 检测单帧
    detect(videoElement) {
        if (!this.faceLandmarker || !videoElement || videoElement.readyState < 2) {
            return null;
        }

        try {
            const startTime = performance.now();
            const result = this.faceLandmarker.detectForVideo(videoElement, startTime);

            if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
                this.lastResults = result;
                return result;
            }
            return null;
        } catch (err) {
            console.warn('FaceTracker: 检测帧失败', err);
            return null;
        }
    }

    // 获取面部关键点（归一化 0-1）
    getFaceLandmarks() {
        if (!this.lastResults || !this.lastResults.faceLandmarks || !this.lastResults.faceLandmarks[0]) {
            return null;
        }
        return this.lastResults.faceLandmarks[0];
    }

    // 获取眼镜定位关键点
    getGlassesAnchorPoints() {
        const landmarks = this.getFaceLandmarks();
        if (!landmarks) return null;

        return {
            // 外眼角（用于计算瞳距/眼镜宽度）
            leftEyeOuter:  { x: landmarks[133].x, y: landmarks[133].y },
            rightEyeOuter: { x: landmarks[362].x, y: landmarks[362].y },
            // 内眼角
            leftEyeInner:  { x: landmarks[33].x,  y: landmarks[33].y  },
            rightEyeInner: { x: landmarks[263].x, y: landmarks[263].y },
            // 鼻梁中心
            noseBridge:    { x: landmarks[168].x, y: landmarks[168].y },
            // 太阳穴附近
            leftTemple:    { x: landmarks[162].x, y: landmarks[162].y },
            rightTemple:   { x: landmarks[389].x, y: landmarks[389].y }
        };
    }

    // 获取头部旋转角度
    getHeadRotation() {
        const landmarks = this.getFaceLandmarks();
        if (!landmarks) return { roll: 0, yaw: 0, pitch: 0 };

        // Roll：两眼连线角度
        const dx = landmarks[362].x - landmarks[133].x;
        const dy = landmarks[362].y - landmarks[133].y;
        const roll = Math.atan2(dy, dx) * (180 / Math.PI);

        // Yaw：鼻尖相对面部中线的偏移
        const noseTip   = landmarks[1];
        const faceCenterX = (landmarks[33].x + landmarks[263].x) / 2;
        const yaw = (noseTip.x - faceCenterX) * 80;

        // Pitch：鼻尖相对鼻根的 y 偏移
        const pitch = (noseTip.y - landmarks[168].y) * 60;

        return { roll, yaw, pitch };
    }

    dispose() {
        this.lastResults = null;
        if (this.faceLandmarker) {
            this.faceLandmarker.close();
            this.faceLandmarker = null;
        }
        this.initialized = false;
    }
}
