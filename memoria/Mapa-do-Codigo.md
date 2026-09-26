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
| `gestor/public/` | Interface do coordenador |
| `gestor/dados/` | Dados locais (gitignore parcial) |
| `memoria/` | Notas Obsidian do produto |

## Comandos

```bash
npm run gestor          # sobe o gestor local
npm run gestor:seed     # importa grupo Alimento do Amor (opcional)
```
