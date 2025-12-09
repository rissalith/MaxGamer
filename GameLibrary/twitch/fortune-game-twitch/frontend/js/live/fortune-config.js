/**
 * 占卜配置面板管理器
 * 处理API Key和自定义规则的配置
 */

class FortuneConfigManager {
    constructor() {
        this.overlay = null;
        this.panel = null;
        this.apiKeyInput = null;
        this.customRulesInput = null;
        this.isOpen = false;
        
        // 初始化UI
        this.init();
    }
    
    /**
     * 初始化配置面板UI
     */
    init() {
        this.createConfigPanel();
        this.bindEvents();
    }
    
    /**
     * 创建配置面板
     */
    createConfigPanel() {
        // 创建遮罩层
        this.overlay = document.createElement('div');
        this.overlay.className = 'fortune-config-overlay';
        
        // 创建面板
        this.panel = document.createElement('div');
        this.panel.className = 'fortune-config-panel';
        this.panel.innerHTML = `
            <div class="fortune-config-header">
                <div class="fortune-config-header-title">占卜师配置</div>
                <button class="fortune-config-close">×</button>
            </div>
            <div class="fortune-config-content">
                <!-- API Key 配置 -->
                <div class="fortune-config-section">
                    <div class="fortune-config-label">
                        <span class="fortune-config-label-icon">🔑</span>
                        API Key
                    </div>
                    <div class="fortune-config-description">
                        请输入您的Gemini API Key。如果不填写，将使用默认配置。
                    </div>
                    <input 
                        type="text" 
                        class="fortune-config-input" 
                        id="fortune-api-key-input"
                        placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        maxlength="200"
                    >
                    <div class="fortune-config-hint">
                        <span class="fortune-config-hint-icon">💡</span>
                        默认API Key已预配置，您可以使用自己的Key以获得更好的服务质量。
                    </div>
                </div>
                
                <!-- 自定义规则配置 -->
                <div class="fortune-config-section">
                    <div class="fortune-config-label">
                        <span class="fortune-config-label-icon">📝</span>
                        自定义规则
                    </div>
                    <div class="fortune-config-description">
                        添加您自己的占卜规则，让占卜师更符合您的需求。每行一条规则。
                    </div>
                    <textarea 
                        class="fortune-config-input fortune-config-textarea" 
                        id="fortune-custom-rules-input"
                        placeholder="例如：&#10;- 回答要更加幽默风趣&#10;- 多使用网络流行语&#10;- 对年轻人要更加亲切"
                        maxlength="1000"
                    ></textarea>
                </div>
                
                <!-- 按钮区域 -->
                <div class="fortune-config-actions">
                    <button class="fortune-config-btn fortune-config-btn-primary" id="fortune-save-btn">
                        💾 保存配置
                    </button>
                    <button class="fortune-config-btn fortune-config-btn-secondary" id="fortune-reset-btn">
                        🔄 恢复默认
                    </button>
                    <button class="fortune-config-btn fortune-config-btn-danger" id="fortune-clear-history-btn">
                        🗑️ 清空对话
                    </button>
                </div>
                
                <!-- 消息提示区域 -->
                <div id="fortune-config-message"></div>
            </div>
        `;
        
        this.overlay.appendChild(this.panel);
        document.body.appendChild(this.overlay);
        
        // 获取元素引用
        this.apiKeyInput = document.getElementById('fortune-api-key-input');
        this.customRulesInput = document.getElementById('fortune-custom-rules-input');
        this.messageContainer = document.getElementById('fortune-config-message');
        
        // 加载当前配置
        this.loadCurrentConfig();
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 关闭按钮
        const closeBtn = this.panel.querySelector('.fortune-config-close');
        closeBtn.addEventListener('click', () => {
            this.close();
        });
        
        // 点击遮罩层关闭
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        // 保存按钮
        const saveBtn = document.getElementById('fortune-save-btn');
        saveBtn.addEventListener('click', () => {
            this.saveConfig();
        });
        
        // 恢复默认按钮
        const resetBtn = document.getElementById('fortune-reset-btn');
        resetBtn.addEventListener('click', () => {
            this.resetToDefault();
        });
        
        // 清空对话按钮
        const clearHistoryBtn = document.getElementById('fortune-clear-history-btn');
        clearHistoryBtn.addEventListener('click', () => {
            this.clearChatHistory();
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    /**
     * 打开配置面板
     */
    open() {
        this.overlay.classList.add('active');
        this.isOpen = true;
        this.loadCurrentConfig();
        this.clearMessage();
    }
    
    /**
     * 关闭配置面板
     */
    close() {
        this.overlay.classList.remove('active');
        this.isOpen = false;
        this.clearMessage();
    }
    
    /**
     * 加载当前配置
     */
    loadCurrentConfig() {
        try {
            // 从localStorage加载
            const savedApiKey = localStorage.getItem('fortune_api_key');
            const savedRules = localStorage.getItem('fortune_custom_rules');
            
            if (savedApiKey) {
                this.apiKeyInput.value = savedApiKey;
            } else {
                // 显示默认API Key（部分隐藏）
                const defaultKey = 'sk-4ITgC1TTgVh4pgJHidHsEf30z6Y9u44q9FdtVUQhpEZRqI1Y';
                this.apiKeyInput.value = defaultKey;
                this.apiKeyInput.placeholder = '使用默认API Key';
            }
            
            if (savedRules) {
                this.customRulesInput.value = savedRules;
            }
        } catch (error) {
            console.error('[配置面板] 加载配置失败:', error);
            this.showMessage('加载配置失败', 'error');
        }
    }
    
    /**
     * 保存配置
     */
    async saveConfig() {
        try {
            const apiKey = this.apiKeyInput.value.trim();
            const customRules = this.customRulesInput.value.trim();
            
            // 验证API Key格式
            if (apiKey && !this.validateApiKey(apiKey)) {
                this.showMessage('API Key格式不正确，请检查后重试', 'error');
                return;
            }
            
            // 保存到localStorage
            if (apiKey) {
                localStorage.setItem('fortune_api_key', apiKey);
            }
            
            if (customRules) {
                localStorage.setItem('fortune_custom_rules', customRules);
            } else {
                localStorage.removeItem('fortune_custom_rules');
            }
            
            // 更新对话管理器的配置
            if (window.fortuneChatManager) {
                window.fortuneChatManager.saveConfig(apiKey, customRules);
            }
            
            // 发送配置到后端
            await this.updateBackendConfig(apiKey, customRules);
            
            this.showMessage('配置保存成功！', 'success');
            
            // 2秒后自动关闭
            setTimeout(() => {
                this.close();
            }, 2000);
            
        } catch (error) {
            console.error('[配置面板] 保存配置失败:', error);
            this.showMessage('保存配置失败: ' + error.message, 'error');
        }
    }
    
    /**
     * 更新后端配置
     */
    async updateBackendConfig(apiKey, customRules) {
        const url = 'http://localhost:5000/api/fortune/config';
        
        const payload = {};
        if (apiKey) {
            payload.api_key = apiKey;
        }
        if (customRules) {
            payload.custom_rules = customRules;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '更新后端配置失败');
        }
        
        return await response.json();
    }
    
    /**
     * 验证API Key格式
     */
    validateApiKey(apiKey) {
        // 基本格式验证：以sk-开头，长度合理
        if (!apiKey.startsWith('sk-')) {
            return false;
        }
        if (apiKey.length < 20 || apiKey.length > 200) {
            return false;
        }
        return true;
    }
    
    /**
     * 恢复默认配置
     */
    resetToDefault() {
        if (confirm('确定要恢复默认配置吗？这将清除您的自定义设置。')) {
            // 恢复默认API Key
            const defaultKey = 'sk-4ITgC1TTgVh4pgJHidHsEf30z6Y9u44q9FdtVUQhpEZRqI1Y';
            this.apiKeyInput.value = defaultKey;
            
            // 清空自定义规则
            this.customRulesInput.value = '';
            
            // 清除localStorage
            localStorage.removeItem('fortune_api_key');
            localStorage.removeItem('fortune_custom_rules');
            
            // 更新对话管理器
            if (window.fortuneChatManager) {
                window.fortuneChatManager.saveConfig(defaultKey, '');
            }
            
            this.showMessage('已恢复默认配置', 'success');
        }
    }
    
    /**
     * 清空对话历史
     */
    clearChatHistory() {
        if (confirm('确定要清空所有对话记录吗？此操作无法撤销。')) {
            if (window.fortuneChatManager) {
                window.fortuneChatManager.clearHistory();
                this.showMessage('对话历史已清空', 'success');
                
                // 1秒后关闭
                setTimeout(() => {
                    this.close();
                }, 1000);
            } else {
                this.showMessage('对话管理器未初始化', 'error');
            }
        }
    }
    
    /**
     * 显示消息
     */
    showMessage(message, type = 'success') {
        this.messageContainer.innerHTML = '';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `fortune-config-${type}`;
        messageDiv.textContent = message;
        
        this.messageContainer.appendChild(messageDiv);
        
        // 5秒后自动清除消息
        setTimeout(() => {
            this.clearMessage();
        }, 5000);
    }
    
    /**
     * 清除消息
     */
    clearMessage() {
        if (this.messageContainer) {
            this.messageContainer.innerHTML = '';
        }
    }
}

// 创建全局实例
let fortuneConfigManager = null;

// 初始化函数
function initFortuneConfigManager() {
    if (!fortuneConfigManager) {
        fortuneConfigManager = new FortuneConfigManager();
        window.fortuneConfigManager = fortuneConfigManager;
    }
    return fortuneConfigManager;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FortuneConfigManager, initFortuneConfigManager };
}