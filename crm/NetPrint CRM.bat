@echo off
title NetPrint CRM - Dev Server
color 0A

echo ========================================
echo    NetPrint CRM - Starting...
echo ========================================
echo.

:: Kiem tra xem port 3333 da chay chua
netstat -ano | findstr ":3333" >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Server da chay roi, mo trinh duyet...
    start "" http://localhost:3333
    exit
)

echo [*] Dang khoi dong dev server...
echo [*] Trinh duyet se tu dong mo sau 5 giay...
echo.

:: Mo trinh duyet sau 5 giay (chay ngam)
start /b cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3333"

:: Chay dev server
cd /d "c:\Users\MSI\Code_Netprint\Code_NetPrint_8\CRM"
npm run dev
