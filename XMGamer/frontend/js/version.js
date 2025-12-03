/**
 * 资源加载工具 + 自动版本管理
 * 使用构建时间戳自动处理缓存问题
 */

// 版本号：部署时自动更新（GitHub Actions 会替换这个值）
window.APP_VERSION = '__BUILD_TIMESTAMP__';

// 如果没有被替换，使用当前时间戳（开发环境）
if (window.APP_VERSION === '__BUILD_TIMESTAMP__') {
    window.APP_VERSION = Date.now().toString();
}

/**
 * 给URL添加版本参数
 * @param {string} url - 原始URL
 * @returns {string} 带版本参数的URL
 */
window.addVersion = function(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${window.APP_VERSION}`;
};

/**
 * 动态加载JS文件
 * @param {string} src - JS文件路径
 * @returns {Promise} 加载完成的Promise
 */
window.loadScript = function(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = addVersion(src);
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

/**
 * 动态加载CSS文件
 * @param {string} href - CSS文件路径
 * @returns {Promise} 加载完成的Promise
 */
window.loadStylesheet = function(href) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = addVersion(href);
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
    });
};

console.log('[版本] APP_VERSION:', window.APP_VERSION);
