#!/bin/bash

echo "🚀 Configurando ECC Alimento do Amor para Deploy Automático"
echo "=========================================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

echo "📦 Instalando dependências..."
npm install

echo "🔧 Configurando Git..."
git init
git add .
git commit -m "Configuração inicial do projeto ECC"

echo "🌐 Configurando repositório remoto..."
echo "Por favor, execute os seguintes comandos:"
echo ""
echo "1. Crie um repositório no GitHub: https://github.com/ronaldomelofz/ecc"
echo "2. Execute: git remote add origin https://github.com/ronaldomelofz/ecc.git"
echo "3. Execute: git push -u origin main"
echo ""
echo "📋 Próximos passos para configurar o deploy automático:"
echo ""
echo "1. Acesse: https://github.com/ronaldomelofz/ecc/settings/secrets/actions"
echo "2. Adicione os seguintes secrets:"
echo "   - NETLIFY_AUTH_TOKEN: Token do Netlify"
echo "   - NETLIFY_SITE_ID: ID do site no Netlify"
echo ""
echo "3. No Netlify, configure:"
echo "   - Build command: npm run build && npm run export"
echo "   - Publish directory: out"
echo "   - Node version: 18"
echo ""
echo "✅ Configuração concluída!"
echo "📖 Consulte o arquivo README-DEPLOY.md para instruções detalhadas"
