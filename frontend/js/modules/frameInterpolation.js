/**
 * 帧插值模块
 * 负责在帧之间生成平滑的过渡帧
 */

const FrameInterpolation = {
    /**
     * 在帧之间插入中间帧
     * @param {Array<Canvas>} frames - 原始帧数组
     * @param {number} interpolationCount - 每两帧之间插入的帧数（默认1）
     * @returns {Array<Canvas>} 插帧后的帧数组
     */
    interpolateFrames(frames, interpolationCount = 1) {
        if (!frames || frames.length < 2) {
            console.warn('帧数不足，无法插帧');
            return frames;
        }
        
        if (interpolationCount < 1) {
            return frames;
        }
        
        console.log(`开始插帧: 原始帧数=${frames.length}, 插帧数=${interpolationCount}`);
        
        const interpolatedFrames = [];
        
        // 遍历每对相邻帧
        for (let i = 0; i < frames.length; i++) {
            // 添加当前帧
            interpolatedFrames.push(frames[i]);
            
            // 如果不是最后一帧，在当前帧和下一帧之间插入中间帧
            if (i < frames.length - 1) {
                const currentFrame = frames[i];
                const nextFrame = frames[i + 1];
                
                // 生成中间帧
                for (let j = 1; j <= interpolationCount; j++) {
                    const t = j / (interpolationCount + 1); // 插值比例 (0, 1)
                    const interpolatedFrame = this._interpolateTwoFrames(currentFrame, nextFrame, t);
                    interpolatedFrames.push(interpolatedFrame);
                }
            }
        }
        
        console.log(`插帧完成: 新帧数=${interpolatedFrames.length}`);
        return interpolatedFrames;
    },
    
    /**
     * 在两帧之间进行线性插值
     * @param {Canvas} frame1 - 第一帧
     * @param {Canvas} frame2 - 第二帧
     * @param {number} t - 插值比例 (0-1)
     * @returns {Canvas} 插值后的帧
     * @private
     */
    _interpolateTwoFrames(frame1, frame2, t) {
        const width = frame1.width;
        const height = frame1.height;
        
        // 创建新的canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: true });
        
        // 获取两帧的像素数据
        const ctx1 = frame1.getContext('2d', { alpha: true });
        const ctx2 = frame2.getContext('2d', { alpha: true });
        
        const imageData1 = ctx1.getImageData(0, 0, width, height);
        const imageData2 = ctx2.getImageData(0, 0, width, height);
        const data1 = imageData1.data;
        const data2 = imageData2.data;
        
        // 创建新的像素数据
        const newImageData = ctx.createImageData(width, height);
        const newData = newImageData.data;
        
        // 对每个像素进行线性插值
        for (let i = 0; i < data1.length; i += 4) {
            // RGB通道线性插值
            newData[i] = Math.round(data1[i] * (1 - t) + data2[i] * t);         // R
            newData[i + 1] = Math.round(data1[i + 1] * (1 - t) + data2[i + 1] * t); // G
            newData[i + 2] = Math.round(data1[i + 2] * (1 - t) + data2[i + 2] * t); // B
            
            // Alpha通道特殊处理
            const alpha1 = data1[i + 3];
            const alpha2 = data2[i + 3];
            
            // 如果两帧都是透明的，保持透明
            if (alpha1 === 0 && alpha2 === 0) {
                newData[i + 3] = 0;
            } else {
                // 否则进行线性插值
                newData[i + 3] = Math.round(alpha1 * (1 - t) + alpha2 * t);
            }
        }
        
        // 将插值后的像素数据绘制到canvas
        ctx.putImageData(newImageData, 0, 0);
        
        return canvas;
    },
    
    /**
     * 使用更高级的插值算法（可选）
     * 使用ease-in-out缓动函数使过渡更自然
     * @param {Array<Canvas>} frames - 原始帧数组
     * @param {number} interpolationCount - 每两帧之间插入的帧数
     * @returns {Array<Canvas>} 插帧后的帧数组
     */
    interpolateFramesSmooth(frames, interpolationCount = 1) {
        if (!frames || frames.length < 2) {
            return frames;
        }
        
        if (interpolationCount < 1) {
            return frames;
        }
        
        console.log(`开始平滑插帧: 原始帧数=${frames.length}, 插帧数=${interpolationCount}`);
        
        const interpolatedFrames = [];
        
        for (let i = 0; i < frames.length; i++) {
            interpolatedFrames.push(frames[i]);
            
            if (i < frames.length - 1) {
                const currentFrame = frames[i];
                const nextFrame = frames[i + 1];
                
                for (let j = 1; j <= interpolationCount; j++) {
                    const linearT = j / (interpolationCount + 1);
                    // 使用ease-in-out缓动函数
                    const t = this._easeInOutCubic(linearT);
                    const interpolatedFrame = this._interpolateTwoFrames(currentFrame, nextFrame, t);
                    interpolatedFrames.push(interpolatedFrame);
                }
            }
        }
        
        console.log(`平滑插帧完成: 新帧数=${interpolatedFrames.length}`);
        return interpolatedFrames;
    },
    
    /**
     * Ease-in-out cubic 缓动函数
     * @param {number} t - 输入值 (0-1)
     * @returns {number} 缓动后的值 (0-1)
     * @private
     */
    _easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    
    /**
     * 计算插帧后的总帧数
     * @param {number} originalFrameCount - 原始帧数
     * @param {number} interpolationCount - 每两帧之间插入的帧数
     * @returns {number} 插帧后的总帧数
     */
    calculateInterpolatedFrameCount(originalFrameCount, interpolationCount) {
        if (originalFrameCount < 2) {
            return originalFrameCount;
        }
        return originalFrameCount + (originalFrameCount - 1) * interpolationCount;
    }
};

// 导出模块
window.FrameInterpolation = FrameInterpolation;