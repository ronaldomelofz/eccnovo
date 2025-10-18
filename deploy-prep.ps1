# Script de Preparacao para Deploy no Netlify
# ECC Alimento do Amor

Write-Host "Preparando projeto para deploy no Netlify..." -ForegroundColor Green

# Verificar se estamos no diretorio correto
if (!(Test-Path "package.json")) {
    Write-Host "Erro: Execute este script na raiz do projeto!" -ForegroundColor Red
    exit 1
}

Write-Host "Instalando dependencias..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro na instalacao das dependencias!" -ForegroundColor Red
    exit 1
}

Write-Host "Executando build de producao..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro no build!" -ForegroundColor Red
    exit 1
}

Write-Host "Verificando arquivos de build..." -ForegroundColor Yellow

$requiredFiles = @(
    "out/index.html",
    "out/_next",
    "out/FOTOS",
    "out/_redirects",
    "netlify.toml",
    "public/_redirects"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (!(Test-Path $file)) {
        Write-Host "Arquivo necessario nao encontrado: $file" -ForegroundColor Red
        $allFilesExist = $false
    } else {
        Write-Host "OK: $file" -ForegroundColor Green
    }
}

if (!$allFilesExist) {
    Write-Host "Alguns arquivos necessarios estao faltando!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Projeto preparado com sucesso para deploy!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "1. Acesse https://netlify.com" -ForegroundColor White
Write-Host "2. Clique em Add new site > Deploy manually" -ForegroundColor White
Write-Host "3. Arraste a pasta out para a area de upload" -ForegroundColor White
Write-Host "4. Aguarde o deploy automatico" -ForegroundColor White
Write-Host ""
Write-Host "Pasta para upload: $((Get-Location).Path)\out" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para mais detalhes, consulte: DEPLOY-NETLIFY-FINAL.md" -ForegroundColor Cyan 