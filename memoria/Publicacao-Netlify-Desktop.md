# Publicação Netlify e App Desktop

## App instalável

- Empacotamento com **Electron** (Windows `.exe` / Mac `.dmg`)
- Comandos: `npm run gestor:desktop` (dev) · `npm run gestor:dist` (instaladores)
- O app embute o servidor local e abre a janela do Gestor

## Logo do grupo

- Campo `logo` em `grupo.json` (arquivo em `dados/{id}/logo.ext`)
- Usado no site público gerado e na tela de configuração

## Integração Netlify

Fluxo do coordenador:

1. Aba **Publicar site**
2. **Conectar Netlify** → abre login (Gmail/Google, GitHub, e-mail)
3. Sistema autentica via ticket OAuth (mesmo mecanismo do Netlify CLI)
4. Sugere nomes de site a partir do nome do grupo (ex.: `ecc-alimento-do-amor`)
5. Usuário escolhe uma sugestão ou digita outro nome
6. Sistema cria o site na conta Netlify (se ainda não existir)
7. Gera o site estático (HTML + fotos + logo) e faz o **deploy**
8. Mostra a URL final (`https://nome.netlify.app`)

Credenciais salvas localmente em `gestor/dados/netlify-auth.json` (não versionar).

## Geração do site

`gestor/lib/site-generator.js` monta pasta `export/` com:

- `index.html` (encontros por ano + ordem dos casais)
- `fotos/` + `logo`

Depois compacta e envia para a API de deploy do Netlify.
