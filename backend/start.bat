@echo off
chcp 65001 >nul
echo ========================================
echo   FrameWorker Python 后端启动脚本
echo ========================================
echo.

REM 设置Python路径
set PYTHON_PATH=C:\Users\28218\miniconda3
set PATH=%PYTHON_PATH%;%PYTHON_PATH%\Scripts;%PATH%

REM 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到Python，请先安装Python
    pause
    exit /b 1
)

REM 检查依赖是否安装
echo [1/3] 检查依赖...
python -c "import flask" >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 正在安装依赖...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

REM 检查.env文件
echo [2/3] 检查配置...
if not exist .env (
    echo [警告] 未找到.env文件，将使用.env.example
    copy .env.example .env
)

REM 启动服务器
echo [3/3] 启动服务器...
echo.
python app.py

pause