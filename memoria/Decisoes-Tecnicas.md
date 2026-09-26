# Decisões Técnicas

## Stack do Gestor

| Peça | Escolha | Motivo |
|------|---------|--------|
| Runtime | Node.js | Já usado no monorepo |
| API | Express | Simples, arquivos locais |
| UI | HTML + JS no próprio Express (SPA leve) | Sem build complexo; abre no navegador |
| Dados | JSON em disco | Portátil, backup fácil, estilo Obsidian |
| Fotos | Pasta por grupo | Igual ao fluxo FOTOS/ do site |

## Empacotamento leve (Electron)

- App do Gestor usa `directories.app = gestor` com `gestor/package.json` contendo **somente** `express`, `multer` e `archiver`
- O site Next.js continua nas deps da raiz — **não** entra no .exe
- `electronLanguages` limitado a pt/en (remove dezenas de locales do Chromium)
- `compression: maximum` no instalador NSIS
- Build: `npm run gestor:dist:win` → `scripts/build-gestor-electron.js`

## Site público vs Gestor

- **Site** (`app/`): export estático Netlify — um grupo (Alimento do Amor)
- **Gestor** (`gestor/`): multi-grupo local; pode exportar dados no formato do site depois

## Memória Obsidian

Pasta `memoria/` versionada no git — fonte de verdade de regras para humanos e agentes.
