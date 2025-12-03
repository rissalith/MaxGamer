/**
 * MaxGamer SDK 适配器
 * 将平台的动作指令转换为游戏内部的函数调用
 */

(function() {
    'use strict';
    
    // 等待游戏核心模块加载完成后初始化
    function initAdapter() {
        if (typeof MaxGamer === 'undefined') {
            console.log('[Adapter] MaxGamer SDK 未加载，跳过适配器初始化');
            return;
        }
        
        console.log('[Adapter] 初始化 MaxGamer SDK 适配器...');
        
        // 初始化 SDK
        MaxGamer.init({
            onAction: handleAction,
            onConfig: handleConfig,
            onInit: handleInit,
            onPause: handlePause,
            onResume: handleResume,
            onError: handleError
        });
    }
    
    /**
     * 处理动作指令
     */
    function handleAction(action) {
        console.log('[Adapter] 收到动作:', action.code, action);
        
        // 创建用户信息对象（如果有）
        const user = action.user || {
            id: 'platform_user',
            name: action.user?.name || '观众',
            avatar: action.user?.avatar || ''
        };
        
        switch (action.code) {
            case 'DRAW_FORTUNE':
                // 通用占卜
                triggerFortune('daily', user);
                break;
                
            case 'DRAW_LOVE':
                // 姻缘签
                triggerFortune('love', user, action.params);
                break;
                
            case 'DRAW_CAREER':
                // 事业签
                triggerFortune('career', user);
                break;
                
            case 'DRAW_HEALTH':
                // 健康签
                triggerFortune('health', user);
                break;
                
            case 'DRAW_WEALTH':
                // 财运签
                triggerFortune('wealth', user);
                break;
                
            case 'DAILY_FORTUNE':
                // 今日运势
                triggerFortune('daily', user);
                break;
                
            case 'RESET_SCENE':
                // 重置场景
                resetGameScene();
                break;
                
            case 'WITCH_CHAT':
                // AI对话
                triggerWitchChat(action.params?.message, user);
                break;
                
            case 'SHOW_EFFECT':
                // 播放特效
                showEffect(action.params?.effect_type, action.params?.duration);
                break;
                
            default:
                console.warn('[Adapter] 未知动作:', action.code);
        }
    }
    
    /**
     * 触发占卜
     */
    function triggerFortune(type, user, params = {}) {
        // 检查游戏是否已初始化
        if (typeof window.gameInstance === 'undefined' && typeof window.FortuneGame === 'undefined') {
            console.warn('[Adapter] 游戏实例未初始化');
            // 降级方案：使用 GiftQueueManager
            if (typeof window.GiftQueueManager !== 'undefined') {
                GiftQueueManager.addToQueue({
                    type: 'gift',
                    username: user.name,
                    avatar: user.avatar,
                    giftId: type,
                    fortuneType: type
                });
            }
            return;
        }
        
        // 调用游戏的占卜逻辑
        if (typeof window.GiftQueueManager !== 'undefined') {
            GiftQueueManager.addToQueue({
                type: 'fortune',
                username: user.name,
                avatar: user.avatar,
                fortuneType: type,
                params: params
            });
        }
        
        // 发送占卜结果事件给平台
        setTimeout(() => {
            MaxGamer.sendEvent('FORTUNE_TRIGGERED', {
                type: type,
                user: user.name
            });
        }, 100);
    }
    
    /**
     * 重置游戏场景
     */
    function resetGameScene() {
        if (typeof window.FortuneGame !== 'undefined' && typeof window.FortuneGame.reset === 'function') {
            window.FortuneGame.reset();
        } else if (typeof window.gameInstance !== 'undefined' && typeof window.gameInstance.reset === 'function') {
            window.gameInstance.reset();
        } else {
            // 降级：刷新页面
            console.log('[Adapter] 无法找到重置方法，将刷新页面');
        }
    }
    
    /**
     * 触发巫女对话
     */
    function triggerWitchChat(message, user) {
        if (typeof window.WitchDialogHandler !== 'undefined') {
            WitchDialogHandler.addUserMessage(message, user.name);
        } else if (typeof window.WitchLili !== 'undefined') {
            WitchLili.chat(message);
        }
    }
    
    /**
     * 显示特效
     */
    function showEffect(effectType, duration) {
        const effectMap = {
            '樱花飘落': 'sakura',
            '星光闪烁': 'stars',
            '神秘光环': 'aura',
            '烟花绽放': 'firework'
        };
        
        const effect = effectMap[effectType] || 'sakura';
        
        if (typeof window.ParticleSystem !== 'undefined') {
            ParticleSystem.play(effect, duration * 1000);
        }
    }
    
    /**
     * 处理配置更新
     */
    function handleConfig(config) {
        console.log('[Adapter] 收到配置:', config);
        
        // 更新游戏配置
        if (config.action_mappings) {
            // 可以将配置传递给游戏的配置管理器
            if (typeof window.FortuneConfig !== 'undefined') {
                FortuneConfig.updateMappings(config.action_mappings);
            }
        }
    }
    
    /**
     * 处理初始化
     */
    function handleInit(initData) {
        console.log('[Adapter] 初始化数据:', initData);
        
        // 可以用于传递用户的个性化设置
        if (initData.userConfig) {
            handleConfig(initData.userConfig);
        }
        
        // 通知平台场景已就绪
        MaxGamer.sendEvent('SCENE_READY', {
            game: 'fortune-game',
            version: '1.0.0'
        });
    }
    
    /**
     * 处理暂停
     */
    function handlePause() {
        console.log('[Adapter] 游戏暂停');
        // 可以暂停动画等
        if (typeof window.ParticleSystem !== 'undefined') {
            ParticleSystem.pause();
        }
    }
    
    /**
     * 处理恢复
     */
    function handleResume() {
        console.log('[Adapter] 游戏恢复');
        if (typeof window.ParticleSystem !== 'undefined') {
            ParticleSystem.resume();
        }
    }
    
    /**
     * 处理错误
     */
    function handleError(error) {
        console.error('[Adapter] SDK 错误:', error);
    }
    
    // 监听 DOM 加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // 延迟初始化，确保游戏模块已加载
            setTimeout(initAdapter, 1000);
        });
    } else {
        setTimeout(initAdapter, 1000);
    }
    
    // 暴露适配器对象供调试
    window.MaxGamerAdapter = {
        triggerFortune,
        resetGameScene,
        triggerWitchChat,
        showEffect
    };
    
})();


