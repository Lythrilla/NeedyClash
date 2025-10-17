@echo off
chcp 65001 >nul
echo ========================================
echo Clash Verge Rev - Lythrilla Edition
echo 构建脚本
echo ========================================
echo.

echo [1/3] 检查环境...
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 pnpm，请先安装: npm install -g pnpm
    pause
    exit /b 1
)

where cargo >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Rust，请先安装: https://rustup.rs/
    pause
    exit /b 1
)

echo ✓ 环境检查通过
echo.

echo [2/3] 安装依赖...
call pnpm install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo ✓ 依赖安装完成
echo.

echo [3/3] 开始构建...
echo 这可能需要 10-30 分钟，请耐心等待...
echo.
call pnpm run build
if %errorlevel% neq 0 (
    echo [错误] 构建失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✓ 构建完成！
echo ========================================
echo.
echo 构建产物位置：
echo - EXE 文件: src-tauri\target\release\clash-verge.exe
echo - 安装包: src-tauri\target\release\bundle\
echo.
pause


