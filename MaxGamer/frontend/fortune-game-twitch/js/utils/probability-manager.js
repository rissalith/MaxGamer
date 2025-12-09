/**
 * 权重管理器 - 管理抽签权重的调整和持久化
 * 使用权重系统，自动归一化为概率，无需手动保证总和为100%
 */
class ProbabilityManager {
    constructor() {
        // 默认权重配置
        this.defaultWeights = {
            '上上签': 5,
            '上签': 35,
            '中签': 40,
            '下签': 15,
            '下下签': 5
        };
        
        // 当前权重
        this.weights = this.loadWeights();
        
        // 初始化UI
        this.initializeUI();
        
        // 设置事件监听
        this.setupEventListeners();
        
        // 初始化最小化功能
        this.initializeMinimize();
    }
    
    /**
     * 从localStorage加载权重配置
     */
    loadWeights() {
        try {
            const saved = localStorage.getItem('fortune_weights');
            if (saved) {
                const parsed = JSON.parse(saved);
                // 验证所有权重都是非负数
                const allValid = Object.values(parsed).every(val => val >= 0);
                if (allValid) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('加载权重配置失败，使用默认值', e);
        }
        return { ...this.defaultWeights };
    }
    
    /**
     * 保存权重配置到localStorage
     */
    saveWeights() {
        try {
            localStorage.setItem('fortune_weights', JSON.stringify(this.weights));
        } catch (e) {
            console.error('保存权重配置失败', e);
        }
    }
    
    /**
     * 计算归一化后的概率
     */
    getNormalizedProbabilities() {
        const total = Object.values(this.weights).reduce((sum, val) => sum + val, 0);
        
        // 如果总权重为0，返回均等概率
        if (total === 0) {
            const equalProb = 100 / Object.keys(this.weights).length;
            const result = {};
            Object.keys(this.weights).forEach(grade => {
                result[grade] = equalProb;
            });
            return result;
        }
        
        // 归一化：将权重转换为概率
        const probabilities = {};
        Object.keys(this.weights).forEach(grade => {
            probabilities[grade] = (this.weights[grade] / total) * 100;
        });
        
        return probabilities;
    }
    
    /**
     * 初始化UI显示
     */
    initializeUI() {
        // 设置所有滑块的初始值
        Object.keys(this.weights).forEach(grade => {
            const key = this.getGradeKey(grade);
            const slider = document.getElementById(`prob-${key}`);
            if (slider) {
                slider.value = this.weights[grade];
                // 更新滑块旁边的显示值（显示权重）
                const valueSpan = slider.nextElementSibling;
                if (valueSpan && valueSpan.classList.contains('prob-value')) {
                    valueSpan.textContent = this.weights[grade];
                }
            }
        });
        
        // 更新概率显示
        this.updateProbabilityDisplay();
    }
    
    /**
     * 获取品级对应的key
     */
    getGradeKey(grade) {
        const keyMap = {
            '上上签': 'excellent',
            '上签': 'good',
            '中签': 'medium',
            '下签': 'bad',
            '下下签': 'worst'
        };
        return keyMap[grade];
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 所有滑块的input事件
        Object.keys(this.weights).forEach(grade => {
            const slider = document.getElementById(`prob-${this.getGradeKey(grade)}`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.handleSliderChange(grade, parseInt(e.target.value));
                });
            }
        });
        
        // 重置按钮
        const resetBtn = document.getElementById('reset-probability');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetToDefault();
            });
        }
    }
    
    /**
     * 初始化关闭功能
     */
    initializeMinimize() {
        const closeBtn = document.getElementById('close-probability');
        const toggleBtn = document.getElementById('probability-minimized-icon');
        const panel = document.getElementById('probability-panel');
        
        if (!closeBtn || !toggleBtn || !panel) {
            console.warn('关闭按钮元素未找到');
            return;
        }
        
        // 关闭面板
        closeBtn.addEventListener('click', () => {
            panel.classList.add('hidden');
            toggleBtn.classList.add('active');
        });
        
        // 切换按钮显示面板
        toggleBtn.addEventListener('click', () => {
            const isHidden = panel.classList.contains('hidden');
            if (isHidden) {
                panel.classList.remove('hidden');
                toggleBtn.classList.remove('active');
            } else {
                panel.classList.add('hidden');
                toggleBtn.classList.add('active');
            }
        });
    }
    
    /**
     * 处理滑块值变化
     */
    handleSliderChange(changedGrade, newValue) {
        // 更新权重值
        this.weights[changedGrade] = newValue;
        
        // 更新滑块旁边的显示值（显示权重）
        const slider = document.getElementById(`prob-${this.getGradeKey(changedGrade)}`);
        if (slider) {
            const valueSpan = slider.nextElementSibling;
            if (valueSpan && valueSpan.classList.contains('prob-value')) {
                valueSpan.textContent = newValue;
            }
        }
        
        // 更新概率显示
        this.updateProbabilityDisplay();
        
        // 保存到localStorage
        this.saveWeights();
    }
    
    /**
     * 更新概率显示（显示归一化后的实际概率在签级名称右侧）
     */
    updateProbabilityDisplay() {
        const probabilities = this.getNormalizedProbabilities();
        
        // 更新每个签级右侧的概率显示
        Object.keys(probabilities).forEach(grade => {
            const key = this.getGradeKey(grade);
            const slider = document.getElementById(`prob-${key}`);
            if (slider) {
                // 找到label中的prob-percent元素
                const item = slider.closest('.probability-item');
                if (item) {
                    const percentSpan = item.querySelector('.prob-percent');
                    if (percentSpan) {
                        const prob = probabilities[grade].toFixed(1);
                        percentSpan.textContent = `${prob}%`;
                    }
                }
            }
        });
    }
    
    /**
     * 重置为默认值
     */
    resetToDefault() {
        this.weights = { ...this.defaultWeights };
        this.initializeUI();
        this.saveWeights();
    }
    
    /**
     * 获取当前权重配置
     */
    getWeights() {
        return { ...this.weights };
    }
    
    /**
     * 获取归一化后的概率配置
     */
    getProbabilities() {
        return this.getNormalizedProbabilities();
    }
    
    /**
     * 检查权重是否有效（权重系统永远有效）
     */
    isValid() {
        // 权重系统只要不是全0就有效
        const total = Object.values(this.weights).reduce((sum, val) => sum + val, 0);
        return total > 0;
    }
    
    /**
     * 根据当前权重选择一个品级（自动归一化）
     */
    selectGrade() {
        const probabilities = this.getNormalizedProbabilities();
        
        // 生成随机数并选择品级
        const randomValue = Math.random() * 100;
        let cumulative = 0;
        
        for (const [grade, prob] of Object.entries(probabilities)) {
            cumulative += prob;
            if (randomValue < cumulative) {
                return grade;
            }
        }
        
        // 兜底返回最后一个品级
        return '下下签';
    }
}

// 创建全局实例
window.probabilityManager = new ProbabilityManager();