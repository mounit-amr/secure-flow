@echo off
setlocal

cd /d "%~dp0"
del /q "*.spec" 2>nul
if exist "build" rmdir /s /q "build"
if exist "dist" rmdir /s /q "dist"

pyinstaller --noconsole --onefile --name "PaymentGatewayApp" --add-data "frontend;frontend" --hidden-import "webview" --hidden-import "clr" backend/desktop_app.py
if errorlevel 1 (
    echo Build failed.
    exit /b 1
)

start "" "dist\PaymentGatewayApp.exe"
endlocal