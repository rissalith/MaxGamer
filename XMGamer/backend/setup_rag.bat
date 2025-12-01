@echo off
chcp 65001 >nul
echo ========================================
echo MaxGamer RAG系统安装和初始化
echo ========================================
echo.

echo [步骤 1/3] 安装RAG依赖包...
echo.
pip install -r requirements_rag.txt
if %errorlevel% neq 0 (
    echo [错误] 依赖包安装失败
    pause
    exit /b 1
)
echo.
echo [OK] 依赖包安装完成
echo.

echo [步骤 2/3] 下载向量模型（首次运行需要下载约420MB）...
echo 模型: paraphrase-multilingual-MiniLM-L12-v2
echo.
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"
if %errorlevel% neq 0 (
    echo [警告] 模型下载可能失败，但会在首次使用时自动下载
)
echo.
echo [OK] 模型准备完成
echo.

echo [步骤 3/3] 初始化知识库向量数据库...
echo.
python scripts/init_rag.py
if %errorlevel% neq 0 (
    echo [错误] 知识库初始化失败
    pause
    exit /b 1
)
echo.

echo ========================================
echo RAG系统安装完成！
echo ========================================
echo.
echo 向量数据库位置: ./vector_db/
echo 知识库文件: ./knowledge_base/max/
echo.
echo 现在可以启动后端服务器测试RAG功能
echo.
pause