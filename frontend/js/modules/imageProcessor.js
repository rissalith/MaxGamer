/**
 * 图像处理模块
 * 负责图像切割和背景去除（通过后端API）
 */

const ImageProcessor = {
    /**
     * 将图像转换为base64
     * @param {HTMLImageElement} image - 图像元素
     * @returns {string} base64字符串
     */
    imageToBase64(image) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d', { alpha: true });
        // 不清除canvas，保持透明背景
        ctx.drawImage(image, 0, 0);
        return canvas.toDataURL('image/png');
    },

    /**
     * 将base64转换为Canvas
     * @param {string} base64 - base64字符串
     * @returns {Promise<HTMLCanvasElement>} Canvas元素
     */
    async base64ToCanvas(base64) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
                // 清除canvas为透明
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                resolve(canvas);
            };
            img.onerror = reject;
            img.src = base64;
        });
    },


    /**
     * 处理图片 - 通过后端API切割和去背景
     * @param {HTMLImageElement} image - 原始图片
     * @param {Object} params - 处理参数
     * @returns {Promise<HTMLCanvasElement[]>} 处理后的帧数组
     */
    async processImage(image, params) {
        const { rows, cols, tolerance } = params;

        if (rows < 1 || cols < 1) {
            throw new Error('行数和列数必须大于 0！');
        }

        try {
            // 将图像转换为base64
            const base64Image = this.imageToBase64(image);

            // 调用后端API
            const response = await fetch('/api/process-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: base64Image,
                    rows: rows,
                    cols: cols,
                    tolerance: tolerance,
                    mode: 'green'  // 使用绿幕抠图模式
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '图像处理失败');
            }

            const result = await response.json();

            // 将返回的base64帧转换为Canvas
            const canvasFrames = await Promise.all(
                result.frames.map(base64 => this.base64ToCanvas(base64))
            );

            console.log(`✅ 后端处理完成: ${canvasFrames.length} 帧`);
            return canvasFrames;

        } catch (error) {
            console.error('调用后端API失败:', error);
            throw new Error(`图像处理失败: ${error.message}`);
        }
    }
};

// 导出模块
window.ImageProcessor = ImageProcessor;