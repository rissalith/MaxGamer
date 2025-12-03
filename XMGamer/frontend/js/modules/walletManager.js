/**
 * 钱包管理模块 - Google风格UI
 * 处理充值、余额查询、交易记录等
 */

const WalletManager = {
    wallet: null,
    packages: [],
    transactions: [],
    transactionOffset: 0,
    selectedPackage: null,
    
    /**
     * 初始化模块
     */
    async init() {
        console.log('钱包管理模块初始化...');
        this.bindTabEvents();
        await Promise.all([
            this.loadWallet(),
            this.loadPackages(),
            this.loadTransactions()
        ]);
    },
    
    /**
     * 绑定Tab切换事件
     */
    bindTabEvents() {
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });
    },
    
    /**
     * 切换Tab
     */
    switchTab(tabName) {
        // 更新导航状态
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });
        
        // 更新面板显示
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const targetPanel = document.getElementById(`${tabName}-panel`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
    },
    
    /**
     * 加载钱包信息
     */
    async loadWallet() {
        try {
            const response = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/wallet`
            );
            
            const data = await response.json();
            
            if (data.success) {
                this.wallet = data.wallet;
                this.updateWalletDisplay();
                this.updateSidebarBalance();
            }
        } catch (error) {
            console.error('加载钱包信息失败:', error);
        }
    },
    
    /**
     * 更新钱包显示
     */
    updateWalletDisplay() {
        if (!this.wallet) return;
        
        const balanceEl = document.getElementById('walletBalance');
        const totalRechargedEl = document.getElementById('totalRecharged');
        const totalConsumedEl = document.getElementById('totalConsumed');
        
        if (balanceEl) {
            balanceEl.textContent = this.wallet.balance.toLocaleString();
        }
        if (totalRechargedEl) {
            totalRechargedEl.textContent = `${(this.wallet.total_recharged || 0).toLocaleString()} MP`;
        }
        if (totalConsumedEl) {
            totalConsumedEl.textContent = `${(this.wallet.total_consumed || 0).toLocaleString()} MP`;
        }
    },
    
    /**
     * 更新侧边栏余额显示
     */
    updateSidebarBalance() {
        const sidebarBalance = document.getElementById('userBalance');
        if (sidebarBalance && this.wallet) {
            sidebarBalance.textContent = this.wallet.balance.toLocaleString();
        }
    },
    
    /**
     * 加载充值套餐
     */
    async loadPackages() {
        try {
            const response = await fetch(
                `${AuthManager.apiBaseUrl}/products?category=recharge`
            );
            
            const data = await response.json();
            
            if (data.success && data.products.length > 0) {
                this.packages = data.products;
            } else {
                this.packages = this.getDefaultPackages();
            }
            this.renderPackages();
        } catch (error) {
            console.error('加载充值套餐失败:', error);
            this.packages = this.getDefaultPackages();
            this.renderPackages();
        }
    },
    
    /**
     * 获取默认充值套餐
     */
    getDefaultPackages() {
        return [
            { id: 'recharge_1000', name: '入门套餐', price: 1000, price_cny: 10 },
            { id: 'recharge_5500', name: '超值套餐', price: 5500, price_cny: 50, popular: true },
            { id: 'recharge_12000', name: '豪华套餐', price: 12000, price_cny: 100 },
            { id: 'recharge_65000', name: '至尊套餐', price: 65000, price_cny: 500 }
        ];
    },
    
    /**
     * 渲染充值套餐
     */
    renderPackages() {
        const grid = document.getElementById('packagesGrid');
        if (!grid) return;
        
        const icons = ['💎', '💰', '👑', '🌟'];
        
        grid.innerHTML = this.packages.map((pkg, index) => `
            <label class="package-option">
                <input type="radio" name="package" value="${pkg.id}" 
                       onchange="WalletManager.selectPackage('${pkg.id}')"
                       ${index === 0 ? 'checked' : ''}>
                <div class="package-content">
                    <span class="package-icon">${icons[index % icons.length]}</span>
                    <div class="package-info">
                        <span class="package-name">
                            ${pkg.name}
                            ${pkg.popular ? '<span class="package-badge">HOT</span>' : ''}
                        </span>
                        <span class="package-desc">${pkg.price.toLocaleString()} MaxPoints</span>
                    </div>
                    <span class="package-price">¥${pkg.price_cny}</span>
                    <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            </label>
        `).join('');
        
        // 默认选中第一个
        if (this.packages.length > 0) {
            this.selectedPackage = this.packages[0];
        }
    },
    
    /**
     * 选择套餐
     */
    selectPackage(packageId) {
        const pkg = this.packages.find(p => p.id === packageId);
        if (pkg) {
            this.selectedPackage = pkg;
            this.openRechargeModal();
        }
    },
    
    /**
     * 打开充值确认弹窗
     */
    openRechargeModal() {
        if (!this.selectedPackage) return;
        
        const pkg = this.selectedPackage;
        document.getElementById('rechargePackageName').textContent = pkg.name;
        document.getElementById('rechargePoints').textContent = `${pkg.price.toLocaleString()} MP`;
        document.getElementById('rechargePrice').textContent = `¥${pkg.price_cny}`;
        
        document.getElementById('rechargeModal').style.display = 'flex';
    },
    
    /**
     * 关闭充值弹窗
     */
    closeRechargeModal() {
        document.getElementById('rechargeModal').style.display = 'none';
    },
    
    /**
     * 确认充值
     */
    async confirmRecharge() {
        if (!this.selectedPackage) return;
        
        try {
            // 1. 创建充值订单
            const createResponse = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/wallet/recharge`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        product_id: this.selectedPackage.id,
                        payment_method: 'test'
                    })
                }
            );
            
            const createData = await createResponse.json();
            
            if (!createData.success) {
                throw new Error(createData.message || '创建订单失败');
            }
            
            // 2. 模拟支付成功
            const completeResponse = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/wallet/recharge/complete`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_id: createData.order_id,
                        payment_id: 'test_' + Date.now()
                    })
                }
            );
            
            const completeData = await completeResponse.json();
            
            if (completeData.success) {
                this.closeRechargeModal();
                this.showToast(`充值成功！+${this.selectedPackage.price.toLocaleString()} MP`, 'success');
                
                // 刷新数据
                await this.loadWallet();
                await this.loadTransactions();
            } else {
                throw new Error(completeData.message || '充值失败');
            }
            
        } catch (error) {
            console.error('充值失败:', error);
            this.showToast(error.message || '充值失败', 'error');
        }
    },
    
    /**
     * 加载交易记录
     */
    async loadTransactions(append = false) {
        const list = document.getElementById('transactionsList');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        if (!list) return;
        
        if (!append) {
            this.transactionOffset = 0;
            this.transactions = [];
        }
        
        try {
            const response = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/wallet/transactions?limit=10&offset=${this.transactionOffset}`
            );
            
            const data = await response.json();
            
            if (data.success) {
                if (append) {
                    this.transactions = [...this.transactions, ...data.transactions];
                } else {
                    this.transactions = data.transactions || [];
                }
                
                this.transactionOffset += data.transactions.length;
                this.renderTransactions();
                
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = 
                        this.transactionOffset < data.total ? 'block' : 'none';
                }
            }
        } catch (error) {
            console.error('加载交易记录失败:', error);
        }
    },
    
    /**
     * 加载更多交易记录
     */
    loadMoreTransactions() {
        this.loadTransactions(true);
    },
    
    /**
     * 渲染交易记录
     */
    renderTransactions() {
        const list = document.getElementById('transactionsList');
        if (!list) return;
        
        if (this.transactions.length === 0) {
            list.innerHTML = `
                <div class="empty-transactions">
                    <div class="empty-transactions-icon">📝</div>
                    <p>暂无交易记录</p>
                </div>
            `;
            return;
        }
        
        const typeConfig = {
            'DEPOSIT': { icon: '💰', class: 'deposit' },
            'PURCHASE': { icon: '🛒', class: 'purchase' },
            'REFUND': { icon: '↩️', class: 'deposit' },
            'REWARD': { icon: '🎁', class: 'deposit' },
            'ADJUST': { icon: '⚙️', class: 'adjust' }
        };
        
        list.innerHTML = this.transactions.map(tx => {
            const config = typeConfig[tx.type] || typeConfig.ADJUST;
            const isPositive = tx.amount > 0;
            
            return `
                <div class="transaction-item">
                    <div class="transaction-icon ${config.class}">${config.icon}</div>
                    <div class="transaction-info">
                        <div class="transaction-title">${tx.description || tx.product_name || tx.type}</div>
                        <div class="transaction-time">${this.formatDateTime(tx.created_at)}</div>
                    </div>
                    <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : ''}${tx.amount.toLocaleString()} MP
                    </div>
                </div>
            `;
        }).join('');
    },
    
    /**
     * 格式化日期时间
     */
    formatDateTime(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    /**
     * 显示提示消息
     */
    showToast(message, type = 'info') {
        // 移除已存在的
        const existing = document.querySelector('.toast-message');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // 显示动画
        setTimeout(() => toast.classList.add('show'), 10);
        
        // 3秒后隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    /**
     * 刷新余额（供外部调用）
     */
    async refreshBalance() {
        await this.loadWallet();
    }
};

// 导出模块
window.WalletManager = WalletManager;
