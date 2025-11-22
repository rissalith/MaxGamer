/**
 * GIF生成模块
 * 负责GIF动画的生成
 */

const GIFGenerator = {
    /**
     * 生成 GIF 预览
     * @param {HTMLCanvasElement[]} frames - 帧数组
     * @param {number} frameDelay - 帧延迟（毫秒）
     * @param {boolean} loopConsistency - 是否开启首尾帧一致
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<Blob>} GIF Blob
     */
    async generate(frames, frameDelay, loopConsistency, onProgress) {
        if (frames.length === 0) {
            throw new Error('没有可用的帧');
        }

        return new Promise((resolve, reject) => {
            const { GIF_CONFIG } = window.Constants;
            
            // 使用 gif.js 生成 GIF
            // 不设置transparent参数，让gif.js根据canvas的alpha通道自动处理透明度
            // 使用最高质量设置来减少颜色失真
            const gif = new GIF({
                workers: GIF_CONFIG.WORKERS,
                quality: 1,  // 使用最高质量 (1-30，数字越小质量越高)
                workerScript: GIF_CONFIG.WORKER_SCRIPT
                // 不设置background和transparent，让gif.js自动从canvas读取透明信息
            });

            // 添加所有帧
            // 注意：如果开启了首尾帧一致性，AI应该已经生成了首尾一致的帧
            // 因此不需要在这里重复添加第一帧
            frames.forEach(canvas => {
                gif.addFrame(canvas, { delay: frameDelay });
            });

            // 渲染完成事件
            gif.on('finished', function(blob) {
                if (onProgress) {
                    onProgress({
                        status: 'success',
                        message: '✅ 已生成',
                        progress: 100
                    });
                }
                resolve(blob);
            });

            // 进度更新
            gif.on('progress', function(p) {
                const percent = Math.round(p * 100);
                if (onProgress) {
                    onProgress({
                        status: 'processing',
                        message: `正在生成 GIF 预览... ${percent}%`,
                        progress: percent
                    });
                }
            });

            // 错误处理
            gif.on('error', function(error) {
                reject(error);
            });

            // 开始渲染
            gif.render();
        });
    }
};

// 导出模块
window.GIFGenerator = GIFGenerator;