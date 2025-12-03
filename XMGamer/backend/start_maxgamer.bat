@echo off
chcp 65001 >nul
echo ================================================
echo MaxGamer V1.0 启动脚本
echo ================================================
echo.

:: 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 初始化数据
echo [1/2] 初始化数据库和示例数据...
python init_maxgamer_data.py
if errorlevel 1 (
    echo [错误] 初始化数据失败
    pause
    exit /b 1
)

echo.
echo [2/2] 启动服务...
echo.
echo ================================================
echo MaxGamer V1.0 服务启动中...
echo 访问地址: http://localhost:5000
echo 管理员账号: admin@maxgamer.com / admin123
echo ================================================
echo.

:: 启动服务
python start.py


