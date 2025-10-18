# 🚀 Configuração do Deploy no Netlify

## ✅ Status Atual

- ✅ **Repositório GitHub**: https://github.com/ronaldomelofz/eccnovo
- ✅ **Projeto Netlify**: eccalimentodoamor
- ✅ **Código enviado com sucesso para o GitHub**

## 🔧 Configuração do Netlify

### 1. Conectar Repositório ao Netlify

Acesse: https://app.netlify.com/projects/eccalimentodoamor/settings/deploys

**Configure:**

1. **Repository**: 
   - Conecte ao repositório: `ronaldomelofz/eccnovo`
   - Branch: `main`

2. **Build Settings**:
   ```
   Build command: npm run build
   Publish directory: out
   ```

3. **Environment Variables** (se necessário):
   ```
   NODE_VERSION: 18
   ```

### 2. Configuração de Deploy Automático

O arquivo `.github/workflows/deploy.yml` já está configurado para fazer deploy automático quando houver push na branch `main`.

**Secrets Necessários no GitHub:**

Acesse: https://github.com/ronaldomelofz/eccnovo/settings/secrets/actions

Adicione:
- `NETLIFY_AUTH_TOKEN`: Token de autenticação do Netlify
- `NETLIFY_SITE_ID`: ID do site no Netlify

#### Como obter o NETLIFY_AUTH_TOKEN:
1. Acesse: https://app.netlify.com/user/applications
2. Clique em "New access token"
3. Dê um nome descritivo (ex: "GitHub Actions Deploy")
4. Copie o token gerado

#### Como obter o NETLIFY_SITE_ID:
1. Acesse: https://app.netlify.com/projects/eccalimentodoamor/settings/general
2. Procure por "Site information"
3. Copie o "Site ID"

### 3. Deploy Manual (Primeira vez)

Se preferir fazer o primeiro deploy manualmente:

1. Acesse: https://app.netlify.com/projects/eccalimentodoamor/deploys
2. Clique em "Trigger deploy" → "Deploy site"
3. Aguarde o build completar

### 4. Verificar Deploy

Após o deploy, acesse:
- **URL do Site**: https://eccalimentodoamor.netlify.app (ou o domínio configurado)
- **Página Admin**: https://eccalimentodoamor.netlify.app/admin
- **Senha Admin**: `amoragape`

## 🎯 Funcionalidades Implementadas

### Sistema de Salvamento Automático
- ✅ API route `/api/encontros` para salvar encontros
- ✅ Interface administrativa em `/admin`
- ✅ Salvamento direto no arquivo `app/data/encontros.ts`
- ✅ Atualização automática sem rebuild necessário

### Deploy Automático
- ✅ GitHub Actions configurado
- ✅ Deploy automático ao fazer push na branch `main`
- ✅ Build e publicação automáticos

## 📝 Como Usar

### Para Administradores:
1. Acesse `/admin` no site
2. Digite a senha: `amoragape`
3. Preencha os dados do novo encontro
4. Clique em "Salvar Encontro"
5. O encontro será salvo e aparecerá imediatamente no site

### Para Deploy de Mudanças:
1. Faça suas alterações no código
2. Commit e push para o GitHub:
   ```bash
   git add .
   git commit -m "Descrição das mudanças"
   git push origin main
   ```
3. O GitHub Actions fará o deploy automático
4. O site será atualizado em poucos minutos

## 🔒 Segurança

- ✅ Área administrativa protegida por senha
- ✅ Validação de dados no backend
- ✅ Código versionado no GitHub
- ✅ Backup automático dos dados

## 📞 Suporte

Em caso de dúvidas ou problemas, verifique:
1. Logs do deploy no Netlify: https://app.netlify.com/projects/eccalimentodoamor/deploys
2. Logs do GitHub Actions: https://github.com/ronaldomelofz/eccnovo/actions
3. Status do build: Deve completar sem erros

---

**🎉 Sistema pronto para uso! Deploy automático configurado com sucesso!**
