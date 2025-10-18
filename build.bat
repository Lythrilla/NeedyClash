@echo off
chcp 65001 >nul
echo ========================================
echo NeedyClash Rev - Lythrilla Edition
echo 构建脚本
echo ========================================
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




