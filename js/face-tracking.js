// 浜鸿劯璺熻釜 - MediaPipe Face Landmarks
// 鍏抽敭鐐圭储寮曡鏄庯紙MediaPipe Face Mesh锛屼互浜虹墿鑷韩瑙嗚涓哄噯锛夛細
//   宸︾溂鍐呯溂瑙? 33      宸︾溂澶栫溂瑙? 133
//   鍙崇溂鍐呯溂瑙? 263     鍙崇溂澶栫溂瑙? 362
//   榧诲皷: 1             榧绘牴(涓ょ溂涔嬮棿): 168
//   宸﹀お闃崇┐闄勮繎: 162    鍙冲お闃崇┐闄勮繎: 389
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
            console.log('FaceTracker: 鍒濆鍖栨垚鍔?);
            return true;
        } catch (err) {
            console.error('FaceTracker: 鍒濆鍖栧け璐?, err);
            return false;
        }
    }

    // 妫€娴嬪崟甯?    detect(videoElement) {
        if (!this.faceLandmarker || !videoElement || videoElement.readyState < 2) {
            return null;
        }

        try {
            // 姣忔妫€娴嬪墠鍚屾 runningMode锛岄槻姝?VIDEO/IMAGE 妯″紡鍐茬獊
            this.faceLandmarker.setOptions({ runningMode: 'VIDEO' });
            const startTime = performance.now();
            const result = this.faceLandmarker.detectForVideo(videoElement, startTime);

            if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
                this.lastResults = result;
                return result;
            }
            return null;
        } catch (err) {
            console.warn('FaceTracker: 妫€娴嬪抚澶辫触', err);
            return null;
        }
    }

    // 鑾峰彇闈㈤儴鍏抽敭鐐癸紙褰掍竴鍖?0-1锛?    getFaceLandmarks() {
        if (!this.lastResults || !this.lastResults.faceLandmarks || !this.lastResults.faceLandmarks[0]) {
            return null;
        }
        return this.lastResults.faceLandmarks[0];
    }

    // 鑾峰彇鐪奸暅瀹氫綅鍏抽敭鐐癸紙淇鐗堬級
    // 浠ヨ棰戠敾闈㈠潗鏍囷紙x鍚戝彸锛寉鍚戜笅锛変负鍑?    getGlassesAnchorPoints() {
        const landmarks = this.getFaceLandmarks();
        if (!landmarks) return null;

        // 鈹€鈹€ 鐪肩潧鍏抽敭鐐癸紙MediaPipe 鏍囧噯绱㈠紩锛夆攢鈹€鈹€鈹€
        // 宸︾溂锛堢敾闈㈠彸渚э級澶栫溂瑙? 133    鍐呯溂瑙?杩戦蓟): 33
        // 鍙崇溂锛堢敾闈㈠乏渚э級澶栫溂瑙? 362    鍐呯溂瑙?杩戦蓟): 263
        const leftEyeOuter  = landmarks[133];   // 宸︾溂澶栫溂瑙掞紙鐢婚潰鍙充晶锛?        const rightEyeOuter = landmarks[362];   // 鍙崇溂澶栫溂瑙掞紙鐢婚潰宸︿晶锛?        const leftEyeInner  = landmarks[33];    // 宸︾溂鍐呯溂瑙掞紙杩戦蓟姊侊級
        const rightEyeInner = landmarks[263];   // 鍙崇溂鍐呯溂瑙掞紙杩戦蓟姊侊級

        // 榧绘锛氫袱鐪间箣闂寸殑榧绘牴浣嶇疆
        const noseBridge = landmarks[168];      // 榧绘牴锛堜袱鐪间腑鐐瑰亸涓婏級

        // 澶槼绌撮檮杩戯細鐢ㄤ簬浼扮畻闀滆吙浣嶇疆
        const leftTemple  = landmarks[162];    // 宸﹀お闃崇┐闄勮繎
        const rightTemple = landmarks[389];    // 鍙冲お闃崇┐闄勮繎

        return {
            // 澶栫溂瑙掞紙鐢ㄤ簬璁＄畻鐬宠窛/鐪奸暅瀹藉害锛?            leftEyeOuter:  { x: leftEyeOuter.x,  y: leftEyeOuter.y  },
            rightEyeOuter: { x: rightEyeOuter.x, y: rightEyeOuter.y },
            // 鍐呯溂瑙掞紙鐢ㄤ簬璁＄畻榧绘浣嶇疆锛?            leftEyeInner:  { x: leftEyeInner.x,  y: leftEyeInner.y  },
            rightEyeInner: { x: rightEyeInner.x, y: rightEyeInner.y },
            // 榧绘
            noseBridge:    { x: noseBridge.x,    y: noseBridge.y    },
            // 澶槼绌?            leftTemple:    { x: leftTemple.x,    y: leftTemple.y    },
            rightTemple:   { x: rightTemple.x,   y: rightTemple.y   }
        };
    }

    // 鑾峰彇澶撮儴鏃嬭浆瑙掑害
    getHeadRotation() {
        const landmarks = this.getFaceLandmarks();
        if (!landmarks) return { roll: 0, yaw: 0, pitch: 0 };

        // Roll锛堝乏鍙冲€炬枩锛夛細閫氳繃涓ょ溂杩炵嚎瑙掑害璁＄畻
        const leftOuter  = landmarks[133];
        const rightOuter = landmarks[362];
        const dx = rightOuter.x - leftOuter.x;
        const dy = rightOuter.y - leftOuter.y;
        const roll = Math.atan2(dy, dx) * (180 / Math.PI);

        // Yaw锛堝乏鍙宠浆澶达級锛氶蓟灏栫浉瀵归潰閮ㄤ腑绾跨殑鍋忕Щ
        const noseTip  = landmarks[1];   // 榧诲皷
        const leftInner = landmarks[33];
        const rightInner = landmarks[263];
        const faceCenterX = (leftInner.x + rightInner.x) / 2;
        const noseDx = noseTip.x - faceCenterX;
        const yaw = noseDx * 80; // 缂╂斁绯绘暟

        // Pitch锛堜笂涓嬬偣澶达級锛氶蓟灏栫浉瀵归蓟鏍圭殑 y 鍋忕Щ
        const noseRoot = landmarks[168];
        const pitch = (noseTip.y - noseRoot.y) * 60;

        return { roll, yaw, pitch };
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
