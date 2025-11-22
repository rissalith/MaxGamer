/**
 * UI管理模块
 * 负责UI交互和显示控制
 */

const UIManager = {
    // DOM元素缓存
    elements: {},

    /**
     * 初始化UI管理器
     */
    init() {
        this._cacheElements();
        this._bindEvents();
        this._initTabs();
        // 注意：历史记录的渲染在 App.init() 中调用
    },

    /**
     * 缓存DOM元素
     * @private
     */
    _cacheElements() {
        this.elements = {
            // 输入控件
            frameDelayInput: document.getElementById('frameDelay'),
            toleranceInput: document.getElementById('toleranceInput'),
            
            // AI生成相关
            aiPrompt: document.getElementById('aiPrompt'),
            aiModel: document.getElementById('aiModel'),
            aiFrameCount: document.getElementById('aiFrameCount'),
            loopConsistency: document.getElementById('loopConsistency'),
            generateAI: document.getElementById('generateAI'),
            aiStatus: document.getElementById('aiStatus'),
            
            // 历史记录相关
            historyList: document.getElementById('historyList'),
            clearHistory: document.getElementById('clearHistory'),
            
            // 插帧控制相关
            interpolationCount: document.getElementById('interpolationCount'),
            smoothInterpolation: document.getElementById('smoothInterpolation'),
            applyInterpolation: document.getElementById('applyInterpolation'),
            resetFrames: document.getElementById('resetFrames'),
            frameInfo: document.getElementById('frameInfo'),
            frameCount: document.getElementById('frameCount'),
            
            // 预览相关
            emptyState: document.getElementById('emptyState'),
            previewWindow: document.getElementById('previewWindow'),
            spritePreview: document.getElementById('spritePreview'),
            originalPreview: document.getElementById('originalPreview'),
            
            // TAB相关
            tabBtns: document.querySelectorAll('.tab-btn'),
            gifTab: document.getElementById('gifTab'),
            framesTab: document.getElementById('framesTab'),
            spriteTab: document.getElementById('spriteTab'),
            originalTab: document.getElementById('originalTab'),
            framesGrid: document.getElementById('framesGrid'),
            
            // GIF相关
            gifPreview: document.getElementById('gifPreview'),
            gifPreviewBox: document.getElementById('gifPreviewBox'),
            gifStatus: document.getElementById('gifStatus'),
            
            // 导出相关
            exportSprite: document.getElementById('exportSprite'),
            exportGif: document.getElementById('exportGif'),
            exportFrames: document.getElementById('exportFrames'),
            exportOriginal: document.getElementById('exportOriginal'),
            exportStatus: document.getElementById('exportStatus'),
            
            // 用户菜单
            userProfile: document.getElementById('userProfile'),
            userMenu: document.getElementById('userMenu'),
            
            // 图片模态框
            imageModal: document.getElementById('imageModal'),
            modalImage: document.getElementById('modalImage'),
            modalClose: document.getElementById('modalClose'),
            modalContent: document.getElementById('modalContent')
        };
    },

    /**
     * 绑定事件
     * @private
     */
    _bindEvents() {
        // 用户菜单
        this._bindUserMenu();
        
        // TAB切换
        this._bindTabSwitch();
        
        // 容差滑块
        this._bindToleranceSlider();
        
        // 图片查看功能
        this._bindImageViewer();
        
        // 历史记录功能
        this._bindHistoryEvents();
    },

    /**
     * 初始化TAB
     * @private
     */
    _initTabs() {
        // 默认显示GIF标签页
        this.switchTab('gif');
    },

    /**
     * 绑定TAB切换事件
     * @private
     */
    _bindTabSwitch() {
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
    },

    /**
     * 绑定容差输入框事件
     * @private
     */
    _bindToleranceSlider() {
        const { toleranceInput } = this.elements;
        
        if (toleranceInput) {
            // 输入验证
            toleranceInput.addEventListener('input', (e) => {
                let value = parseInt(e.target.value);
                
                // 限制范围
                if (value < 0) {
                    e.target.value = 0;
                } else if (value > 100) {
                    e.target.value = 100;
                }
            });
            
            // 容差改变时触发重新处理
            toleranceInput.addEventListener('change', (e) => {
                let value = parseInt(e.target.value);
                
                // 确保值在有效范围内
                if (isNaN(value) || value < 0) {
                    value = 0;
                    e.target.value = 0;
                } else if (value > 100) {
                    value = 100;
                    e.target.value = 100;
                }
                
                // 触发自定义事件，让主程序处理
                window.dispatchEvent(new CustomEvent('toleranceChanged', {
                    detail: { tolerance: value }
                }));
            });
        }
    },

    /**
     * 切换TAB
     */
    switchTab(tabName) {
        // 更新按钮状态
        this.elements.tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 更新内容显示
        const tabs = {
            'gif': this.elements.gifTab,
            'frames': this.elements.framesTab,
            'sprite': this.elements.spriteTab,
            'original': this.elements.originalTab
        };

        Object.keys(tabs).forEach(key => {
            if (key === tabName) {
                tabs[key].classList.add('active');
            } else {
                tabs[key].classList.remove('active');
            }
        });
    },

    /**
     * 绑定用户菜单事件
     * @private
     */
    _bindUserMenu() {
        const { userProfile, userMenu } = this.elements;
        
        if (userProfile && userMenu) {
            userProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = userMenu.style.display === 'block';
                userMenu.style.display = isVisible ? 'none' : 'block';
                userProfile.classList.toggle('active', !isVisible);
            });

            // 点击菜单选项
            const menuOptions = userMenu.querySelectorAll('.menu-option');
            menuOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = option.dataset.action;
                    this._handleMenuAction(action);
                    userMenu.style.display = 'none';
                    userProfile.classList.remove('active');
                });
            });

            // 点击其他地方关闭菜单
            document.addEventListener('click', () => {
                userMenu.style.display = 'none';
                userProfile.classList.remove('active');
            });
        }
    },

    /**
     * 处理菜单操作
     * @private
     */
    _handleMenuAction(action) {
        switch(action) {
            case 'settings':
                alert('个人设置功能开发中...');
                break;
            case 'wallet':
                alert('钱包功能开发中...');
                break;
            case 'logout':
                if (confirm('确定要退出吗？')) {
                    alert('退出功能开发中...');
                }
                break;
        }
    },

    /**
     * 显示状态消息
     */
    showStatus(elementId, status, message) {
        const element = this.elements[elementId];
        if (!element) return;

        element.style.display = 'block';
        element.className = `status-message ${status}`;
        element.textContent = message;
    },

    /**
     * 隐藏状态消息
     */
    hideStatus(elementId) {
        const element = this.elements[elementId];
        if (element) {
            element.style.display = 'none';
        }
    },

    /**
     * 显示预览窗口
     */
    showPreviewWindow() {
        this.elements.emptyState.style.display = 'none';
        this.elements.previewWindow.style.display = 'flex';
    },

    /**
     * 隐藏预览窗口
     */
    hidePreviewWindow() {
        this.elements.emptyState.style.display = 'flex';
        this.elements.previewWindow.style.display = 'none';
    },

    /**
     * 显示精灵图预览
     */
    displaySprite(imageUrl) {
        this.elements.spritePreview.src = imageUrl;
        // 添加点击查看功能
        this._addImageClickHandler(this.elements.spritePreview);
    },

    /**
     * 显示原图预览
     */
    displayOriginal(imageUrl) {
        this.elements.originalPreview.src = imageUrl;
        // 添加点击查看功能
        this._addImageClickHandler(this.elements.originalPreview);
    },

    /**
     * 显示全部帧
     */
    displayAllFrames(frames) {
        const grid = this.elements.framesGrid;
        grid.innerHTML = ''; // 清空现有内容

        frames.forEach((canvas, index) => {
            const frameItem = document.createElement('div');
            frameItem.className = 'frame-item';
            
            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            img.alt = `Frame ${index + 1}`;
            
            // 添加点击查看功能
            this._addImageClickHandler(img);
            
            const frameNumber = document.createElement('div');
            frameNumber.className = 'frame-number';
            frameNumber.textContent = index + 1;
            
            frameItem.appendChild(img);
            frameItem.appendChild(frameNumber);
            grid.appendChild(frameItem);
        });
        
        // 更新帧数信息
        this.updateFrameInfo(frames.length);
    },
    
    /**
     * 更新帧数信息
     */
    updateFrameInfo(frameCount) {
        const { frameCount: frameCountEl } = this.elements;
        if (frameCountEl) {
            const isInterpolated = window.AppState.getIsInterpolated();
            const originalCount = window.AppState.getOriginalFrames().length;
            
            if (isInterpolated && originalCount > 0) {
                frameCountEl.textContent = `帧数: ${frameCount} (原始: ${originalCount})`;
            } else {
                frameCountEl.textContent = `帧数: ${frameCount}`;
            }
        }
    },

    /**
     * 显示GIF预览
     */
    displayGIF(gifBlob) {
        const url = URL.createObjectURL(gifBlob);
        this.elements.gifPreview.src = url;
        this.elements.gifPreviewBox.style.display = 'block';
    },

    /**
     * 获取帧延迟
     */
    getFrameDelay() {
        return parseInt(this.elements.frameDelayInput.value);
    },

    /**
     * 获取AI生成参数
     */
    getAIParams() {
        return {
            prompt: this.elements.aiPrompt.value.trim(),
            model: this.elements.aiModel.value,
            frameCount: parseInt(this.elements.aiFrameCount.value),
            loopConsistency: this.elements.loopConsistency.checked
        };
    },

    /**
     * 获取容差值
     */
    getTolerance() {
        const value = parseInt(this.elements.toleranceInput.value);
        // 确保返回有效值
        if (isNaN(value) || value < 0) return 0;
        if (value > 100) return 100;
        return value;
    },

    /**
     * 启用/禁用按钮
     */
    setButtonEnabled(buttonId, enabled) {
        const button = this.elements[buttonId];
        if (button) {
            button.disabled = !enabled;
        }
    },

    /**
     * 绑定图片查看功能
     * @private
     */
    _bindImageViewer() {
        const { imageModal, modalImage, modalClose, modalContent } = this.elements;
        let currentScale = 1;
        let isDragging = false;
        let startX, startY, translateX = 0, translateY = 0;

        // 关闭模态框
        const closeModal = () => {
            imageModal.classList.remove('active');
            currentScale = 1;
            translateX = 0;
            translateY = 0;
            modalImage.style.transform = 'scale(1) translate(0, 0)';
        };

        // 点击关闭按钮
        modalClose.addEventListener('click', closeModal);

        // 点击背景关闭
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                closeModal();
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && imageModal.classList.contains('active')) {
                closeModal();
            }
        });

        // 鼠标滚轮缩放
        modalContent.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            currentScale = Math.max(0.5, Math.min(5, currentScale + delta));
            modalImage.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
        });

        // 拖拽功能
        modalImage.addEventListener('mousedown', (e) => {
            if (currentScale > 1) {
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                modalImage.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                modalImage.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            modalImage.style.cursor = 'zoom-in';
        });
    },

    /**
     * 显示图片查看器
     */
    showImageViewer(imageSrc) {
        const { imageModal, modalImage } = this.elements;
        modalImage.src = imageSrc;
        imageModal.classList.add('active');
    },

    /**
     * 为预览框中的图片添加点击事件
     * @private
     */
    _addImageClickHandler(img) {
        img.addEventListener('click', () => {
            this.showImageViewer(img.src);
        });
    },

    /**
     * 绑定历史记录事件
     * @private
     */
    _bindHistoryEvents() {
        const { clearHistory } = this.elements;
        
        if (clearHistory) {
            clearHistory.addEventListener('click', () => {
                if (confirm('确定要清空所有历史记录吗？')) {
                    window.AppState.clearHistory();
                    this.renderHistory();
                }
            });
        }
    },

    /**
     * 渲染历史记录列表
     */
    renderHistory() {
        const { historyList } = this.elements;
        if (!historyList) return;
        
        const history = window.AppState.getHistory();
        
        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <p>暂无生成记录</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = history.map(record => this._createHistoryItemHTML(record)).join('');
        
        // 绑定点击事件
        historyList.querySelectorAll('.history-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            
            // 点击记录项加载该记录
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.history-delete')) {
                    this._loadHistoryRecord(id);
                }
            });
            
            // 删除按钮
            const deleteBtn = item.querySelector('.history-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('确定要删除这条记录吗？')) {
                        window.AppState.deleteHistoryById(id);
                        this.renderHistory();
                    }
                });
            }
        });
    },

    /**
     * 创建历史记录项HTML
     * @private
     */
    _createHistoryItemHTML(record) {
        const time = new Date(record.timestamp).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const modelName = window.Constants.AI_MODELS[record.model] || record.model;
        
        return `
            <div class="history-item" data-id="${record.id}">
                <button class="history-delete" title="删除">×</button>
                <div class="history-content">
                    <div class="history-thumbnail">
                        <img src="${record.spriteUrl}" alt="缩略图">
                    </div>
                    <div class="history-info">
                        <div class="history-prompt">${this._escapeHtml(record.prompt)}</div>
                        <div class="history-meta">
                            <span class="history-tag">🤖 ${modelName}</span>
                            <span class="history-tag">🎞️ ${record.frameCount}帧</span>
                            ${record.loopConsistency ? '<span class="history-tag">🔄 首尾一致</span>' : ''}
                        </div>
                        <div class="history-time">${time}</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 加载历史记录
     * @private
     */
    async _loadHistoryRecord(id) {
        const record = window.AppState.getHistoryById(id);
        if (!record) return;
        
        try {
            // 恢复输入参数
            this.elements.aiPrompt.value = record.prompt;
            this.elements.aiModel.value = record.model;
            this.elements.aiFrameCount.value = record.frameCount;
            this.elements.loopConsistency.checked = record.loopConsistency;
            this.elements.toleranceInput.value = record.tolerance || 50;
            
            // 显示预览窗口
            this.showPreviewWindow();
            
            // 显示精灵图
            this.displaySprite(record.spriteUrl);
            
            // 显示原图
            if (record.rawImageUrl) {
                this.displayOriginal(record.rawImageUrl);
            }
            
            // 恢复状态
            window.AppState.setOriginalImageUrl(record.spriteUrl);
            window.AppState.setRawImageUrl(record.rawImageUrl);
            window.AppState.rows = record.rows;
            window.AppState.cols = record.cols;
            window.AppState.setLoopConsistency(record.loopConsistency);
            
            // 重新加载图片并处理帧
            const image = await window.AIGenerator.loadImage(record.spriteUrl);
            window.AppState.setOriginalImage(image);
            
            // 将base64帧转换为Canvas
            const processedFrames = await Promise.all(
                record.frames.map(base64 => window.ImageProcessor.base64ToCanvas(base64))
            );
            window.AppState.setProcessedFrames(processedFrames);
            
            // 显示全部帧
            this.displayAllFrames(processedFrames);
            
            // 如果有GIF，显示GIF
            if (record.gifUrl) {
                // 从URL创建Blob
                const response = await fetch(record.gifUrl);
                const gifBlob = await response.blob();
                window.AppState.setCurrentGifBlob(gifBlob);
                this.displayGIF(gifBlob);
            } else {
                // 重新生成GIF
                await window.App.autoGenerateGIF();
            }
            
            // 高亮当前选中的历史记录
            document.querySelectorAll('.history-item').forEach(item => {
                item.classList.toggle('active', parseInt(item.dataset.id) === id);
            });
            
            this.showStatus('aiStatus', 'success', '✅ 已加载历史记录');
            setTimeout(() => {
                this.hideStatus('aiStatus');
            }, 2000);
            
        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.showStatus('aiStatus', 'error', `❌ 加载失败: ${error.message}`);
        }
    },

    /**
     * HTML转义
     * @private
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// 导出模块
window.UIManager = UIManager;