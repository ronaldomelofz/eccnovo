# Publicação Netlify e App Desktop

## App instalável

- Empacotamento com **Electron** (Windows `.exe` / Mac `.dmg`)
- Comandos: `npm run gestor:desktop` (dev) · `npm run gestor:dist` (instaladores)
- O app embute o servidor local e abre a janela do Gestor

## Logo do grupo

- Campo `logo` em `grupo.json` (arquivo em `dados/{id}/logo.ext`)
- Usado no site público gerado e na tela de configuração

## Integração Netlify (automatizada)

Fluxo do coordenador:

1. Aba **Publicar site**
2. **Conectar Netlify** → abre login (Gmail/Google, GitHub, e-mail)
3. Sistema autentica via ticket OAuth (mesmo mecanismo do Netlify CLI)
4. **Se a conta for nova**: o Netlify pede `signup-questions` (nome + uso). É obrigatório completar no navegador; sem isso a API não cria sites
5. Digita o nome do site (ex.: `ecc-meu-grupo`) e verifica disponibilidade
6. **Criar/atualizar site e publicar** executa automaticamente:
   - valida conta e time (`GET /accounts`)
   - cria o site no time (`POST /{account_slug}/sites`) ou reutiliza se já existir
   - gera ZIP estático e envia (`POST /sites/{id}/deploys` com `Content-Type: application/zip`)
   - **aguarda** o deploy chegar em `state: ready` (polling `GET /deploys/{id}`)
   - confirma que `https://nome.netlify.app` responde (não “Site not found”)
   - abre a URL no navegador
7. Mostra a URL final

Credenciais salvas localmente em `gestor/dados/netlify-auth.json` (ou `userData/dados` no Electron). Não versionar.

### Por que “Site not found” aparecia

- O Gestor marcava sucesso assim que o ZIP era **enviado**, sem esperar o Netlify terminar o pós-processamento
- Conta incompleta (signup) cria site vazio ou bloqueia deploy
- Digitar URL errada no navegador (ex.: `testeocc` vs `testeecc`) também gera a página de erro do Netlify

## Geração do site

`gestor/lib/site-generator.js` monta pasta `export/` com:

- `index.html` (encontros por ano + ordem dos casais)
- `fotos/` + `logo`
- `_headers`

Depois compacta (arquivos na raiz do ZIP) e envia para a API de deploy do Netlify.
