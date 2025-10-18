# 🚀 COMO FAZER DEPLOY NO NETLIFY

## ⚠️ IMPORTANTE: Use a pasta OUT, não a pasta raiz!

### 📋 PASSO A PASSO:

1. **PRIMEIRO: Gere os arquivos de produção**
   ```
   npm run build
   ```
   ✅ Isso criará uma pasta chamada `out`

2. **SEGUNDO: Acesse o Netlify**
   - Vá para: https://netlify.com
   - Clique em "Deploy site"

3. **TERCEIRO: Faça upload da pasta OUT**
   - 🔴 **NÃO** arraste a pasta raiz do projeto
   - ✅ **SIM** arraste APENAS a pasta `out`
   - A pasta `out` contém todos os arquivos necessários

### 📁 Estrutura da pasta OUT:
```
out/
├── index.html          ← Página principal
├── 404.html           ← Página de erro
├── _redirects         ← Redirecionamentos
├── FOTOS/             ← Todas as imagens e música
└── _next/             ← Arquivos do Next.js
```

### 🎯 Resultado esperado:
- ✅ Site abre normalmente
- ✅ Logo aparece à esquerda
- ✅ Título centralizado
- ✅ Todas as fotos carregam
- ✅ Player de música funciona

### 🐛 Se não funcionar:
1. Verifique se você arrastou a pasta `out` (não a raiz)
2. Aguarde alguns minutos para propagação
3. Limpe o cache do navegador (Ctrl+F5)

---

## 📞 RESUMO SIMPLES:
1. `npm run build` (gera pasta out)
2. Acesse netlify.com
3. Arraste APENAS a pasta `out`
4. Pronto! 🎉 