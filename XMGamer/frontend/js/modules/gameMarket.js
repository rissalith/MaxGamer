/**
 * 游戏市场模块
 * 处理游戏展示、购买、启动等功能
 */

const GameMarket = {
    games: [],
    licenses: [],
    products: [],
    selectedProduct: null,
    userBalance: 0,
    
    /**
     * 初始化游戏市场
     */
    async init() {
        console.log('[GameMarket] 初始化游戏市场...');
        this.bindEvents();
        await this.loadData();
        console.log('[GameMarket] 游戏市场已初始化 ✅');
    },

    /**
     * 加载数据
     */
    async loadData() {
        try {
            await Promise.all([
                this.loadGames(),
                this.loadUserLicenses(),
                this.loadProducts(),
                this.loadUserBalance()
            ]);
            this.renderGames();
        } catch (error) {
            console.error('[GameMarket] 加载数据失败:', error);
        }
    },

    /**
     * 加载游戏列表
     */
    async loadGames() {
        try {
            // 尝试从 API 加载游戏
            const response = await fetch(`${AuthManager.apiBaseUrl}/admin/games`.replace('/admin/', '/'));
            
            // 如果 API 不存在，使用默认数据
            if (!response.ok) {
                this.games = this.getDefaultGames();
                return;
            }
            
            const data = await response.json();
            this.games = data.games || this.getDefaultGames();
        } catch (error) {
            console.error('[GameMarket] 加载游戏列表失败:', error);
            this.games = this.getDefaultGames();
        }
    },

    /**
     * 获取默认游戏列表
     */
    getDefaultGames() {
        return [
            {
                id: 'fortune-game',
                name: '巫女占卜',
                description: 'AI驱动的直播互动占卜游戏',
                cover_url: '/fortune-game/images/cover.jpg',
                price: 500,
                duration_days: 30,
                status: 'published',
                category: '直播互动',
                tags: ['AI', '占卜', '直播']
            }
        ];
    },

    /**
     * 加载用户授权
     */
    async loadUserLicenses() {
        if (!AuthManager.isLoggedIn()) {
            this.licenses = [];
            return;
        }
        
        try {
            const response = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/products/my-licenses`
            );
            const data = await response.json();
            this.licenses = data.licenses || [];
        } catch (error) {
            console.error('[GameMarket] 加载授权失败:', error);
            this.licenses = [];
        }
    },

    /**
     * 加载游戏商品（套餐）
     */
    async loadProducts() {
        try {
            const response = await fetch(`${AuthManager.apiBaseUrl}/products?category=game`);
            const data = await response.json();
            this.products = data.products || [];
        } catch (error) {
            console.error('[GameMarket] 加载商品失败:', error);
            this.products = [];
        }
    },

    /**
     * 加载用户余额
     */
    async loadUserBalance() {
        if (!AuthManager.isLoggedIn()) {
            this.userBalance = 0;
            return;
        }
        
        try {
            const response = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/wallet`
            );
            const data = await response.json();
            this.userBalance = data.wallet?.balance || 0;
        } catch (error) {
            console.error('[GameMarket] 加载余额失败:', error);
            this.userBalance = 0;
        }
    },

    /**
     * 渲染游戏列表
     */
    renderGames() {
        const grid = document.getElementById('gamesGrid');
        const countEl = document.getElementById('gameCount');
        if (!grid) return;

        const publishedGames = this.games.filter(g => g.status === 'published');
        
        // 更新计数
        if (countEl) {
            countEl.textContent = `${publishedGames.length} 个游戏`;
        }
        
        if (publishedGames.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎮</div>
                    <h3>暂无游戏</h3>
                    <p>更多精彩游戏即将上线</p>
                </div>
            `;
            return;
        }

        const gameCards = publishedGames.map(game => this.renderGameCard(game)).join('');
        
        // 添加"敬请期待"卡片
        const comingSoonCard = `
            <div class="game-card coming-soon">
                <div class="game-card-image">
                    <div class="game-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                            <circle cx="8" cy="10" r="1.5" fill="currentColor"/>
                            <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
                            <circle cx="8" cy="14" r="1.5" fill="currentColor"/>
                            <circle cx="16" cy="14" r="1.5" fill="currentColor"/>
                            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                        </svg>
                    </div>
                </div>
                <div class="game-card-content">
                    <h4 class="game-title">敬请期待</h4>
                    <p class="game-description">更多精彩游戏即将上线</p>
                </div>
                <div class="game-card-footer">
                    <button class="btn-game-action disabled" disabled>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>即将推出</span>
                    </button>
                </div>
            </div>
        `;

        grid.innerHTML = gameCards + comingSoonCard;
    },

    /**
     * 渲染单个游戏卡片
     */
    renderGameCard(game) {
        const license = this.licenses.find(l => l.game_id === game.id && l.status === 'active');
        const hasLicense = !!license;
        
        // SVG 图标
        const gameIcons = {
            'fortune-game': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v2M12 16v2M6 12h2M16 12h2"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>`,
            'default': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <circle cx="8" cy="12" r="2"/>
                <path d="M14 10h4M16 8v4"/>
            </svg>`
        };
        const iconSvg = gameIcons[game.id] || gameIcons.default;

        // 价格/状态徽章
        let badgeHtml = '';
        let buttonHtml = '';
        
        if (hasLicense) {
            badgeHtml = `<div class="game-price-badge owned">已拥有</div>`;
            buttonHtml = `
                <button class="btn-game-action secondary" onclick="GameMarket.configureGame('${game.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    <span>配置</span>
                </button>
                <button class="btn-game-action primary" onclick="GameMarket.launchGame('${game.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    <span>启动</span>
                </button>
            `;
        } else {
            const priceText = game.price > 0 ? `${game.price} MP/月` : '免费';
            badgeHtml = `<div class="game-price-badge">${priceText}</div>`;
            buttonHtml = `
                <button class="btn-game-action purchase" onclick="GameMarket.openPurchaseModal('${game.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v12M6 12h12"/>
                    </svg>
                    <span>${game.price > 0 ? game.price + ' MP' : '免费获取'}</span>
                </button>
            `;
        }

        const tagsHtml = (game.tags || []).slice(0, 3).map(tag => 
            `<span class="tag">${tag}</span>`
        ).join('');

        return `
            <div class="game-card" data-game="${game.id}">
                ${badgeHtml}
                <div class="game-card-image">
                    <div class="game-icon">${iconSvg}</div>
                </div>
                <div class="game-card-content">
                    <h4 class="game-title">${game.name}</h4>
                    <p class="game-description">${game.description}</p>
                    <div class="game-tags">${tagsHtml}</div>
                </div>
                <div class="game-card-footer">
                    ${buttonHtml}
                </div>
            </div>
        `;
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 视图切换
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-btn')) {
                this.switchView(e.target.dataset.view);
            }
        });
    },

    /**
     * 打开购买弹窗
     */
    openPurchaseModal(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        // 获取该游戏的套餐
        const gameProducts = this.products.filter(p => p.game_id === gameId);
        
        // 如果没有套餐，使用默认套餐
        const plans = gameProducts.length > 0 ? gameProducts : [
            { id: `${gameId}_30d`, name: '月度版', price: game.price, duration_days: 30 }
        ];

        // SVG 图标
        const iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:40px;height:40px;color:#667eea;">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v2M12 16v2M6 12h2M16 12h2"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>`;

        // 更新弹窗内容
        document.getElementById('purchaseGameIcon').innerHTML = iconSvg;
        document.getElementById('purchaseGameName').textContent = game.name;
        document.getElementById('purchaseGameDesc').textContent = game.description;
        document.getElementById('purchaseBalance').textContent = `${this.userBalance.toLocaleString()} MP`;

        // 渲染套餐选项
        const plansHtml = plans.map((plan, index) => {
            const duration = plan.duration_days ? `${plan.duration_days}天` : '永久';
            return `
                <div class="plan-option ${index === 0 ? 'selected' : ''}" 
                     data-product-id="${plan.id}" 
                     data-price="${plan.price}"
                     onclick="GameMarket.selectPlan(this)">
                    <div class="plan-radio"></div>
                    <div class="plan-info">
                        <div class="plan-name">${plan.name}</div>
                        <div class="plan-duration">${duration}</div>
                    </div>
                    <div class="plan-price">${plan.price.toLocaleString()} MP</div>
                </div>
            `;
        }).join('');

        document.getElementById('purchasePlans').innerHTML = plansHtml;
        
        // 更新总价
        if (plans.length > 0) {
            this.selectedProduct = plans[0];
            document.getElementById('purchaseTotal').textContent = `${plans[0].price.toLocaleString()} MP`;
        }

        // 检查余额是否足够
        this.updatePurchaseButton();

        // 显示弹窗
        document.getElementById('purchaseModal').style.display = 'flex';
    },

    /**
     * 选择套餐
     */
    selectPlan(element) {
        // 移除其他选中状态
        document.querySelectorAll('.plan-option').forEach(el => {
            el.classList.remove('selected');
        });
        
        // 选中当前
        element.classList.add('selected');
        
        // 更新选中的产品
        const productId = element.dataset.productId;
        const price = parseInt(element.dataset.price);
        
        this.selectedProduct = this.products.find(p => p.id === productId) || { id: productId, price };
        
        // 更新总价
        document.getElementById('purchaseTotal').textContent = `${price.toLocaleString()} MP`;
        
        // 更新按钮状态
        this.updatePurchaseButton();
    },

    /**
     * 更新购买按钮状态
     */
    updatePurchaseButton() {
        const btn = document.getElementById('btnConfirmPurchase');
        if (!this.selectedProduct) {
            btn.disabled = true;
            btn.textContent = '请选择套餐';
            return;
        }
        
        const canAfford = this.userBalance >= this.selectedProduct.price;
        btn.disabled = !canAfford;
        btn.textContent = canAfford ? '确认购买' : '余额不足';
    },

    /**
     * 关闭购买弹窗
     */
    closePurchaseModal() {
        document.getElementById('purchaseModal').style.display = 'none';
        this.selectedProduct = null;
    },

    /**
     * 确认购买
     */
    async confirmPurchase() {
        if (!this.selectedProduct) return;

        const btn = document.getElementById('btnConfirmPurchase');
        btn.disabled = true;
        btn.textContent = '处理中...';

        try {
            const response = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/products/purchase`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: this.selectedProduct.id })
                }
            );

            const data = await response.json();

            if (data.success) {
                this.closePurchaseModal();
                this.showMessage('🎉 购买成功！', 'success');
                
                // 刷新数据
                await this.loadData();
                
                // 更新侧边栏余额
                if (window.WalletManager) {
                    WalletManager.refreshBalance();
                }
                
                // 更新全局余额显示
                const balanceEl = document.getElementById('userBalance');
                if (balanceEl && data.balance !== undefined) {
                    balanceEl.textContent = data.balance.toLocaleString();
                }
            } else {
                throw new Error(data.message || '购买失败');
            }
        } catch (error) {
            console.error('[GameMarket] 购买失败:', error);
            this.showMessage(error.message || '购买失败', 'error');
            btn.disabled = false;
            btn.textContent = '确认购买';
        }
    },

    /**
     * 配置游戏
     */
    configureGame(gameId) {
        // 跳转到我的应用页面
        if (window.Router) {
            Router.navigate('my-apps');
        }
    },

    /**
     * 启动游戏
     */
    async launchGame(gameId) {
        console.log(`[GameMarket] 启动游戏: ${gameId}`);

        if (!AuthManager.isLoggedIn()) {
            this.showMessage('请先登录', 'warning');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);
            return;
        }

        try {
            this.showMessage('正在启动游戏...', 'info');

            const response = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/games/launch`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ game_id: gameId })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '启动游戏失败');
            }

            this.showMessage('游戏启动成功！', 'success');

            // 在新窗口打开游戏
            window.open(data.launch_url, '_blank', 'width=1200,height=800');

        } catch (error) {
            console.error('[GameMarket] 启动游戏失败:', error);
            this.showMessage(error.message || '启动游戏失败', 'error');
        }
    },

    /**
     * 切换视图模式
     */
    switchView(viewMode) {
        const gamesGrid = document.querySelector('.games-grid');
        const viewBtns = document.querySelectorAll('.view-btn');

        if (gamesGrid) {
            gamesGrid.dataset.viewMode = viewMode;
        }

        viewBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewMode);
        });
        
        // 保存偏好
        localStorage.setItem('gameMarketViewMode', viewMode);
    },

    /**
     * 显示消息提示
     */
    showMessage(message, type = 'info') {
        const existingMsg = document.querySelector('.game-market-message');
        if (existingMsg) existingMsg.remove();

        const messageEl = document.createElement('div');
        messageEl.className = `game-market-message ${type}`;
        messageEl.textContent = message;

        Object.assign(messageEl.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            animation: 'slideDown 0.3s ease-out'
        });

        const colors = {
            info: '#3498db',
            success: '#2ecc71',
            warning: '#f39c12',
            error: '#e74c3c'
        };
        messageEl.style.background = colors[type] || colors.info;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => messageEl.remove(), 300);
        }, 3000);
    }
};

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes slideUp {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(style);

// 导出模块
window.GameMarket = GameMarket;
