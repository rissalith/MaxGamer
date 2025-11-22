/**
 * 全局状态管理
 * 管理应用的所有全局状态变量
 */

const AppState = {
    // 图像相关状态
    originalImage: null,
    originalImageUrl: null,
    rawImageUrl: null, // 未经处理的原始图片URL
    processedFrames: [],
    frameCanvases: [],
    currentGifBlob: null,
    loopConsistency: true, // 首尾帧一致性，默认开启
    rows: 0,
    cols: 0,
    
    // 插帧相关状态
    originalFrames: [], // 保存原始帧，用于还原
    interpolatedFrames: [], // 插帧后的帧
    isInterpolated: false, // 是否已应用插帧
    
    // 历史记录相关
    generationHistory: [], // 存储所有生成记录
    maxHistorySize: 50, // 最多保存50条记录
    
    // 获取状态
    getOriginalImage() {
        return this.originalImage;
    },
    
    setOriginalImage(image) {
        this.originalImage = image;
    },
    
    getOriginalImageUrl() {
        return this.originalImageUrl;
    },
    
    setOriginalImageUrl(url) {
        this.originalImageUrl = url;
    },
    
    getRawImageUrl() {
        return this.rawImageUrl;
    },
    
    setRawImageUrl(url) {
        this.rawImageUrl = url;
    },
    
    getProcessedFrames() {
        return this.processedFrames;
    },
    
    setProcessedFrames(frames) {
        this.processedFrames = frames;
        this.frameCanvases = frames;
        // 保存原始帧用于还原
        if (!this.isInterpolated) {
            this.originalFrames = frames.slice();
        }
    },
    
    getOriginalFrames() {
        return this.originalFrames;
    },
    
    setInterpolatedFrames(frames) {
        this.interpolatedFrames = frames;
        this.isInterpolated = true;
    },
    
    getInterpolatedFrames() {
        return this.interpolatedFrames;
    },
    
    getIsInterpolated() {
        return this.isInterpolated;
    },
    
    resetInterpolation() {
        this.interpolatedFrames = [];
        this.isInterpolated = false;
    },
    
    getCurrentGifBlob() {
        return this.currentGifBlob;
    },
    
    setCurrentGifBlob(blob) {
        this.currentGifBlob = blob;
    },
    
    getLoopConsistency() {
        return this.loopConsistency;
    },
    
    setLoopConsistency(enabled) {
        this.loopConsistency = enabled;
    },
    
    // 历史记录管理
    addToHistory(record) {
        // 添加时间戳和ID
        const historyRecord = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...record
        };
        
        // 添加到历史记录开头
        this.generationHistory.unshift(historyRecord);
        
        // 限制历史记录数量
        if (this.generationHistory.length > this.maxHistorySize) {
            this.generationHistory = this.generationHistory.slice(0, this.maxHistorySize);
        }
        
        // 保存到localStorage
        this._saveHistoryToStorage();
        
        return historyRecord;
    },
    
    getHistory() {
        return this.generationHistory;
    },
    
    getHistoryById(id) {
        return this.generationHistory.find(record => record.id === id);
    },
    
    deleteHistoryById(id) {
        this.generationHistory = this.generationHistory.filter(record => record.id !== id);
        this._saveHistoryToStorage();
    },
    
    clearHistory() {
        this.generationHistory = [];
        this._saveHistoryToStorage();
    },
    
    _saveHistoryToStorage() {
        try {
            // 优化存储：只保存必要的数据，不保存大型base64图片
            const lightweightHistory = this.generationHistory.map(record => ({
                id: record.id,
                timestamp: record.timestamp,
                prompt: record.prompt,
                model: record.model,
                frameCount: record.frameCount,
                loopConsistency: record.loopConsistency,
                tolerance: record.tolerance,
                rows: record.rows,
                cols: record.cols
                // 不保存 spriteUrl, rawImageUrl, frames, gifUrl 等大型数据
            }));
            
            localStorage.setItem('xmframer_history', JSON.stringify(lightweightHistory));
        } catch (error) {
            console.error('保存历史记录失败:', error);
            // 如果仍然失败，尝试清理旧记录
            if (error.name === 'QuotaExceededError') {
                console.warn('存储空间不足，清理旧记录...');
                this.generationHistory = this.generationHistory.slice(0, 10); // 只保留最新10条
                try {
                    const lightweightHistory = this.generationHistory.map(record => ({
                        id: record.id,
                        timestamp: record.timestamp,
                        prompt: record.prompt,
                        model: record.model,
                        frameCount: record.frameCount,
                        loopConsistency: record.loopConsistency,
                        tolerance: record.tolerance,
                        rows: record.rows,
                        cols: record.cols
                    }));
                    localStorage.setItem('xmframer_history', JSON.stringify(lightweightHistory));
                    console.log('✅ 已清理并保存历史记录');
                } catch (retryError) {
                    console.error('重试保存失败:', retryError);
                }
            }
        }
    },
    
    _loadHistoryFromStorage() {
        try {
            const saved = localStorage.getItem('xmframer_history');
            if (saved) {
                this.generationHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.generationHistory = [];
        }
    },
    
    // 重置状态
    reset() {
        this.originalImage = null;
        this.originalImageUrl = null;
        this.rawImageUrl = null;
        this.processedFrames = [];
        this.frameCanvases = [];
        this.currentGifBlob = null;
        this.loopConsistency = true;
        this.rows = 0;
        this.cols = 0;
        this.originalFrames = [];
        this.interpolatedFrames = [];
        this.isInterpolated = false;
    }
};

// 导出状态对象
window.AppState = AppState;