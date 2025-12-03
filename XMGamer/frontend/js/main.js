/**
 * 主入口文件
 * XMGamer - 直播互动游戏平台
 */

const App = {
    /**
     * 初始化应用
     */
    init() {
        console.log('XMGamer 正在初始化...');
        
        // 初始化认证管理器
        AuthManager.init();
        
        // 检查登录状态
        if (!AuthManager.isLoggedIn()) {
            // 未登录，跳转到登录页
            window.location.href = '/login.html';
            return;
        }
        
        // 初始化路由系统
        Router.init();
        
        // 更新用户信息显示
        this._updateUserDisplay();
        
        // 加载用户余额
        this._loadUserBalance();
        
        // 绑定用户菜单事件
        this._bindUserMenuEvents();
        
        // 绑定充值按钮事件
        this._bindRechargeButton();
        
        // 监听认证状态变化
        this._bindAuthEvents();
        
        // 初始化游戏市场视图切换
        this._initGameMarketView();
        
        // 初始化游戏市场模块
        if (window.GameMarket) {
            GameMarket.init();
        }
        
        console.log('MaxGamer V1.0 已加载 ✅');
        console.log('欢迎来到直播互动游戏平台！');
    },
    
    /**
     * 绑定充值按钮事件
     * @private
     */
    _bindRechargeButton() {
        const btnRecharge = document.getElementById('btnRecharge');
        const balanceCard = document.getElementById('balanceCard');
        
        const handleRecharge = () => {
            // 导航到充值中心
            if (window.Router) {
                Router.navigate('wallet');
            }
        };
        
        if (btnRecharge) {
            btnRecharge.addEventListener('click', (e) => {
                e.stopPropagation();
                handleRecharge();
            });
        }
        
        if (balanceCard) {
            balanceCard.addEventListener('click', handleRecharge);
        }
    },
    
    /**
     * 初始化游戏市场视图切换功能
     * @private
     */
    _initGameMarketView() {
        const viewButtons = document.querySelectorAll('.view-btn');
        const gamesGrid = document.querySelector('.games-grid');
        
        if (!viewButtons.length || !gamesGrid) return;
        
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const viewMode = btn.dataset.view;
                
                // 更新按钮状态
                viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 更新视图模式
                gamesGrid.dataset.viewMode = viewMode;
                
                // 保存用户偏好
                localStorage.setItem('gameMarketViewMode', viewMode);
            });
        });
        
        // 恢复用户上次选择的视图模式
        const savedViewMode = localStorage.getItem('gameMarketViewMode');
        if (savedViewMode) {
            const targetBtn = document.querySelector(`.view-btn[data-view="${savedViewMode}"]`);
            if (targetBtn) {
                targetBtn.click();
            }
        }
    },

    /**
     * 绑定用户菜单事件
     * @private
     */
    _bindUserMenuEvents() {
        const userProfile = document.getElementById('userProfile');
        const userMenu = document.getElementById('userMenu');
        
        if (userProfile && userMenu) {
            // 切换菜单显示
            userProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = userMenu.style.display === 'block';
                userMenu.style.display = isVisible ? 'none' : 'block';
            });
            
            // 点击其他地方关闭菜单
            document.addEventListener('click', () => {
                userMenu.style.display = 'none';
            });
            
            // 菜单选项点击事件
            userMenu.querySelectorAll('.menu-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = option.dataset.action;
                    this._handleMenuAction(action);
                    userMenu.style.display = 'none';
                });
            });
        }
    },
    
    /**
     * 处理菜单操作
     * @private
     */
    _handleMenuAction(action) {
        switch (action) {
            case 'settings':
                // 导航到设置页面
                if (window.Router) {
                    Router.navigate('settings');
                }
                break;
            case 'wallet':
                // 导航到充值中心
                if (window.Router) {
                    Router.navigate('wallet');
                }
                break;
            case 'admin':
                // 导航到用户管理页面
                if (window.Router) {
                    Router.navigate('admin-users');
                }
                break;
            case 'logout':
                const logoutMsg = window.I18n ? I18n.t('logout_confirm') : '确定要退出登录吗？';
                if (confirm(logoutMsg)) {
                    AuthManager.logout();
                }
                break;
        }
    },
    
    /**
     * 更新用户信息显示
     * @private
     */
    _updateUserDisplay() {
        const user = AuthManager.getCurrentUser();
        if (!user) return;
        
        // 更新用户名
        const userNameEl = document.querySelector('.user-name');
        if (userNameEl) {
            userNameEl.textContent = user.nickname || user.phone || user.email || '游戏玩家';
        }
        
        // 更新用户角色
        const userRoleEl = document.getElementById('userRole');
        if (userRoleEl) {
            if (user.role === 'admin') {
                userRoleEl.textContent = '管理员';
                userRoleEl.className = 'user-role admin';
            } else if (user.role === 'creator') {
                userRoleEl.textContent = '创作者';
                userRoleEl.className = 'user-role creator';
            } else {
                userRoleEl.textContent = '';
                userRoleEl.className = 'user-role';
            }
        }
        
        // 显示/隐藏管理员菜单（用户下拉菜单中的选项）
        const adminMenuOption = document.getElementById('adminMenuOption');
        if (adminMenuOption) {
            adminMenuOption.style.display = user.role === 'admin' ? 'flex' : 'none';
        }
        
        // 显示/隐藏管理员侧边栏菜单组
        const adminMenuGroup = document.getElementById('adminMenuGroup');
        if (adminMenuGroup) {
            adminMenuGroup.style.display = user.role === 'admin' ? 'block' : 'none';
        }
        
        // 显示/隐藏创作者侧边栏菜单组
        const creatorMenuGroup = document.getElementById('creatorMenuGroup');
        if (creatorMenuGroup) {
            // 创作者和管理员都可以看到创作者菜单
            creatorMenuGroup.style.display = (user.role === 'creator' || user.role === 'admin') ? 'block' : 'none';
        }
        
        // 更新余额显示
        const userBalanceEl = document.getElementById('userBalance');
        if (userBalanceEl) {
            const balance = user.balance || 0;
            userBalanceEl.textContent = balance.toLocaleString();
        }
    },
    
    /**
     * 加载用户余额
     * @private
     */
    async _loadUserBalance() {
        try {
            const response = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/wallet`
            );
            const data = await response.json();
            
            if (data.success && data.wallet) {
                const userBalanceEl = document.getElementById('userBalance');
                if (userBalanceEl) {
                    userBalanceEl.textContent = data.wallet.balance.toLocaleString();
                }
            }
        } catch (error) {
            console.error('加载余额失败:', error);
        }
    },
    
    /**
     * 绑定认证相关事件
     * @private
     */
    _bindAuthEvents() {
        // 监听用户信息更新
        window.addEventListener('userInfoUpdated', (e) => {
            this._updateUserDisplay();
        });
        
        // 监听认证状态变化
        window.addEventListener('authStateChanged', (e) => {
            if (!e.detail.isAuthenticated) {
                // 已退出登录，跳转到登录页
                window.location.href = '/login.html';
            }
        });
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