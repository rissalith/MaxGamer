/**
 * 面板管理器 - 统一管理所有可最小化面板
 */
class PanelManager {
    constructor() {
        this.panels = {
            liveDanmaku: {
                panel: null,
                button: null,
                isMinimized: false,
                storageKey: 'liveDanmakuMinimized'
            },
            userPanel: {
                panel: null,
                button: null,
                isMinimized: false,
                storageKey: 'userPanelMinimized'
            }
        };
        
        this.init();
    }
    
    /**
     * 初始化面板管理器
     */
    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupPanels());
        } else {
            this.setupPanels();
        }
    }
    
    /**
     * 设置所有面板
     */
    setupPanels() {
        // 直播弹幕面板
        this.panels.liveDanmaku.panel = document.getElementById('live-danmaku-panel');
        this.panels.liveDanmaku.button = document.getElementById('live-danmaku-toggle');
        
        // 用户信息面板
        this.panels.userPanel.panel = document.getElementById('user-info-panel');
        this.panels.userPanel.button = document.getElementById('user-panel-toggle');
        
        // 恢复保存的状态
        this.restoreStates();
        
        // 绑定事件
        this.bindEvents();
    }
    
    /**
     * 恢复保存的面板状态
     */
    restoreStates() {
        // 默认所有面板都显示，不需要恢复状态
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 直播弹幕按钮
        if (this.panels.liveDanmaku.button) {
            this.panels.liveDanmaku.button.addEventListener('click', () => {
                this.togglePanel('liveDanmaku');
            });
        }
        
        // 用户面板按钮
        if (this.panels.userPanel.button) {
            this.panels.userPanel.button.addEventListener('click', () => {
                this.togglePanel('userPanel');
            });
        }
        
        // 直播弹幕面板关闭按钮
        const livePanelCloseBtn = document.querySelector('#live-danmaku-panel .live-panel-close');
        if (livePanelCloseBtn) {
            livePanelCloseBtn.onclick = () => {
                this.hidePanel('liveDanmaku');
            };
        }
        
        // 用户面板关闭按钮
        const userPanelCloseBtn = document.getElementById('close-user-panel');
        if (userPanelCloseBtn) {
            userPanelCloseBtn.addEventListener('click', () => {
                this.hidePanel('userPanel');
            });
        }
    }
    
    /**
     * 切换面板显示/隐藏
     */
    togglePanel(panelKey) {
        const panelData = this.panels[panelKey];
        if (!panelData || !panelData.panel) return;
        
        const isHidden = panelData.panel.classList.contains('hidden');
        if (isHidden) {
            this.showPanel(panelKey);
        } else {
            this.hidePanel(panelKey);
        }
    }
    
    /**
     * 隐藏面板
     */
    hidePanel(panelKey) {
        const panelData = this.panels[panelKey];
        if (!panelData || !panelData.panel) return;
        
        panelData.panel.classList.add('hidden');
        if (panelData.button) {
            panelData.button.classList.add('active');
        }
        
        console.log(`[面板管理器] ${panelKey} 已隐藏`);
    }
    
    /**
     * 显示面板
     */
    showPanel(panelKey) {
        const panelData = this.panels[panelKey];
        if (!panelData || !panelData.panel) return;
        
        panelData.panel.classList.remove('hidden');
        if (panelData.button) {
            panelData.button.classList.remove('active');
        }
        
        console.log(`[面板管理器] ${panelKey} 已显示`);
    }
}

// 创建全局实例
window.panelManager = new PanelManager();