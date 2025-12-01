/**
 * 版本管理 - 集中管理所有静态资源的版本号
 * 更新版本号时只需修改这一个文件
 */

// 当前版本号 - 使用时间戳确保唯一性
const APP_VERSION = '20251130190333';

// 导出版本号
window.APP_VERSION = APP_VERSION;

/**
 * 获取带版本号的资源URL
 * @param {string} url - 资源路径
 * @returns {string} 带版本号的完整URL
 */
window.getVersionedUrl = function(url) {
    if (!url) return url;
    
    // 如果URL已经包含查询参数，使用&连接
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${APP_VERSION}`;
};

/**
 * 动态加载JS文件（带版本号）
 * @param {string} src - JS文件路径
 * @returns {Promise} 加载完成的Promise
 */
window.loadScript = function(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = getVersionedUrl(src);
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

/**
 * 动态加载CSS文件（带版本号）
 * @param {string} href - CSS文件路径
 * @returns {Promise} 加载完成的Promise
 */
window.loadStylesheet = function(href) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = getVersionedUrl(href);
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
    });
};

console.log(`[版本管理] 当前版本: ${APP_VERSION}`);