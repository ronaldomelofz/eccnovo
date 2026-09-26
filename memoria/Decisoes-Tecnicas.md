# Decisões Técnicas

## Stack do Gestor

| Peça | Escolha | Motivo |
|------|---------|--------|
| Runtime | Node.js | Já usado no monorepo |
| API | Express | Simples, arquivos locais |
| UI | HTML + JS no próprio Express (SPA leve) | Sem build complexo; abre no navegador |
| Dados | JSON em disco | Portátil, backup fácil, estilo Obsidian |
| Fotos | Pasta por grupo | Igual ao fluxo FOTOS/ do site |

## Por que não Electron (por enquanto)

- Coordenador abre `http://localhost:3847` no navegador
- Instalação = `npm install` + `npm run gestor`
- Electron pode ser embalado depois se pedirem .exe

## Site público vs Gestor

- **Site** (`app/`): export estático Netlify — um grupo (Alimento do Amor)
- **Gestor** (`gestor/`): multi-grupo local; pode exportar dados no formato do site depois

## Memória Obsidian

Pasta `memoria/` versionada no git — fonte de verdade de regras para humanos e agentes.
