@echo off
echo ========================================
echo 启动前端HTTP服务器
echo ========================================
cd /d %~dp0

REM 尝试使用系统PATH中的python
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo 使用系统Python环境启动HTTP服务器
    echo 前端地址: http://localhost:8000
    echo.
    python -m http.server 8000
    goto :end
)

REM 尝试使用py启动器
where py >nul 2>nul
if %errorlevel% equ 0 (
    echo 使用py启动器启动HTTP服务器
    echo 前端地址: http://localhost:8000
    echo.
    py -m http.server 8000
    goto :end
)

REM 尝试Python 3.14路径
if exist "C:\Python314\python.exe" (
    echo 使用Python 3.14启动HTTP服务器
    echo 前端地址: http://localhost:8000
    echo.
    C:\Python314\python.exe -m http.server 8000
    goto :end
)

if exist "%LOCALAPPDATA%\Programs\Python\Python314\python.exe" (
    echo 使用Python 3.14启动HTTP服务器
    echo 前端地址: http://localhost:8000
    echo.
    "%LOCALAPPDATA%\Programs\Python\Python314\python.exe" -m http.server 8000
    goto :end
)

REM 尝试Python 3.12路径
if exist "C:\Python312\python.exe" (
    echo 使用Python 3.12启动HTTP服务器
    echo 前端地址: http://localhost:8000
    echo.
    C:\Python312\python.exe -m http.server 8000
    goto :end
)

if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    echo 使用Python 3.12启动HTTP服务器
    echo 前端地址: http://localhost:8000
    echo.
    "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" -m http.server 8000
    goto :end
)

echo.
echo ========================================
echo 错误: 未找到Python环境！
echo ========================================
echo 请确保已安装Python 3.9或更高版本
echo ========================================

:end
pause