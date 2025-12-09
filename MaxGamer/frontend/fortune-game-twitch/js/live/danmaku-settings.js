/**
 * 弹幕设置管理器
 * 整合弹幕类型筛选、飞行速度、透明度等设置
 */
class DanmakuSettingsManager {
    constructor() {
        this.button = null;
        this.modal = null;
        this.isOpen = false;
        
        // 设置项
        this.settings = {
            filters: {
                chat: true,
                gift: true,
                like: true,
                member: true,
                follow: true
            },
            speed: 8,
            opacity: 0.95
        };
        
        this.init();
    }
    
    /**
     * 初始化
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    /**
     * 设置
     */
    setup() {
        this.button = document.getElementById('danmaku-settings-btn');
        if (!this.button) {
            console.warn('[弹幕设置] 按钮未找到');
            return;
        }
        
        // 加载保存的设置
        this.loadSettings();
        
        // 绑定按钮事件
        this.button.addEventListener('click', () => {
            this.toggle();
        });
    }
    
    /**
     * 加载保存的设置
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('danmakuSettings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (e) {
            console.warn('[弹幕设置] 加载设置失败', e);
        }
        
        // 应用设置
        this.applySettings();
    }
    
    /**
     * 保存设置
     */
    saveSettings() {
        try {
            localStorage.setItem('danmakuSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('[弹幕设置] 保存设置失败', e);
        }
    }
    
    /**
     * 应用设置
     */
    applySettings() {
        // 应用弹幕类型筛选
        if (window.flyingDanmakuManager) {
            Object.keys(this.settings.filters).forEach(type => {
                window.flyingDanmakuManager.setTypeEnabled(type, this.settings.filters[type]);
            });
        }
        
        // 应用飞行速度
        if (window.flyingDanmakuManager) {
            window.flyingDanmakuManager.setSpeed(this.settings.speed);
        }
        
        // 应用透明度
        if (window.flyingDanmakuManager) {
            window.flyingDanmakuManager.setOpacity(this.settings.opacity);
        }
    }
    
    /**
     * 切换设置窗口
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    /**
     * 打开设置窗口
     */
    open() {
        if (this.modal) {
            this.modal.remove();
        }
        
        this.createModal();
        this.isOpen = true;
        this.button.classList.add('active');
    }
    
    /**
     * 关闭设置窗口
     */
    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
        this.isOpen = false;
        this.button.classList.remove('active');
    }
    
    /**
     * 创建设置模态窗口
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            max-width: 450px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        dialog.innerHTML = `
            <h2 style="margin: 0 0 25px 0; color: #333; text-align: center;">⚙️ 弹幕设置</h2>
            
            <!-- 弹幕类型筛选 -->
            <div style="margin-bottom: 25px; padding: 20px; background: #f5f5f5; border-radius: 10px;">
                <h3 style="margin: 0 0 15px 0; color: #555; font-size: 16px;">📋 弹幕类型筛选</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="filter-chat" ${this.settings.filters.chat ? 'checked' : ''} 
                            style="width: 18px; height: 18px; cursor: pointer; accent-color: #667eea;">
                        <span style="font-size: 14px; color: #333;">💬 聊天消息</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="filter-gift" ${this.settings.filters.gift ? 'checked' : ''}
                            style="width: 18px; height: 18px; cursor: pointer; accent-color: #667eea;">
                        <span style="font-size: 14px; color: #333;">🎁 礼物消息</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="filter-like" ${this.settings.filters.like ? 'checked' : ''}
                            style="width: 18px; height: 18px; cursor: pointer; accent-color: #667eea;">
                        <span style="font-size: 14px; color: #333;">❤️ 点赞消息</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="filter-member" ${this.settings.filters.member ? 'checked' : ''}
                            style="width: 18px; height: 18px; cursor: pointer; accent-color: #667eea;">
                        <span style="font-size: 14px; color: #333;">👋 进场消息</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="filter-follow" ${this.settings.filters.follow ? 'checked' : ''}
                            style="width: 18px; height: 18px; cursor: pointer; accent-color: #667eea;">
                        <span style="font-size: 14px; color: #333;">⭐ 关注消息</span>
                    </label>
                </div>
            </div>
            
            <!-- 飞行速度 -->
            <div style="margin-bottom: 25px; padding: 20px; background: #f5f5f5; border-radius: 10px;">
                <h3 style="margin: 0 0 15px 0; color: #555; font-size: 16px;">🚀 飞行速度</h3>
                <input type="range" id="speed-slider" min="3" max="15" value="${this.settings.speed}" step="1"
                    style="width: 100%; height: 6px; border-radius: 3px; outline: none; -webkit-appearance: none; 
                    background: linear-gradient(to right, rgba(102, 126, 234, 0.2), rgba(102, 126, 234, 1));">
                <div id="speed-value" style="text-align: center; margin-top: 10px; font-size: 14px; font-weight: bold; color: #667eea;">
                    ${this.settings.speed}秒
                </div>
            </div>
            
            <!-- 透明度 -->
            <div style="margin-bottom: 25px; padding: 20px; background: #f5f5f5; border-radius: 10px;">
                <h3 style="margin: 0 0 15px 0; color: #555; font-size: 16px;">👁️ 透明度</h3>
                <input type="range" id="opacity-slider" min="0.1" max="1" value="${this.settings.opacity}" step="0.05"
                    style="width: 100%; height: 6px; border-radius: 3px; outline: none; -webkit-appearance: none;
                    background: linear-gradient(to right, rgba(102, 126, 234, 0.2), rgba(102, 126, 234, 1));">
                <div id="opacity-value" style="text-align: center; margin-top: 10px; font-size: 14px; font-weight: bold; color: #667eea;">
                    ${Math.round(this.settings.opacity * 100)}%
                </div>
            </div>
            
            <!-- 按钮组 -->
            <div style="display: flex; gap: 10px;">
                <button id="settings-confirm"
                    style="flex: 1; padding: 14px; background: #4CAF50; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; font-weight: bold;">
                    保存设置
                </button>
                <button id="settings-cancel"
                    style="flex: 1; padding: 14px; background: #f44336; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; font-weight: bold;">
                    取消
                </button>
            </div>
        `;
        
        this.modal.appendChild(dialog);
        document.body.appendChild(this.modal);
        
        // 绑定事件
        this.bindModalEvents();
    }
    
    /**
     * 绑定模态窗口事件
     */
    bindModalEvents() {
        // 筛选复选框
        ['chat', 'gift', 'like', 'member', 'follow'].forEach(type => {
            const checkbox = document.getElementById(`filter-${type}`);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.settings.filters[type] = e.target.checked;
                });
            }
        });
        
        // 速度滑块
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.settings.speed = value;
                speedValue.textContent = `${value}秒`;
            });
        }
        
        // 透明度滑块
        const opacitySlider = document.getElementById('opacity-slider');
        const opacityValue = document.getElementById('opacity-value');
        if (opacitySlider && opacityValue) {
            opacitySlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.settings.opacity = value;
                opacityValue.textContent = `${Math.round(value * 100)}%`;
            });
        }
        
        // 确定按钮
        const confirmBtn = document.getElementById('settings-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.saveSettings();
                this.applySettings();
                this.close();
            });
        }
        
        // 取消按钮
        const cancelBtn = document.getElementById('settings-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.close();
            });
        }
        
        // 点击背景关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    }
}

// 创建全局实例
window.danmakuSettingsManager = new DanmakuSettingsManager();