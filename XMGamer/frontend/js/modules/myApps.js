/**
 * 我的应用模块
 * 管理用户已购买的游戏和服务
 */

const MyApps = {
    licenses: [],
    currentLicense: null,
    
    /**
     * 初始化模块
     */
    async init() {
        console.log('[MyApps] 初始化模块...');
        console.log('[MyApps] AuthManager.token:', AuthManager.token ? '已设置' : '未设置');
        console.log('[MyApps] AuthManager.isLoggedIn():', AuthManager.isLoggedIn());
        
        // 等待 DOM 准备好
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const grid = document.getElementById('appsGrid');
        console.log('[MyApps] appsGrid 元素:', grid ? '存在' : '不存在');
        
        if (!AuthManager.isLoggedIn()) {
            console.warn('[MyApps] 用户未登录，跳过加载');
            if (grid) {
                grid.innerHTML = `
                    <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                        <p style="color: #5f6368;">请先登录后查看您的应用</p>
                    </div>
                `;
            }
            return;
        }
        
        await this.loadLicenses();
    },
    
    /**
     * 加载用户授权列表
     */
    async loadLicenses() {
        const grid = document.getElementById('appsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!grid) {
            console.error('[MyApps] appsGrid 元素不存在');
            return;
        }
        
        // 获取当前用户信息
        const currentUser = AuthManager.getCurrentUser();
        console.log('[MyApps] 当前用户:', currentUser);
        console.log('[MyApps] 开始加载授权列表...');
        
        try {
            const response = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/products/my-licenses`
            );
            
            console.log('[MyApps] API 响应状态:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[MyApps] API 错误响应:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('[MyApps] API 返回数据:', JSON.stringify(data, null, 2));
            
            if (data.success) {
                this.licenses = data.licenses || [];
                console.log('[MyApps] 授权数量:', this.licenses.length);
                this.renderLicenses();
            } else {
                throw new Error(data.message || data.error || '加载失败');
            }
        } catch (error) {
            console.error('[MyApps] 加载授权列表失败:', error);
            if (grid) {
                grid.innerHTML = `
                    <div class="error-state" style="text-align: center; padding: 40px; grid-column: 1/-1;">
                        <p style="color: #d93025; margin-bottom: 16px;">加载失败: ${error.message}</p>
                        <button class="btn-primary" onclick="MyApps.loadLicenses()">重试</button>
                    </div>
                `;
            }
        }
    },
    
    /**
     * 渲染授权列表
     */
    renderLicenses() {
        const grid = document.getElementById('appsGrid');
        const emptyState = document.getElementById('emptyState');
        const countEl = document.getElementById('appCount');
        
        // 更新计数
        if (countEl) {
            countEl.textContent = `${this.licenses.length} 个应用`;
        }
        
        if (this.licenses.length === 0) {
            if (grid) grid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }
        
        if (grid) grid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';
        
        if (grid) {
            grid.innerHTML = this.licenses.map(license => this.renderAppCard(license)).join('');
        }
    },
    
    /**
     * 渲染单个应用卡片
     */
    renderAppCard(license) {
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
        
        const gameNames = {
            'fortune-game': '巫女占卜',
            'default': license.game_id
        };
        
        const iconSvg = gameIcons[license.game_id] || gameIcons.default;
        const name = gameNames[license.game_id] || gameNames.default;
        
        // 计算状态
        let statusText = '有效';
        let statusClass = 'active';
        let daysText = '永久';
        let daysRemaining = null;
        
        if (license.expires_at) {
            daysRemaining = license.days_remaining;
            if (daysRemaining !== null && daysRemaining !== undefined) {
                if (daysRemaining <= 0) {
                    statusText = '已过期';
                    statusClass = 'expired';
                    daysText = '已过期';
                } else if (daysRemaining <= 7) {
                    statusText = '即将过期';
                    statusClass = 'expiring';
                    daysText = `剩余 ${daysRemaining} 天`;
                } else {
                    daysText = `剩余 ${daysRemaining} 天`;
                }
            }
        }
        
        // 确保 daysRemaining 有值用于后续判断
        const isExpiring = daysRemaining !== null && daysRemaining <= 7;
        
        // OBS 链接
        const user = AuthManager.getCurrentUser();
        const obsLink = `${window.location.origin}/play/${license.game_id}?user=${user?.id || ''}`;
        
        return `
            <div class="app-card" data-license-id="${license.id}">
                <div class="app-card-header">
                    <div class="app-icon">${iconSvg}</div>
                    <div class="app-info">
                        <h4>${name}</h4>
                        <span class="app-status-badge">${(license.plan || 'basic').toUpperCase()}</span>
                    </div>
                </div>
                <div class="app-card-body">
                    <div class="app-meta">
                        <div class="meta-item">
                            <span class="meta-label">状态</span>
                            <span class="meta-value ${statusClass}">${statusText}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">有效期</span>
                            <span class="meta-value ${isExpiring ? 'expiring' : ''}">${daysText}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">购买时间</span>
                            <span class="meta-value">${this.formatDate(license.purchased_at)}</span>
                        </div>
                    </div>
                    
                    <div class="obs-link-section">
                        <div class="obs-link-label">OBS 浏览器源链接</div>
                        <div class="obs-link-input">
                            <input type="text" value="${obsLink}" readonly onclick="this.select()">
                            <button class="btn-copy" onclick="MyApps.copyLink('${obsLink}')">复制</button>
                        </div>
                    </div>
                </div>
                <div class="app-card-footer">
                    <button class="btn-app secondary" onclick="MyApps.openConfig('${license.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                        </svg>
                        <span>配置</span>
                    </button>
                    ${license.status === 'active' ? `
                        <button class="btn-app primary" onclick="MyApps.launchGame('${license.game_id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                            <span>启动</span>
                        </button>
                    ` : `
                        <button class="btn-app renew" onclick="MyApps.renewLicense('${license.game_id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;">
                                <path d="M23 4v6h-6M1 20v-6h6"/>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                            </svg>
                            <span>续费</span>
                        </button>
                    `}
                </div>
            </div>
        `;
    },
    
    /**
     * 复制链接
     */
    copyLink(link) {
        navigator.clipboard.writeText(link).then(() => {
            this.showToast('链接已复制到剪贴板');
        }).catch(() => {
            // 降级方案
            const input = document.createElement('input');
            input.value = link;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            this.showToast('链接已复制到剪贴板');
        });
    },
    
    /**
     * 启动游戏
     */
    async launchGame(gameId) {
        try {
            const response = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/games/launch`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ game_id: gameId })
                }
            );
            
            const data = await response.json();
            
            if (data.success) {
                // 在新窗口打开游戏
                window.open(data.launch_url, '_blank', 'width=1200,height=800');
            } else {
                throw new Error(data.message || '启动失败');
            }
        } catch (error) {
            console.error('启动游戏失败:', error);
            alert('启动游戏失败: ' + error.message);
        }
    },
    
    /**
     * 续费授权
     */
    renewLicense(gameId) {
        // 跳转到游戏市场，自动选中该游戏
        Router.navigate('game-market');
        // 可以传递参数让市场页面高亮显示该游戏
        setTimeout(() => {
            const gameCard = document.querySelector(`.game-card[data-game="${gameId}"]`);
            if (gameCard) {
                gameCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                gameCard.style.animation = 'pulse 1s ease 2';
            }
        }, 500);
    },
    
    /**
     * 打开配置弹窗
     */
    async openConfig(licenseId) {
        const license = this.licenses.find(l => l.id == licenseId);
        if (!license) return;
        
        this.currentLicense = license;
        
        const modal = document.getElementById('configModal');
        if (!modal) return;
        
        // 解析现有配置
        const config = license.config || {};
        
        // 填充基础配置
        const displayNameInput = document.getElementById('configDisplayName');
        if (displayNameInput) displayNameInput.value = config.display_name || '';
        
        // 加载游戏的 actions_schema 并动态渲染配置表单
        await this.loadGameActionsSchema(license.game_id, config);
        
        modal.style.display = 'flex';
    },
    
    /**
     * 加载游戏动作配置模板
     */
    async loadGameActionsSchema(gameId, existingConfig) {
        const actionsContainer = document.getElementById('actionsConfig');
        if (!actionsContainer) return;
        
        try {
            // 从后端获取游戏信息（包含 actions_schema）
            const response = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/products?category=game&game_id=${gameId}`
            );
            const data = await response.json();
            
            if (!data.success || !data.products || data.products.length === 0) {
                actionsContainer.innerHTML = '<p style="color:#666;">未找到动作配置</p>';
                return;
            }
            
            // 从 games 表获取 actions_schema
            const gameResponse = await fetch(`/api/games/${gameId}`);
            const gameData = await gameResponse.json();
            
            let actionsSchema = [];
            if (gameData.success && gameData.game && gameData.game.actions_schema) {
                actionsSchema = gameData.game.actions_schema;
            }
            
            if (actionsSchema.length === 0) {
                actionsContainer.innerHTML = '<p style="color:#666;">该游戏暂无可配置动作</p>';
                return;
            }
            
            // 现有的动作映射配置
            const actionMappings = existingConfig.action_mappings || {};
            
            // 渲染动作配置表单
            actionsContainer.innerHTML = `
                <div class="actions-config-header">
                    <h4 style="margin:0 0 8px 0; font-size: 14px; color: var(--content-text);">动作触发配置</h4>
                    <p style="margin:0 0 16px 0; font-size: 12px; color: var(--content-text-secondary);">
                        配置如何触发游戏中的各个动作（如礼物、弹幕等）
                    </p>
                </div>
                <div class="actions-list-config">
                    ${actionsSchema.map(action => this.renderActionConfig(action, actionMappings[action.code])).join('')}
                </div>
            `;
        } catch (error) {
            console.error('加载动作配置失败:', error);
            actionsContainer.innerHTML = '<p style="color:#d93025;">加载配置失败</p>';
        }
    },
    
    /**
     * 渲染单个动作配置项
     */
    renderActionConfig(action, mapping = {}) {
        return `
            <div class="action-config-item" data-action-code="${action.code}">
                <div class="action-info">
                    <span class="action-label">${action.label}</span>
                    <span class="action-code">${action.code}</span>
                    ${action.description ? `<span class="action-desc">${action.description}</span>` : ''}
                </div>
                <div class="action-trigger-config">
                    <div class="trigger-row">
                        <label>触发方式</label>
                        <select class="trigger-type" onchange="MyApps.updateTriggerOptions(this)">
                            <option value="gift" ${mapping.trigger_type === 'gift' ? 'selected' : ''}>礼物</option>
                            <option value="comment" ${mapping.trigger_type === 'comment' ? 'selected' : ''}>弹幕关键词</option>
                            <option value="like" ${mapping.trigger_type === 'like' ? 'selected' : ''}>点赞</option>
                            <option value="follow" ${mapping.trigger_type === 'follow' ? 'selected' : ''}>关注</option>
                        </select>
                    </div>
                    <div class="trigger-row trigger-value-row">
                        <label>触发值</label>
                        <input type="text" class="trigger-value" 
                               placeholder="${mapping.trigger_type === 'comment' ? '输入关键词' : '输入礼物ID或名称'}"
                               value="${mapping.trigger_value || ''}">
                    </div>
                    ${action.params ? this.renderActionParams(action.params, mapping.params || {}) : ''}
                </div>
            </div>
        `;
    },
    
    /**
     * 渲染动作参数配置
     */
    renderActionParams(params, existingParams) {
        return `
            <div class="action-params">
                ${params.map(param => `
                    <div class="param-row">
                        <label>${param.label}</label>
                        ${param.input_type === 'select' ? `
                            <select class="param-input" data-param-key="${param.key}">
                                ${param.options.map(opt => `
                                    <option value="${opt}" ${existingParams[param.key] === opt ? 'selected' : ''}>${opt}</option>
                                `).join('')}
                            </select>
                        ` : `
                            <input type="${param.input_type || 'text'}" 
                                   class="param-input" 
                                   data-param-key="${param.key}"
                                   value="${existingParams[param.key] || param.default || ''}"
                                   placeholder="${param.placeholder || ''}">
                        `}
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    /**
     * 更新触发选项
     */
    updateTriggerOptions(selectEl) {
        const row = selectEl.closest('.action-config-item');
        const valueInput = row.querySelector('.trigger-value');
        const type = selectEl.value;
        
        const placeholders = {
            'gift': '输入礼物ID或名称',
            'comment': '输入弹幕关键词',
            'like': '点赞数量（如: 10）',
            'follow': '保持默认'
        };
        
        if (valueInput) {
            valueInput.placeholder = placeholders[type] || '';
        }
    },
    
    /**
     * 关闭配置弹窗
     */
    closeConfigModal() {
        const modal = document.getElementById('configModal');
        modal.style.display = 'none';
        this.currentLicense = null;
    },
    
    /**
     * 保存配置
     */
    async saveConfig() {
        if (!this.currentLicense) return;
        
        const displayNameInput = document.getElementById('configDisplayName');
        
        // 收集动作映射配置
        const actionMappings = {};
        const actionItems = document.querySelectorAll('.action-config-item');
        
        actionItems.forEach(item => {
            const code = item.dataset.actionCode;
            const triggerType = item.querySelector('.trigger-type')?.value;
            const triggerValue = item.querySelector('.trigger-value')?.value;
            
            // 收集动作参数
            const params = {};
            item.querySelectorAll('.param-input').forEach(input => {
                const key = input.dataset.paramKey;
                if (key) {
                    params[key] = input.value;
                }
            });
            
            actionMappings[code] = {
                trigger_type: triggerType,
                trigger_value: triggerValue,
                params: params
            };
        });
        
        const config = {
            display_name: displayNameInput?.value || '',
            action_mappings: actionMappings
        };
        
        try {
            // 调用后端API保存配置
            const response = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/products/license/${this.currentLicense.id}/config`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ config })
                }
            );
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('配置已保存');
                this.closeConfigModal();
                await this.loadLicenses();
            } else {
                throw new Error(data.message || '保存失败');
            }
        } catch (error) {
            console.error('保存配置失败:', error);
            alert('保存失败: ' + error.message);
        }
    },
    
    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },
    
    /**
     * 显示提示消息
     */
    showToast(message) {
        // 创建 toast 元素
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 0.95em;
            z-index: 9999;
            animation: toastIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
};

// 添加 toast 动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes toastOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
    @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4); }
        50% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
    }
`;
document.head.appendChild(style);

// 导出模块
window.MyApps = MyApps;

