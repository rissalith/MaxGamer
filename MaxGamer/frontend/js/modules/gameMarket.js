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
    selectedPlatforms: ['twitch', 'douyin'],  // 多选平台，默认选中 Twitch 和抖音
    disabledPlatforms: ['tiktok'],  // 禁用的平台
    
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
            const apiGames = data.games || [];

            // 使用默认游戏列表，API数据用于更新状态（如授权信息）
            const defaultGames = this.getDefaultGames();

            // 合并：默认游戏为基础，API数据覆盖相同ID的游戏属性
            this.games = defaultGames.map(defaultGame => {
                const apiGame = apiGames.find(g => g.id === defaultGame.id);
                if (apiGame) {
                    // 合并API数据，但保留默认游戏的name和platform
                    return {
                        ...defaultGame,
                        ...apiGame,
                        name: defaultGame.name,  // 使用默认名称
                        platform: defaultGame.platform,  // 使用默认平台
                        tags: defaultGame.tags  // 使用默认标签
                    };
                }
                return defaultGame;
            });
        } catch (error) {
            console.error('[GameMarket] 加载游戏列表失败:', error);
            this.games = this.getDefaultGames();
        }
    },

    /**
     * 获取默认游戏列表
     * 巫女上上签支持抖音、TikTok、Twitch三个平台，分开显示
     */
    getDefaultGames() {
        return [
            {
                id: 'fortune-game-douyin',
                name: '巫女上上签',
                name_zh: '巫女上上签',
                name_en: 'Miko Fortune',
                description: 'AI驱动的抖音直播互动占卜游戏',
                description_zh: 'AI驱动的抖音直播互动占卜游戏',
                description_en: 'AI-powered fortune telling game for Douyin Live',
                cover_url: '/fortune-game/images/cover.jpg',
                price: 500,
                duration_days: 30,
                status: 'published',
                category: this.t('category_live_interactive'),
                platform: 'douyin',
                platformIcon: 'fab fa-tiktok',
                platformColor: '#000000',
                tags: ['AI', this.t('tag_fortune'), this.t('tag_live'), '抖音']
            },
            {
                id: 'fortune-game-tiktok',
                name: 'Miko Fortune',
                name_zh: '巫女上上签',
                name_en: 'Miko Fortune',
                description: 'AI-powered fortune telling game for TikTok Live',
                description_zh: 'AI驱动的TikTok直播互动占卜游戏',
                description_en: 'AI-powered fortune telling game for TikTok Live',
                cover_url: '/fortune-game/images/cover.jpg',
                price: 500,
                duration_days: 30,
                status: 'published',
                category: this.t('category_live_interactive'),
                platform: 'tiktok',
                platformIcon: 'fab fa-tiktok',
                platformColor: '#69C9D0',
                tags: ['AI', this.t('tag_fortune'), this.t('tag_live'), 'TikTok']
            },
            {
                id: 'fortune-game-twitch',
                name: 'Miko Fortune',
                name_zh: '巫女上上签',
                name_en: 'Miko Fortune',
                description: 'AI-powered fortune telling game for Twitch Live',
                description_zh: 'AI驱动的Twitch直播互动占卜游戏',
                description_en: 'AI-powered fortune telling game for Twitch Live',
                cover_url: '/fortune-game/images/cover.jpg',
                price: 500,
                duration_days: 30,
                status: 'published',
                category: this.t('category_live_interactive'),
                platform: 'twitch',
                platformIcon: 'fab fa-twitch',
                platformColor: '#9146FF',
                tags: ['AI', this.t('tag_fortune'), this.t('tag_live'), 'Twitch']
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

        // 根据选中的平台过滤游戏（多选模式）
        let filteredGames = this.games.filter(g => g.status === 'published' || g.status === 'coming_soon');

        // 如果有选中的平台，按选中的平台过滤
        if (this.selectedPlatforms.length > 0) {
            filteredGames = filteredGames.filter(g => this.selectedPlatforms.includes(g.platform));
        }

        const publishedCount = filteredGames.filter(g => g.status === 'published').length;

        // 更新计数 - 支持国际化
        if (countEl) {
            const countText = window.I18n ? I18n.t('market_game_count').replace('{0}', filteredGames.length) : `${filteredGames.length} 个游戏`;
            countEl.textContent = countText;
        }

        if (filteredGames.length === 0) {
            const platformNames = this.selectedPlatforms.map(p => this.getPlatformName(p)).join('、');
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎮</div>
                    <h3>${this.t('game_coming_soon')}</h3>
                    <p>${platformNames ? platformNames + ' 平台' : ''}暂无游戏，敬请期待</p>
                </div>
            `;
            return;
        }

        // 渲染游戏卡片
        const gameCards = filteredGames.map(game => this.renderGameCard(game)).join('');

        grid.innerHTML = gameCards;
    },

    /**
     * 获取平台显示名称
     */
    getPlatformName(platform) {
        const names = {
            'douyin': '抖音',
            'tiktok': 'TikTok',
            'twitch': 'Twitch'
        };
        return names[platform] || platform;
    },

    /**
     * 渲染单个游戏卡片
     */
    renderGameCard(game) {
        const license = this.licenses.find(l => l.game_id === game.id && l.status === 'active');
        const hasLicense = !!license;
        const isComingSoon = game.status === 'coming_soon';

        // SVG 图标 - 统一使用占卜图标
        const fortuneIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v2M12 16v2M6 12h2M16 12h2"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>`;
        const iconSvg = fortuneIcon;

        // 平台配置
        const platformConfig = {
            'douyin': { label: '抖音', color: '#000000' },
            'tiktok': { label: 'TikTok', color: '#69C9D0' },
            'twitch': { label: 'Twitch', color: '#9146FF' }
        };
        const platform = game.platform || 'douyin';
        const config = platformConfig[platform] || platformConfig.douyin;
        const platformBadgeHtml = `<div class="platform-badge ${platform}" style="background: ${config.color}">${config.label}</div>`;

        // 价格/状态徽章
        let badgeHtml = '';
        let buttonHtml = '';

        if (isComingSoon) {
            // 即将上线
            badgeHtml = `<div class="game-price-badge coming-soon">${this.t('market_coming_soon') || '即将上线'}</div>`;
            buttonHtml = `
                <button class="btn-game-action disabled" disabled>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>${this.t('market_coming_soon') || '即将上线'}</span>
                </button>
            `;
        } else if (hasLicense) {
            // 已购买：只显示状态，引导用户去"我的应用"配置和启动
            badgeHtml = `<div class="game-price-badge owned">${this.t('market_owned')}</div>`;
            buttonHtml = `
                <button class="btn-game-action owned-hint" onclick="Router.navigate('my-apps')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                        <rect x="9" y="3" width="6" height="4" rx="1"/>
                        <path d="M9 12l2 2 4-4"/>
                    </svg>
                    <span>${this.t('market_go_to_my_apps')}</span>
                </button>
            `;
        } else {
            const priceText = game.price > 0 ? `${game.price} MP/mo` : this.t('market_free');
            badgeHtml = `<div class="game-price-badge">${priceText}</div>`;
            buttonHtml = `
                <button class="btn-game-action purchase" onclick="GameMarket.openPurchaseModal('${game.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v12M6 12h12"/>
                    </svg>
                    <span>${this.t('market_buy')}</span>
                </button>
            `;
        }

        const tagsHtml = (game.tags || []).slice(0, 3).map(tag =>
            `<span class="tag">${tag}</span>`
        ).join('');

        return `
            <div class="game-card ${isComingSoon ? 'coming-soon' : ''}" data-game="${game.id}">
                ${platformBadgeHtml}
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
     * 切换平台选择（多选模式）
     */
    togglePlatform(platform) {
        // 禁用的平台不可选择
        if (this.disabledPlatforms.includes(platform)) {
            return;
        }

        const index = this.selectedPlatforms.indexOf(platform);
        if (index > -1) {
            // 已选中，取消选择（但至少保留一个选中）
            if (this.selectedPlatforms.length > 1) {
                this.selectedPlatforms.splice(index, 1);
            }
        } else {
            // 未选中，添加选择
            this.selectedPlatforms.push(platform);
        }

        // 更新 Tab 样式
        document.querySelectorAll('.platform-tab').forEach(tab => {
            const tabPlatform = tab.dataset.platform;
            if (!this.disabledPlatforms.includes(tabPlatform)) {
                tab.classList.toggle('active', this.selectedPlatforms.includes(tabPlatform));
            }
        });

        // 重新渲染游戏列表
        this.renderGames();
    },

    /**
     * 获取翻译文本
     */
    t(key, ...args) {
        let text = window.I18n ? I18n.t(key) : key;
        // 替换占位符 {0}, {1} 等
        args.forEach((arg, i) => {
            text = text.replace(`{${i}}`, arg);
        });
        return text;
    },

    /**
     * 打开购买弹窗
     */
    openPurchaseModal(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        // 获取该游戏的套餐
        const gameProducts = this.products.filter(p => p.game_id === gameId);
        
        // 如果没有套餐，使用默认套餐（包含多个时长选项）
        const plans = gameProducts.length > 0 ? gameProducts : [
            { id: `${gameId}_30d`, nameKey: 'purchase_1month', price: game.price, duration_days: 30, periodKey: 'purchase_period_mo' },
            { id: `${gameId}_90d`, nameKey: 'purchase_3months', price: Math.round(game.price * 2.7), duration_days: 90, save: 10, periodKey: 'purchase_period_3mo' },
            { id: `${gameId}_365d`, nameKey: 'purchase_12months', price: Math.round(game.price * 8.4), duration_days: 365, save: 30, recommended: true, periodKey: 'purchase_period_yr' },
            { id: `${gameId}_forever`, nameKey: 'purchase_lifetime', price: Math.round(game.price * 20), duration_days: null, periodKey: 'purchase_period_once' }
        ];

        // SVG 图标
        const iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v2M12 16v2M6 12h2M16 12h2"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>`;

        // 更新弹窗标题和内容
        const modalTitle = document.querySelector('#purchaseModal .plans-title');
        if (modalTitle) modalTitle.textContent = this.t('purchase_choose_plan');
        
        const balanceLabel = document.querySelector('#purchaseModal .balance-label');
        if (balanceLabel) balanceLabel.textContent = this.t('purchase_balance');
        
        const totalLabel = document.querySelector('#purchaseModal .total-label');
        if (totalLabel) totalLabel.textContent = this.t('purchase_total');

        document.getElementById('purchaseGameIcon').innerHTML = iconSvg;
        document.getElementById('purchaseGameName').textContent = game.name;
        document.getElementById('purchaseGameDesc').textContent = game.description;
        document.getElementById('purchaseBalance').textContent = `${this.userBalance.toLocaleString()} MP`;

        // 找到推荐的套餐索引（默认选中推荐套餐，否则选第一个）
        const recommendedIndex = plans.findIndex(p => p.recommended);
        const defaultSelectedIndex = recommendedIndex >= 0 ? recommendedIndex : 0;

        // 渲染套餐卡片
        const plansHtml = plans.map((plan, index) => {
            const isSelected = index === defaultSelectedIndex;
            const planName = plan.nameKey ? this.t(plan.nameKey) : plan.name;
            const period = plan.periodKey ? this.t(plan.periodKey) : (plan.period || '');
            const saveHtml = plan.save ? `<div class="plan-save">${this.t('purchase_save', plan.save)}</div>` : '';
            const recommendBadge = plan.recommended ? `<div class="recommend-badge">${this.t('purchase_best_value')}</div>` : '';
            const popularBadge = index === 0 ? `<div class="popular-badge">${this.t('purchase_starter')}</div>` : '';
            
            return `
                <div class="plan-card ${isSelected ? 'selected' : ''} ${plan.recommended ? 'recommended' : ''}" 
                     data-product-id="${plan.id}" 
                     data-price="${plan.price}"
                     onclick="GameMarket.selectPlan(this)">
                    ${recommendBadge}
                    ${!plan.recommended && index === 0 ? popularBadge : ''}
                    <div class="check-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                    <div class="plan-name">${planName}</div>
                    <div class="plan-price">
                        <span class="price-value">${plan.price.toLocaleString()}</span>
                        <span class="price-unit">MP</span>
                    </div>
                    <div class="plan-period">${period}</div>
                    ${saveHtml}
                </div>
            `;
        }).join('');

        document.getElementById('purchasePlans').innerHTML = plansHtml;
        
        // 更新总价（选中推荐或第一个）
        this.selectedProduct = plans[defaultSelectedIndex];
        document.getElementById('purchaseTotal').textContent = `${plans[defaultSelectedIndex].price.toLocaleString()} MP`;

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
        document.querySelectorAll('.plan-card').forEach(el => {
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
            btn.innerHTML = `<span>${this.t('purchase_select_plan')}</span>`;
            return;
        }
        
        const canAfford = this.userBalance >= this.selectedProduct.price;
        btn.disabled = !canAfford;
        btn.innerHTML = canAfford 
            ? `<span>${this.t('purchase_subscribe')}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`
            : `<span>${this.t('purchase_insufficient')}</span>`;
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
        btn.innerHTML = `<span>${this.t('purchase_processing')}</span>`;

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
                this.showMessage(this.t('purchase_success'), 'success');
                
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
                throw new Error(data.message || this.t('purchase_failed'));
            }
        } catch (error) {
            console.error('[GameMarket] 购买失败:', error);
            this.showMessage(error.message || this.t('purchase_failed'), 'error');
            btn.disabled = false;
            btn.innerHTML = `<span>${this.t('purchase_subscribe')}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
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
