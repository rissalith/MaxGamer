/**
 * 导出功能模块
 * 负责各种格式的导出（GIF、WebP、精灵图）
 */

const Exporter = {
    /**
     * 下载 GIF
     * @param {Blob} gifBlob - GIF Blob对象
     */
    downloadGIF(gifBlob) {
        if (!gifBlob) {
            throw new Error('请先处理图片生成 GIF！');
        }

        const url = URL.createObjectURL(gifBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `animation_${Date.now()}.gif`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * 导出 WebP 帧为 ZIP
     * @param {HTMLCanvasElement[]} frames - 帧数组
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<void>}
     */
    async exportWebPZip(frames, onProgress) {
        if (frames.length === 0) {
            throw new Error('请先处理图片！');
        }

        // 检查浏览器是否支持 WebP
        const testCanvas = document.createElement('canvas');
        const supportsWebP = testCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

        if (!supportsWebP) {
            throw new Error('您的浏览器不支持 WebP 格式导出！');
        }

        if (onProgress) {
            onProgress({
                status: 'processing',
                message: '正在打包 WebP 帧...'
            });
        }

        try {
            // 创建 ZIP 文件
            const zip = new JSZip();
            const folder = zip.folder('webp_frames');

            // 将每一帧添加到 ZIP
            const promises = frames.map((canvas, index) => {
                return new Promise((resolve) => {
                    canvas.toBlob(function(blob) {
                        const fileName = `frame_${String(index + 1).padStart(3, '0')}.webp`;
                        folder.file(fileName, blob);
                        resolve();
                    }, 'image/webp', window.Constants.WEBP_CONFIG.QUALITY);
                });
            });

            // 等待所有帧转换完成
            await Promise.all(promises);

            // 生成 ZIP 文件
            const zipBlob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { 
                    level: window.Constants.WEBP_CONFIG.COMPRESSION_LEVEL 
                }
            });

            // 下载 ZIP
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `webp_frames_${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (onProgress) {
                onProgress({
                    status: 'success',
                    message: `✅ 已打包下载 ${frames.length} 帧 WebP 图片！`
                });
            }
        } catch (error) {
            console.error('导出 WebP 时出错:', error);
            throw new Error('导出 WebP 失败: ' + error.message);
        }
    },

    /**
     * 导出全部帧为PNG图片ZIP包
     * @param {HTMLCanvasElement[]} frames - 帧数组
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<void>}
     */
    async exportFramesZip(frames, onProgress) {
        if (frames.length === 0) {
            throw new Error('请先生成帧！');
        }

        if (onProgress) {
            onProgress({
                status: 'processing',
                message: '正在打包全部帧...'
            });
        }

        try {
            // 创建 ZIP 文件
            const zip = new JSZip();
            const folder = zip.folder('frames');

            // 将每一帧添加到 ZIP
            const promises = frames.map((canvas, index) => {
                return new Promise((resolve) => {
                    canvas.toBlob(function(blob) {
                        const fileName = `frame_${String(index + 1).padStart(3, '0')}.png`;
                        folder.file(fileName, blob);
                        resolve();
                    }, 'image/png');
                });
            });

            // 等待所有帧转换完成
            await Promise.all(promises);

            // 生成 ZIP 文件
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 6
                }
            });

            // 下载 ZIP
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `frames_${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (onProgress) {
                onProgress({
                    status: 'success',
                    message: `✅ 已打包下载 ${frames.length} 帧图片！`
                });
            }
        } catch (error) {
            console.error('导出帧时出错:', error);
            throw new Error('导出帧失败: ' + error.message);
        }
    },

    /**
     * 导出处理后的精灵图
     * @param {HTMLCanvasElement[]} frames - 帧数组
     * @param {number} rows - 行数
     * @param {number} cols - 列数
     * @param {Function} onProgress - 进度回调
     */
    exportProcessedSpriteSheet(frames, rows, cols, onProgress) {
        if (frames.length === 0) {
            throw new Error('请先处理图片！');
        }

        const frameWidth = frames[0].width;
        const frameHeight = frames[0].height;

        // 创建精灵图画布
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = frameWidth * cols;
        spriteCanvas.height = frameHeight * rows;
        const ctx = spriteCanvas.getContext('2d');

        // 将所有处理后的帧绘制到精灵图上
        frames.forEach((frame, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            ctx.drawImage(frame, col * frameWidth, row * frameHeight);
        });

        // 下载精灵图
        spriteCanvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sprite_sheet_processed_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (onProgress) {
                onProgress({
                    status: 'success',
                    message: '✅ 处理后的精灵图已下载！'
                });
            }
        }, 'image/png');
    }
};

// 导出模块
window.Exporter = Exporter;