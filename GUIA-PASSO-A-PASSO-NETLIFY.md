# 🚀 GUIA PASSO A PASSO - CONFIGURAÇÃO NETLIFY

## ⚡ CONFIGURAÇÃO RÁPIDA (5 MINUTOS)

### PASSO 1: Acessar o Netlify

1. Abra seu navegador
2. Acesse: **https://app.netlify.com/projects/eccalimentodoamor/settings/deploys**
3. Faça login (se necessário)

---

### PASSO 2: Conectar ao GitHub

**Na página de Settings:**

1. Procure a seção **"Build & deploy"** no menu lateral
2. Clique em **"Link site to Git repository"** (ou "Connect repository")
3. Escolha **"GitHub"**
4. Autorize o Netlify a acessar sua conta GitHub (se solicitado)
5. Selecione o repositório: **`ronaldomelofz/eccnovo`**
6. Branch para deploy: **`main`**

---

### PASSO 3: Configurar Build Settings

**Ainda na mesma página, configure:**

```
Base directory: (deixe em branco ou /)
Build command: npm run build
Publish directory: out
```

**Environment variables (opcional):**
```
NODE_VERSION = 18
```

Para adicionar:
1. Clique em "New variable"
2. Key: `NODE_VERSION`
3. Value: `18`
4. Clique em "Add"

---

### PASSO 4: Fazer o Primeiro Deploy

**Opção A - Deploy Automático:**
1. Clique em **"Deploys"** no topo
2. Clique em **"Trigger deploy"** → **"Deploy site"**
3. Aguarde 2-3 minutos ⏱️

**Opção B - Deploy via Git:**
```bash
# No seu terminal
git commit --allow-empty -m "Trigger deploy"
git push origin main
```

---

### PASSO 5: Verificar o Deploy

1. Acesse: **https://app.netlify.com/projects/eccalimentodoamor/deploys**
2. Você verá o deploy em andamento
3. Status deve mudar de "Building" → "Published" ✅
4. Clique no link do site para visualizar

---

## 🔧 CONFIGURAÇÕES AVANÇADAS (Opcional)

### A. Configurar Domínio Personalizado

1. Vá em **"Domain settings"**
2. Clique em **"Add custom domain"**
3. Digite seu domínio
4. Siga as instruções para configurar DNS

### B. Configurar HTTPS

1. Em **"Domain settings"**
2. Role até **"HTTPS"**
3. Clique em **"Verify DNS configuration"**
4. Clique em **"Provision certificate"**
5. Aguarde alguns minutos ⏱️

### C. Configurar Notificações de Deploy

1. Vá em **"Site settings"** → **"Build & deploy"**
2. Role até **"Deploy notifications"**
3. Clique em **"Add notification"**
4. Escolha tipo (Email, Slack, etc.)
5. Configure conforme necessário

---

## 🎯 VERIFICAÇÃO FINAL

Após o deploy, teste:

### 1. Página Principal
- Acesse: `https://[seu-site].netlify.app`
- ✅ Deve mostrar todos os encontros
- ✅ Fotos devem carregar
- ✅ Modal de fotos deve funcionar

### 2. Página Admin
- Acesse: `https://[seu-site].netlify.app/admin`
- ✅ Digite senha: `amoragape`
- ✅ Formulário deve aparecer
- ✅ Tente adicionar um encontro de teste

### 3. Funcionalidade de Salvamento
- ⚠️ **IMPORTANTE**: O salvamento automático funciona apenas em ambiente de desenvolvimento local
- Para produção no Netlify (site estático), cada novo encontro requer:
  1. Adicionar no código: `app/data/encontros.ts`
  2. Fazer commit e push
  3. Deploy automático acontece

---

## 🔄 ALTERNATIVA: USAR NETLIFY CLI

Se preferir fazer via linha de comando:

### Instalar Netlify CLI
```bash
npm install -g netlify-cli
```

### Login no Netlify
```bash
netlify login
```

### Conectar o Site
```bash
netlify link
# Escolha: "Use current git remote origin"
```

### Deploy Manual
```bash
netlify deploy --prod
```

---

## ⚠️ OBSERVAÇÃO IMPORTANTE SOBRE O SISTEMA

### Como Funciona o Salvamento:

**Ambiente Local (Development):**
- ✅ API `/api/encontros` funciona
- ✅ Salva diretamente no arquivo
- ✅ Mudanças imediatas

**Ambiente Produção (Netlify - Site Estático):**
- ⚠️ API routes não funcionam em export estático
- ✅ Solução: Adicionar encontros editando `app/data/encontros.ts`
- ✅ Commit + Push = Deploy automático
- ✅ Encontro aparece no site em 2-3 minutos

### Para Fazer o Sistema Funcionar TOTALMENTE em Produção:

Você tem 3 opções:

**Opção 1: Manter como está (Recomendado para simplicidade)**
- Edite `app/data/encontros.ts` localmente
- Faça commit e push
- Deploy automático

**Opção 2: Usar Netlify Functions (Requer mudanças)**
- Migrar API route para Netlify Function
- Usar banco de dados externo (Supabase, Firebase)
- Sistema totalmente automático em produção

**Opção 3: Usar Vercel em vez de Netlify**
- Vercel suporta API routes nativamente
- Sistema funciona 100% como no local
- Configuração similar

---

## 📞 LINKS DE SUPORTE

- **Documentação Netlify**: https://docs.netlify.com/
- **Suporte Netlify**: https://answers.netlify.com/
- **Status Netlify**: https://www.netlifystatus.com/

---

## 🎉 RESUMO RÁPIDO

```
✅ Acesse: https://app.netlify.com/projects/eccalimentodoamor
✅ Conecte ao GitHub: ronaldomelofz/eccnovo
✅ Branch: main
✅ Build command: npm run build
✅ Publish directory: out
✅ Trigger deploy
✅ Aguarde 2-3 minutos
✅ Site no ar!
```

---

**🎊 Após seguir estes passos, seu site estará ONLINE e FUNCIONANDO! 🎊**
