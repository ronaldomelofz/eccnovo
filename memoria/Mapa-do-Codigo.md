# Mapa do Código

## Site público (existente)

| Caminho | Função |
|---------|--------|
| `app/page.tsx` | Site com abas ano + ordem |
| `app/data/encontros.ts` | Gerado pelo sync |
| `app/data/casais.ts` / `rodada.ts` | Ordem e rodada Alimento do Amor |
| `scripts/sync-*.js` | Planilha + FOTOS → site |

## Gestor local (novo)

| Caminho | Função |
|---------|--------|
| `gestor/server.js` | Express: API + UI estática |
| `gestor/lib/store.js` | Ler/gravar JSON e fotos |
| `gestor/lib/rodada.js` | Cálculo de rodada / próximo |
| `gestor/lib/netlify.js` | Login Netlify, nomes, criar site, deploy |
| `gestor/lib/site-generator.js` | Gera HTML estático + zip |
| `gestor/electron-main.js` | App desktop Windows/Mac |
| `gestor/public/` | Interface do coordenador |
| `gestor/dados/` | Dados locais (gitignore parcial) |
| `dist-gestor/` | Instaladores gerados |
| `memoria/` | Notas Obsidian do produto |

## Comandos

```bash
npm run gestor              # sobe o gestor local
npm run gestor:seed         # importa grupo Alimento do Amor (opcional)
npm run gestor:desktop      # Electron
npm run gestor:dist:win     # .exe Windows
npm run gestor:dist:mac     # .dmg macOS (no Mac)
```
