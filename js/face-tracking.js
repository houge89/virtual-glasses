// 人脸跟踪 - MediaPipe Face Landmarks
class FaceTracker {
    constructor() {
        this.faceLandmarker = null;
        this.running = false;
        this.lastResults = null;
        this.runningMode = 'VIDEO';
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
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: 'GPU'
                },
                outputFaceBlendshapes: false,
                runningMode: this.runningMode,
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
            this.faceLandmarker.setOptions({ runningMode: 'VIDEO' });
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

    // 获取眼睛和鼻梁关键位置（用于定位眼镜）
    getGlassesAnchorPoints() {
        const landmarks = this.getFaceLandmarks();
        if (!landmarks) return null;

        // MediaPipe Face Mesh 关键点索引:
        // 左眼: 33, 133, 157, 158, 159, 160, 161, 173
        // 右眼: 263, 362, 384, 385, 386, 387, 388, 390
        // 左眼外角: 33, 右眼外角: 263
        // 鼻梁: 6
        // 鼻根: 168

        const leftEyeOuter = landmarks[33];
        const rightEyeOuter = landmarks[263];
        const noseBridge = landmarks[168];  // 鼻根

        // 眼镜轮廓关键点（用于后处理）
        const leftCheek = landmarks[123];
        const rightCheek = landmarks[352];
        const templeLeft = landmarks[147];
        const templeRight = landmarks[377];

        return {
            leftEyeOuter: { x: leftEyeOuter.x, y: leftEyeOuter.y },
            rightEyeOuter: { x: rightEyeOuter.x, y: rightEyeOuter.y },
            noseBridge: { x: noseBridge.x, y: noseBridge.y },
            leftCheek: { x: leftCheek.x, y: leftCheek.y },
            rightCheek: { x: rightCheek.x, y: rightCheek.y },
            templeLeft: { x: templeLeft.x, y: templeLeft.y },
            templeRight: { x: templeRight.x, y: templeRight.y }
        };
    }

    // 获取头部旋转角度（近似）
    getHeadRotation() {
        const landmarks = this.getFaceLandmarks();
        if (!landmarks) return { roll: 0, yaw: 0 };

        // 使用左右眼外角计算偏转角
        const left = landmarks[33];
        const right = landmarks[263];

        // Roll: 左右眼的角度
        const dx = right.x - left.x;
        const dy = right.y - left.y;
        const roll = Math.atan2(dy, dx) * (180 / Math.PI);

        // Yaw: 鼻尖相对鼻根的水平偏移
        const noseTip = landmarks[1];    // 鼻尖
        const noseRoot = landmarks[168]; // 鼻根
        const noseDx = noseTip.x - noseRoot.x;
        const yaw = noseDx * 90; // 归一化到度数

        return { roll, yaw };
    }

    dispose() {
        this.running = false;
        this.lastResults = null;
        if (this.faceLandmarker) {
            this.faceLandmarker.close();
            this.faceLandmarker = null;
        }
        this.initialized = false;
    }
}
