@echo off
cd /d "%~dp0.."
set ECC_SITE_ROOT=%CD%
echo Comando ECC — http://localhost:3848
echo Se a publicacao falhar, feche esta janela e execute de novo.
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3848 ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1
start "Comando ECC" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3848"
npm run comando
