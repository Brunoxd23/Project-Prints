@echo off
echo Verificando privilégios de administrador...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Executando como administrador...
    powershell -Command "Start-Process cmd -Verb RunAs -ArgumentList '/c cd /d %CD% && npm run build-win'"
    exit /b
)

echo Iniciando build...
npm run build-win