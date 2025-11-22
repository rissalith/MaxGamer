/**
 * AI生成模块
 * 负责AI图像生成和加载
 */

const AIGenerator = {
    /**
     * 处理 AI 生成
     * @param {Object} params - 生成参数
     * @param {Function} onProgress - 进度回调
     * @returns {Promise<Object>} 生成结果
     */
    async generate(params, onProgress) {
        const { prompt, model, frameCount, loopConsistency } = params;
        
        if (!prompt) {
            throw new Error('请输入描述文字！');
        }
        
        // 获取模型名称
        const modelName = this._getModelName(model);
        
        // 通知进度
        if (onProgress) {
            onProgress({
                status: 'processing',
                message: `🤖 使用 ${modelName} 正在生成动画，请稍候...`
            });
        }
        
        console.log(`开始 AI 生成: "${prompt}", 帧数: ${frameCount}, 模型: ${model}`);
        
        try {
            // 调用后端 API
            const response = await fetch(window.Constants.API.GENERATE_SPRITE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    frameCount: frameCount,
                    model: model,
                    loopConsistency: loopConsistency
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'AI 生成失败');
            }
            
            console.log('AI 生成成功:', data);
            
            // 调试：检查 rawImageUrl 是否存在
            if (data.rawImageUrl) {
                console.log('✅ 后端返回了原图URL:', data.rawImageUrl.substring(0, 50) + '...');
            } else {
                console.warn('⚠️ 后端响应中缺少 rawImageUrl 字段');
                console.log('完整响应数据:', JSON.stringify(Object.keys(data)));
            }
            
            // 显示实际发送给AI的prompt
            if (data.enhancedPrompt) {
                console.log('\n' + '='.repeat(80));
                console.log('📝 实际发送给AI的完整Prompt:');
                console.log('-'.repeat(80));
                console.log(data.enhancedPrompt);
                console.log('='.repeat(80) + '\n');
            }
            
            const usedModel = this._getModelName(data.model);
            
            // 通知成功
            if (onProgress) {
                onProgress({
                    status: 'success',
                    message: `✅ ${usedModel} 动画生成成功！正在加载...`
                });
            }
            
            return {
                imageUrl: data.imageUrl,
                rawImageUrl: data.rawImageUrl, // 原始未处理的图片
                frames: data.frames,
                rows: data.rows,
                cols: data.cols,
                model: usedModel
            };
            
        } catch (error) {
            console.error('AI 生成错误:', error);
            throw error;
        }
    },

    /**
     * 加载 AI 生成的图片
     * @param {string} imageUrl - 图片URL
     * @returns {Promise<HTMLImageElement>} 加载的图片
     */
    async loadImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // 允许跨域
            
            img.onload = function() {
                console.log(`AI 图片已加载: ${img.width}x${img.height}`);
                resolve(img);
            };
            
            img.onerror = function() {
                reject(new Error('无法加载 AI 生成的图片'));
            };
            
            img.src = imageUrl;
        });
    },

    /**
     * 获取模型显示名称
     * @private
     */
    _getModelName(model) {
        return window.Constants.AI_MODELS[model] || model;
    }
};

// 导出模块
window.AIGenerator = AIGenerator;