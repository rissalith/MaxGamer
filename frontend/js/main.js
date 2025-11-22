/**
 * 主入口文件
 * 整合所有模块并初始化应用
 */

const App = {
    /**
     * 初始化应用
     */
    init() {
        console.log('XMFramer 正在初始化...');
        
        // 初始化路由系统
        Router.init();
        
        // 初始化UI管理器
        UIManager.init();
        
        // 加载历史记录
        AppState._loadHistoryFromStorage();
        UIManager.renderHistory();
        
        // 绑定事件处理器
        this._bindEventHandlers();
        
        console.log('XMFramer 已加载 ✅');
        console.log('支持的功能: AI图像生成、图片切割、背景去除、GIF 生成、WebP 导出');
    },

    /**
     * 绑定事件处理器
     * @private
     */
    _bindEventHandlers() {
        const { elements } = UIManager;
        
        // AI生成
        elements.generateAI.addEventListener('click', () => this.handleAIGeneration());
        
        // 帧延迟改变时自动重新生成GIF
        elements.frameDelayInput.addEventListener('change', () => this.handleFrameDelayChange());
        
        // 导出功能
        elements.exportSprite.addEventListener('click', () => this.handleExportSprite());
        elements.exportGif.addEventListener('click', () => this.handleExportGIF());
        elements.exportFrames.addEventListener('click', () => this.handleExportFrames());
        elements.exportOriginal.addEventListener('click', () => this.handleExportOriginal());
        
        // 容差调整事件
        window.addEventListener('toleranceChanged', (e) => this.handleToleranceChange(e.detail.tolerance));
        
        // 插帧功能
        elements.applyInterpolation.addEventListener('click', () => this.handleApplyInterpolation());
        elements.resetFrames.addEventListener('click', () => this.handleResetFrames());
    },

    /**
     * 处理AI生成
     */
    async handleAIGeneration() {
        const params = UIManager.getAIParams();
        
        // 禁用按钮
        UIManager.setButtonEnabled('generateAI', false);
        
        try {
            // 生成图像（后端已自动进行背景移除）
            const result = await AIGenerator.generate(params, (progress) => {
                UIManager.showStatus('aiStatus', progress.status, progress.message);
            });
            
            // 加载去背景后的精灵图
            const image = await AIGenerator.loadImage(result.imageUrl);
            
            // 将帧数据转换为Canvas
            const processedFrames = await Promise.all(
                result.frames.map(base64 => ImageProcessor.base64ToCanvas(base64))
            );
            
            // 显示预览窗口
            UIManager.showPreviewWindow();
            
            // 显示去背景后的精灵图
            UIManager.displaySprite(result.imageUrl);
            
            // 保存原图URL（必须在显示之前保存，确保容差调整时可用）
            if (result.rawImageUrl) {
                AppState.setRawImageUrl(result.rawImageUrl);
                UIManager.displayOriginal(result.rawImageUrl);
                console.log('✅ 原图URL已保存:', result.rawImageUrl.substring(0, 50) + '...');
            } else {
                console.warn('⚠️ 后端未返回原图URL，容差调整功能将不可用');
            }
            
            // 保存所有数据
            AppState.setOriginalImage(image);
            AppState.setOriginalImageUrl(result.imageUrl);
            AppState.setProcessedFrames(processedFrames);  // 保存去背景后的帧
            AppState.rows = result.rows;
            AppState.cols = result.cols;
            
            // 显示全部帧
            UIManager.displayAllFrames(processedFrames);
            
            // 自动生成GIF预览
            await this.autoGenerateGIF();
            
            // 保存到历史记录
            this._saveToHistory({
                prompt: params.prompt,
                model: params.model,
                frameCount: params.frameCount,
                loopConsistency: params.loopConsistency,
                tolerance: UIManager.getTolerance(),
                spriteUrl: result.imageUrl,
                rawImageUrl: result.rawImageUrl,
                frames: result.frames,
                rows: result.rows,
                cols: result.cols,
                gifUrl: null // GIF URL将在生成后更新
            });
            
            UIManager.showStatus('aiStatus', 'success', `✅ 完成！已使用 ${result.model} 生成并处理精灵图`);
            
        } catch (error) {
            console.error('AI 生成错误:', error);
            UIManager.showStatus('aiStatus', 'error', `❌ 生成失败: ${error.message}`);
        } finally {
            UIManager.setButtonEnabled('generateAI', true);
        }
    },

    /**
     * 自动生成GIF预览
     */
    async autoGenerateGIF() {
        const processedFrames = AppState.getProcessedFrames();
        if (!processedFrames || processedFrames.length === 0) {
            return;
        }

        try {
            // 获取帧延迟和首尾帧一致性设置
            const frameDelay = UIManager.getFrameDelay();
            const loopConsistency = AppState.getLoopConsistency();

            // 生成GIF
            UIManager.showStatus('gifStatus', 'processing', '🎬 正在生成GIF预览...');
            const gifBlob = await GIFGenerator.generate(processedFrames, frameDelay, loopConsistency, (progress) => {
                UIManager.showStatus('gifStatus', progress.status, progress.message);
            });

            AppState.setCurrentGifBlob(gifBlob);
            UIManager.displayGIF(gifBlob);
            
            // 更新最新历史记录的GIF URL
            this._updateLatestHistoryGif(gifBlob);

            UIManager.showStatus('gifStatus', 'success', '✅ GIF预览已生成！');

        } catch (error) {
            console.error('GIF生成错误:', error);
            UIManager.showStatus('gifStatus', 'error', `❌ GIF生成失败: ${error.message}`);
        }
    },

    /**
     * 处理帧延迟改变
     */
    async handleFrameDelayChange() {
        const processedFrames = AppState.getProcessedFrames();
        if (!processedFrames || processedFrames.length === 0) {
            return;
        }

        try {
            // 获取帧延迟和首尾帧一致性设置
            const frameDelay = UIManager.getFrameDelay();
            const loopConsistency = AppState.getLoopConsistency();

            // 生成GIF
            UIManager.showStatus('gifStatus', 'processing', '🎬 正在生成...');
            const gifBlob = await GIFGenerator.generate(processedFrames, frameDelay, loopConsistency, (progress) => {
                UIManager.showStatus('gifStatus', progress.status, progress.message);
            });

            AppState.setCurrentGifBlob(gifBlob);
            UIManager.displayGIF(gifBlob);
            
            // 更新最新历史记录的GIF URL
            this._updateLatestHistoryGif(gifBlob);

            UIManager.showStatus('gifStatus', 'success', '✅ 已生成');
            
            // 3秒后隐藏成功提示
            setTimeout(() => {
                UIManager.hideStatus('gifStatus');
            }, 3000);

        } catch (error) {
            console.error('GIF生成错误:', error);
            UIManager.showStatus('gifStatus', 'error', `❌ 生成失败: ${error.message}`);
        }
    },

    /**
     * 处理GIF重新生成（使用不同参数）- 已废弃，由handleFrameDelayChange替代
     */
    async handleGIFGeneration() {
        const processedFrames = AppState.getProcessedFrames();
        if (!processedFrames || processedFrames.length === 0) {
            UIManager.showStatus('gifStatus', 'error', '❌ 请先生成精灵图');
            return;
        }

        // 禁用按钮
        UIManager.setButtonEnabled('generateGif', false);

        try {
            // 获取帧延迟和首尾帧一致性设置
            const frameDelay = UIManager.getFrameDelay();
            const loopConsistency = AppState.getLoopConsistency();

            // 生成GIF
            UIManager.showStatus('gifStatus', 'processing', '🎬 正在重新生成GIF...');
            const gifBlob = await GIFGenerator.generate(processedFrames, frameDelay, loopConsistency, (progress) => {
                UIManager.showStatus('gifStatus', progress.status, progress.message);
            });

            AppState.setCurrentGifBlob(gifBlob);
            UIManager.displayGIF(gifBlob);

            UIManager.showStatus('gifStatus', 'success', '✅ 已生成');

        } catch (error) {
            console.error('GIF生成错误:', error);
            UIManager.showStatus('gifStatus', 'error', `❌ 生成失败: ${error.message}`);
        }
    },

    /**
     * 处理导出GIF
     */
    handleExportGIF() {
        try {
            const gifBlob = AppState.getCurrentGifBlob();
            if (!gifBlob) {
                throw new Error('请先生成GIF');
            }

            // 创建下载链接
            const url = URL.createObjectURL(gifBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `animation-${Date.now()}.gif`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            UIManager.showStatus('gifStatus', 'success', '✅ GIF已下载！');
            setTimeout(() => {
                UIManager.hideStatus('gifStatus');
            }, 3000);
        } catch (error) {
            alert(error.message);
        }
    },

    /**
     * 处理导出精灵图
     */
    handleExportSprite() {
        try {
            const imageUrl = AppState.getOriginalImageUrl();
            if (!imageUrl) {
                throw new Error('没有可下载的精灵图');
            }
            
            // 创建下载链接
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `sprite-sheet-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            UIManager.showStatus('exportStatus', 'success', '✅ 精灵图已下载！');
            setTimeout(() => {
                UIManager.hideStatus('exportStatus');
            }, 3000);
        } catch (error) {
            alert(error.message);
        }
    },

    /**
     * 处理导出全部帧
     */
    async handleExportFrames() {
        try {
            const frames = AppState.getProcessedFrames();
            if (!frames || frames.length === 0) {
                throw new Error('没有可下载的帧');
            }

            UIManager.showStatus('exportStatus', 'processing', '🔄 正在打包全部帧...');

            await Exporter.exportFramesZip(frames, (progress) => {
                UIManager.showStatus('exportStatus', progress.status, progress.message);
            });

            setTimeout(() => {
                UIManager.hideStatus('exportStatus');
            }, 3000);
        } catch (error) {
            UIManager.showStatus('exportStatus', 'error', `❌ 导出失败: ${error.message}`);
            setTimeout(() => {
                UIManager.hideStatus('exportStatus');
            }, 3000);
        }
    },

    /**
     * 处理导出原图
     */
    handleExportOriginal() {
        try {
            const imageUrl = AppState.getRawImageUrl();
            if (!imageUrl) {
                throw new Error('没有可下载的原图');
            }
            
            // 创建下载链接
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `original-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            UIManager.showStatus('exportStatus', 'success', '✅ 原图已下载！');
            setTimeout(() => {
                UIManager.hideStatus('exportStatus');
            }, 3000);
        } catch (error) {
            alert(error.message);
        }
    },

    /**
     * 处理容差调整
     */
    async handleToleranceChange(tolerance) {
        const rawImageUrl = AppState.getRawImageUrl();
        
        // 详细的调试信息
        console.log('=== 容差调整调试信息 ===');
        console.log('容差值:', tolerance);
        console.log('原图URL存在:', !!rawImageUrl);
        console.log('行数:', AppState.rows);
        console.log('列数:', AppState.cols);
        
        if (!rawImageUrl) {
            const errorMsg = '❌ 没有原图数据，无法重新抠图。请重新生成图片。';
            console.error(errorMsg);
            UIManager.showStatus('aiStatus', 'error', errorMsg);
            setTimeout(() => {
                UIManager.hideStatus('aiStatus');
            }, 5000);
            return;
        }

        try {
            UIManager.showStatus('aiStatus', 'processing', `🔄 正在使用容差 ${tolerance} 重新抠图...`);
            
            // 加载原始图片
            const image = await AIGenerator.loadImage(rawImageUrl);
            
            // 调用后端API重新处理
            const processedFrames = await ImageProcessor.processImage(image, {
                rows: AppState.rows,
                cols: AppState.cols,
                tolerance: tolerance
            });
            
            // 更新精灵图预览
            // 将处理后的帧重新组合成精灵图
            const spriteCanvas = await this.createSpriteSheet(processedFrames, AppState.rows, AppState.cols);
            const spriteUrl = spriteCanvas.toDataURL('image/png');
            UIManager.displaySprite(spriteUrl);
            AppState.setOriginalImageUrl(spriteUrl);
            
            // 更新帧显示
            AppState.setProcessedFrames(processedFrames);
            UIManager.displayAllFrames(processedFrames);
            
            // 重新生成GIF
            await this.autoGenerateGIF();
            
            UIManager.showStatus('aiStatus', 'success', `✅ 已使用容差 ${tolerance} 重新抠图完成！`);
            
        } catch (error) {
            console.error('重新抠图错误:', error);
            UIManager.showStatus('aiStatus', 'error', `❌ 重新抠图失败: ${error.message}`);
        }
    },

    /**
     * 创建精灵图
     */
    async createSpriteSheet(frames, rows, cols) {
        if (frames.length === 0) {
            throw new Error('没有帧数据');
        }

        const frameWidth = frames[0].width;
        const frameHeight = frames[0].height;
        
        const canvas = document.createElement('canvas');
        canvas.width = frameWidth * cols;
        canvas.height = frameHeight * rows;
        
        const ctx = canvas.getContext('2d', { alpha: true });
        
        for (let i = 0; i < frames.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = col * frameWidth;
            const y = row * frameHeight;
            
            ctx.drawImage(frames[i], x, y);
        }
        
        return canvas;
    },

    /**
     * 保存到历史记录
     * @private
     */
    _saveToHistory(data) {
        try {
            const record = AppState.addToHistory(data);
            UIManager.renderHistory();
            console.log('✅ 已保存到历史记录:', record.id);
        } catch (error) {
            console.error('保存历史记录失败:', error);
        }
    },

    /**
     * 更新最新历史记录的GIF URL
     * @private
     */
    _updateLatestHistoryGif(gifBlob) {
        // 不再保存GIF到历史记录，避免LocalStorage配额超限
        // GIF可以随时从帧重新生成
        console.log('GIF已生成，但不保存到历史记录以节省存储空间');
    },
    
    /**
     * 处理应用插帧
     */
    async handleApplyInterpolation() {
        const originalFrames = AppState.getOriginalFrames();
        
        if (!originalFrames || originalFrames.length < 2) {
            UIManager.showStatus('aiStatus', 'error', '❌ 需要至少2帧才能进行插帧');
            setTimeout(() => UIManager.hideStatus('aiStatus'), 3000);
            return;
        }
        
        const { interpolationCount, smoothInterpolation } = UIManager.elements;
        const count = parseInt(interpolationCount.value);
        
        if (count === 0) {
            UIManager.showStatus('aiStatus', 'error', '❌ 请选择插帧数量');
            setTimeout(() => UIManager.hideStatus('aiStatus'), 3000);
            return;
        }
        
        try {
            UIManager.showStatus('aiStatus', 'processing', `🎬 正在进行插帧处理...`);
            UIManager.setButtonEnabled('applyInterpolation', false);
            
            // 选择插帧方法
            const useSmooth = smoothInterpolation.checked;
            const interpolatedFrames = useSmooth
                ? FrameInterpolation.interpolateFramesSmooth(originalFrames, count)
                : FrameInterpolation.interpolateFrames(originalFrames, count);
            
            // 保存插帧后的帧
            AppState.setInterpolatedFrames(interpolatedFrames);
            AppState.setProcessedFrames(interpolatedFrames);
            
            // 更新显示
            UIManager.displayAllFrames(interpolatedFrames);
            
            // 重新生成GIF
            await this.autoGenerateGIF();
            
            const method = useSmooth ? '平滑插值' : '线性插值';
            UIManager.showStatus('aiStatus', 'success',
                `✅ 插帧完成！使用${method}，从${originalFrames.length}帧增加到${interpolatedFrames.length}帧`);
            
            setTimeout(() => UIManager.hideStatus('aiStatus'), 3000);
            
        } catch (error) {
            console.error('插帧错误:', error);
            UIManager.showStatus('aiStatus', 'error', `❌ 插帧失败: ${error.message}`);
        } finally {
            UIManager.setButtonEnabled('applyInterpolation', true);
        }
    },
    
    /**
     * 处理还原帧
     */
    async handleResetFrames() {
        const originalFrames = AppState.getOriginalFrames();
        
        if (!originalFrames || originalFrames.length === 0) {
            UIManager.showStatus('aiStatus', 'error', '❌ 没有原始帧可以还原');
            setTimeout(() => UIManager.hideStatus('aiStatus'), 3000);
            return;
        }
        
        if (!AppState.getIsInterpolated()) {
            UIManager.showStatus('aiStatus', 'error', '❌ 当前未应用插帧，无需还原');
            setTimeout(() => UIManager.hideStatus('aiStatus'), 3000);
            return;
        }
        
        try {
            UIManager.showStatus('aiStatus', 'processing', '🔄 正在还原原始帧...');
            UIManager.setButtonEnabled('resetFrames', false);
            
            // 还原到原始帧
            AppState.resetInterpolation();
            AppState.setProcessedFrames(originalFrames);
            
            // 更新显示
            UIManager.displayAllFrames(originalFrames);
            
            // 重新生成GIF
            await this.autoGenerateGIF();
            
            UIManager.showStatus('aiStatus', 'success', `✅ 已还原到原始${originalFrames.length}帧`);
            setTimeout(() => UIManager.hideStatus('aiStatus'), 3000);
            
        } catch (error) {
            console.error('还原错误:', error);
            UIManager.showStatus('aiStatus', 'error', `❌ 还原失败: ${error.message}`);
        } finally {
            UIManager.setButtonEnabled('resetFrames', true);
        }
    }
    };

// 当DOM加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// 导出App对象供调试使用
window.App = App;