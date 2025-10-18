# Deploy no Netlify - ECC Alimento do Amor

## ✅ Projeto Pronto para Deploy

O projeto está completamente configurado para deploy no Netlify. Siga os passos abaixo:

## 🚀 Opção 1: Deploy Manual (Recomendado)

1. **Faça o build do projeto:**
   ```bash
   npm run build
   ```

2. **Acesse o Netlify:**
   - Vá para [netlify.com](https://netlify.com)
   - Faça login ou crie uma conta

3. **Deploy via Drag & Drop:**
   - Na página principal, clique em "Deploy site"
   - Arraste a pasta `out` inteira para a área de upload
   - Aguarde o upload completar

## 🔄 Opção 2: Deploy via Git (Automático)

1. **Suba o código para um repositório Git:**
   ```bash
   git init
   git add .
   git commit -m "Projeto ECC Alimento do Amor"
   git push origin main
   ```

2. **Conecte no Netlify:**
   - No Netlify, clique em "New site from Git"
   - Conecte seu repositório (GitHub/GitLab/Bitbucket)
   - Configure:
     - **Build command:** `npm run build`
     - **Publish directory:** `out`
     - **Node version:** `18`

## ⚙️ Configurações Aplicadas

- ✅ Static export configurado
- ✅ Redirecionamentos SPA
- ✅ Headers de segurança
- ✅ Cache otimizado para assets
- ✅ Todas as imagens e música incluídas
- ✅ Responsive design

## 🎯 URLs de Teste

Após o deploy, teste estas funcionalidades:
- [ ] Página inicial carrega corretamente
- [ ] Logo aparece à esquerda
- [ ] Título centralizado
- [ ] Player de música funciona
- [ ] Fotos abrem no modal
- [ ] Layout responsivo

## 🐛 Resolução de Problemas

**Se a página não carregar:**
- Verifique se a pasta `out` foi usada para deploy
- Confirme que o arquivo `_redirects` está incluído
- Verifique os logs de build no Netlify

**Se as imagens não aparecerem:**
- Confirme que a pasta `FOTOS` está dentro de `out`
- Verifique os caminhos das imagens no código

## 📞 Suporte

Em caso de problemas, verifique:
1. Logs de build no Netlify
2. Console do navegador para erros
3. Network tab para recursos não carregados

---

🎉 **Projeto pronto para produção!** 🎉 