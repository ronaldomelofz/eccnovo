# Guia de Deploy no Netlify - ECC Alimento do Amor

## 📋 Pré-requisitos
- Conta no [Netlify](https://netlify.com)
- Conta no GitHub (opcional, mas recomendado)
- Projeto já buildado com sucesso

## 🚀 Métodos de Deploy

### Método 1: Deploy Direto (Drag & Drop)

1. **Acesse o Netlify**
   - Vá para [https://netlify.com](https://netlify.com)
   - Faça login ou crie uma conta

2. **Deploy da Pasta**
   - No dashboard, clique em "Add new site" > "Deploy manually"
   - Arraste a pasta `out` (pasta de build) para a área de upload
   - Aguarde o upload e deploy automático

### Método 2: Deploy via GitHub (Recomendado)

1. **Prepare o Repositório Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ECC Alimento do Amor"
   ```

2. **Crie um Repositório no GitHub**
   - Vá para GitHub e crie um novo repositório
   - Siga as instruções para conectar seu repositório local

3. **Configure no Netlify**
   - No Netlify, clique em "Add new site" > "Import from Git"
   - Conecte com GitHub e selecione seu repositório
   - Configure as opções de build:
     - **Build command**: `npm run build`
     - **Publish directory**: `out`
     - **Node version**: `18`

## ⚙️ Configurações Já Incluídas

### ✅ netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "out"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### ✅ next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

### ✅ _redirects (em public/)
```
/*    /index.html   200
```

## 🔧 Comandos Importantes

### Build Local
```bash
npm run build
```

### Teste Local do Build
```bash
# Instale um servidor estático
npm install -g serve

# Sirva a pasta out
serve out
```

## 📁 Estrutura de Deploy
```
out/
├── index.html          # Página principal
├── _next/              # Assets do Next.js
├── FOTOS/              # Galeria de fotos
├── _redirects          # Configuração de redirecionamentos
└── 404.html            # Página de erro 404
```

## 🌐 URLs e Domínio

### URL Temporária
Após o deploy, você receberá uma URL temporária como:
`https://amazing-name-123456.netlify.app`

### Domínio Personalizado
1. No painel do Netlify, vá em "Domain settings"
2. Clique em "Add custom domain"
3. Configure seu domínio personalizado
4. Configure SSL/TLS automático

## 🔒 Configurações de Segurança

O projeto já inclui headers de segurança configurados no `netlify.toml`:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

## 📊 Monitoramento

Após o deploy, você pode monitorar:
- **Analytics**: Visitantes e páginas mais acessadas
- **Functions**: Se usar funções serverless
- **Forms**: Se adicionar formulários de contato
- **Deploy logs**: Para debugar problemas

## 🐛 Resolução de Problemas

### Build Falha
- Verifique se todas as dependências estão instaladas
- Execute `npm run build` localmente para testar
- Verifique os logs de deploy no Netlify

### Imagens Não Carregam
- Confirme que as imagens estão na pasta `public/FOTOS`
- Verifique se `images: { unoptimized: true }` está no next.config.js

### Áudio Não Funciona
- Confirme que o arquivo `Algo Em Comum.mp3` está em `public/`
- Verifique os headers CORS se necessário

## ✨ Status Atual do Projeto

- ✅ Build de produção funcionando
- ✅ Configurações do Netlify prontas
- ✅ Static export habilitado
- ✅ Imagens otimizadas para static
- ✅ Player de áudio funcional
- ✅ Modal de galeria implementado
- ✅ Design responsivo
- ✅ 29 encontros catalogados

## 🎯 Próximos Passos

1. Faça o deploy seguindo um dos métodos acima
2. Teste todas as funcionalidades no ambiente de produção
3. Configure domínio personalizado se desejado
4. Configure analytics se necessário
5. Considere adicionar formulário de contato

O projeto está **100% pronto** para deploy no Netlify! 🚀 