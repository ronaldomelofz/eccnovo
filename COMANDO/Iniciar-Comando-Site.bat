@echo off
cd /d "%~dp0.."
set ECC_SITE_ROOT=%CD%
echo Comando ECC — http://localhost:3848
echo Feche esta janela para encerrar o servidor.
start "Comando ECC" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3848"
npm run comando
