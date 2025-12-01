/**
 * 自动更新版本号脚本
 * 使用方法：node update-version.js
 */

const fs = require('fs');
const path = require('path');

// 生成新版本号（时间戳格式：YYYYMMDDHHmmss）
function generateVersion() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
}

// 更新version.js文件
function updateVersionFile(newVersion) {
    const versionFilePath = path.join(__dirname, 'frontend/js/version.js');
    let content = fs.readFileSync(versionFilePath, 'utf8');
    
    // 替换版本号
    content = content.replace(
        /const APP_VERSION = '[^']+';/,
        `const APP_VERSION = '${newVersion}';`
    );
    
    fs.writeFileSync(versionFilePath, content, 'utf8');
    console.log(`✅ 已更新 version.js: ${newVersion}`);
}

// 查找并更新HTML文件中的硬编码版本号
function updateHtmlFiles(newVersion) {
    const htmlDir = path.join(__dirname, 'frontend');
    const htmlFiles = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));
    
    let updatedCount = 0;
    htmlFiles.forEach(file => {
        const filePath = path.join(htmlDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 替换所有 ?v=旧版本号 为 ?v=新版本号
        const oldContent = content;
        content = content.replace(/\?v=\d{14}/g, `?v=${newVersion}`);
        
        if (content !== oldContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            updatedCount++;
            console.log(`✅ 已更新 ${file}`);
        }
    });
    
    if (updatedCount === 0) {
        console.log('ℹ️  没有找到需要更新的HTML文件');
    }
}

// 主函数
function main() {
    console.log('🚀 开始更新版本号...\n');
    
    const newVersion = generateVersion();
    console.log(`📦 新版本号: ${newVersion}\n`);
    
    // 更新version.js
    updateVersionFile(newVersion);
    
    // 更新HTML文件
    updateHtmlFiles(newVersion);
    
    console.log('\n✨ 版本号更新完成！');
    console.log('\n📝 后续步骤：');
    console.log('1. 提交代码到Git');
    console.log('2. 部署到服务器');
    console.log('3. 清除Cloudflare缓存');
}

// 运行
main();