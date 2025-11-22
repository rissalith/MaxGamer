/**
 * 路由模块
 * 负责页面导航和路由管理
 */

const Router = {
    currentRoute: 'frame-animation',
    
    /**
     * 路由配置
     */
    routes: {
        'frame-animation': {
            title: '帧动画生成',
            init: function() {
                // 帧动画页面已经是默认显示的
                console.log('路由: 帧动画生成页面');
            }
        }
        // 未来可以添加更多路由
        // 'other-feature': {
        //     title: '其他功能',
        //     init: function() { ... }
        // }
    },
    
    /**
     * 导航到指定路由
     * @param {string} route - 路由名称
     */
    navigate(route) {
        if (!this.routes[route]) {
            console.error(`路由不存在: ${route}`);
            return;
        }
        
        // 更新当前路由
        this.currentRoute = route;
        
        // 更新页面标题
        const routeConfig = this.routes[route];
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.textContent = routeConfig.title;
        }
        
        // 更新菜单active状态
        this._updateMenuState(route);
        
        // 执行路由初始化
        if (routeConfig.init) {
            routeConfig.init();
        }
        
        console.log(`导航到: ${route}`);
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
        
        // 初始化当前路由
        this.navigate(this.currentRoute);
        
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