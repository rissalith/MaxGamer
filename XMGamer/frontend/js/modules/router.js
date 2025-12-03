/**
 * 路由模块
 * 负责页面导航和路由管理
 */

const Router = {
    currentRoute: 'game-market',
    
    /**
     * 路由配置
     */
    routes: {
        'game-market': {
            title: '游戏市场',
            page: 'pages/game-market.html',
            init: () => {
                if (window.GameMarket) {
                    GameMarket.init();
                }
            }
        },
        'my-apps': {
            title: '我的应用',
            page: 'pages/my-apps.html',
            init: () => {
                if (window.MyApps) {
                    MyApps.init();
                }
            }
        },
        'analytics': {
            title: '数据统计',
            page: 'pages/analytics.html',
            init: () => {
                if (window.Analytics) {
                    Analytics.init();
                }
            }
        },
        'logs': {
            title: '游戏日志',
            page: 'pages/logs.html',
            init: () => {
                if (window.GameLogs) {
                    GameLogs.init();
                }
            }
        },
        'wallet': {
            title: '充值中心',
            page: 'pages/wallet.html',
            init: () => {
                if (window.WalletManager) {
                    WalletManager.init();
                }
            }
        },
        'settings': {
            title: '账号设置',
            page: 'pages/settings.html',
            init: () => {
                // 加载设置页面的CSS
                if (!document.querySelector('link[href*="settings.css"]')) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = 'css/settings.css';
                    document.head.appendChild(link);
                }
                // 初始化设置管理器
                if (window.SettingsManager) {
                    SettingsManager.init();
                }
            }
        },
        // 管理员路由
        'admin-games': {
            title: '游戏库管理',
            page: 'pages/admin-games.html',
            adminOnly: true,
            init: () => {
                if (window.AdminGames) {
                    AdminGames.init();
                }
            }
        },
        'admin-users': {
            title: '用户管理',
            page: 'pages/admin-users.html',
            adminOnly: true,
            init: () => {
                if (window.AdminUsers) {
                    AdminUsers.init();
                }
            }
        },
        'admin-logs': {
            title: '管理日志',
            page: 'pages/admin-logs.html',
            adminOnly: true,
            init: () => {
                if (window.AdminLogs) {
                    AdminLogs.init();
                }
            }
        },
        // 创作者路由
        'creator-games': {
            title: '我的游戏库',
            page: 'pages/creator-games.html',
            creatorOnly: true,
            init: () => {
                if (window.CreatorGames) {
                    CreatorGames.init();
                }
            }
        }
    },
    
    /**
     * 游戏配置
     */
    games: {
        'fortune-game': {
            name: '巫女占卜',
            url: '/fortune-game/index.html',
            width: 1200,
            height: 800
        }
    },
    
    /**
     * 打开游戏
     * @param {string} gameId - 游戏ID
     */
    openGame(gameId) {
        const game = this.games[gameId];
        if (!game) {
            console.error(`游戏不存在: ${gameId}`);
            return;
        }
        
        // 在新窗口打开游戏
        const features = `width=${game.width},height=${game.height},menubar=no,toolbar=no,location=no,status=no`;
        const gameWindow = window.open(game.url, game.name, features);
        
        if (gameWindow) {
            gameWindow.focus();
            console.log(`已打开游戏: ${game.name}`);
        } else {
            alert('无法打开游戏窗口，请检查浏览器弹窗设置');
        }
    },
    
    /**
     * 导航到指定路由
     * @param {string} route - 路由名称
     */
    async navigate(route) {
        if (!this.routes[route]) {
            console.error(`路由不存在: ${route}`);
            return;
        }
        
        // 更新当前路由
        this.currentRoute = route;
        
        // 更新路由配置
        const routeConfig = this.routes[route];
        
        // 更新浏览器标题
        document.title = `${routeConfig.title} - XMGamer`;
        
        // 更新菜单active状态
        this._updateMenuState(route);
        
        // 加载页面内容
        if (routeConfig.page) {
            await this._loadPage(routeConfig.page);
        }
        
        // 执行路由初始化
        if (routeConfig.init) {
            routeConfig.init();
        }
        
        console.log(`导航到: ${route}`);
    },
    
    /**
     * 加载页面内容
     * @private
     */
    async _loadPage(pageUrl) {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) {
            console.error('主内容区域不存在');
            return;
        }
        
        try {
            const response = await fetch(pageUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            mainContent.innerHTML = html;
            
            // 执行加载的脚本标签
            this._executeScripts(mainContent);
            
            // 重新绑定页面内的事件
            this._bindPageEvents();
            
            console.log(`页面已加载: ${pageUrl}`);
        } catch (error) {
            console.error(`加载页面失败: ${pageUrl}`, error);
            mainContent.innerHTML = '<div style="padding: 20px; text-align: center;">页面加载失败</div>';
        }
    },
    
    /**
     * 执行容器内的脚本标签
     * @private
     */
    _executeScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            
            // 复制属性
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            
            // 复制内容
            newScript.textContent = oldScript.textContent;
            
            // 替换旧脚本
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    },
    
    /**
     * 绑定页面内的事件
     * @private
     */
    _bindPageEvents() {
        // 重新绑定游戏卡片点击事件
        document.querySelectorAll('.game-card:not(.coming-soon)').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const gameId = card.dataset.game;
                if (gameId) {
                    this.openGame(gameId);
                }
            });
        });
        
        // 重新绑定游戏按钮点击事件
        document.querySelectorAll('.btn-play:not(:disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.game-card');
                const gameId = card?.dataset.game;
                if (gameId) {
                    this.openGame(gameId);
                }
            });
        });
        
        // 重新初始化游戏市场视图切换（如果存在）
        if (window.App && window.App._initGameMarketView) {
            window.App._initGameMarketView();
        }
        
        // 如果是设置页面，初始化设置管理器
        if (this.currentRoute === 'settings' && window.SettingsManager) {
            SettingsManager.init();
        }
        
        // 应用多语言翻译
        if (window.I18n) {
            I18n.applyTranslations();
        }
    },
    
    /**
     * 更新菜单active状态
     * @private
     */
    _updateMenuState(route) {
        document.querySelectorAll('.menu-item').forEach(item => {
            if (item.dataset.page === route) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },
    
    /**
     * 初始化路由系统
     */
    init() {
        console.log('路由系统初始化...');
        
        // 绑定菜单点击事件
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    this.navigate(page);
                }
            });
        });
        
        // 初始化当前路由（异步）
        this.navigate(this.currentRoute).then(() => {
            console.log('初始路由加载完成');
        });
        
        console.log('路由系统已初始化 ✅');
    },
    
    /**
     * 获取当前路由
     */
    getCurrentRoute() {
        return this.currentRoute;
    }
};

// 导出模块
window.Router = Router;