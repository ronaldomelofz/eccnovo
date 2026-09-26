# Importar site existente

Na aba **Configuração**, use **Importar de site existente**:

1. Cole a URL (ex.: `https://eccalimentodoamor.netlify.app/`)
2. **Pré-visualizar** — mostra nome, quantidade de encontros/casais e período
3. **Importar para novo grupo** — cria o grupo local com:
   - nome e período do cabeçalho
   - ordem dos casais
   - todos os encontros (data, anfitrião, nº/temário)
   - logo e fotos baixadas

## Como funciona

| Tipo de site | Estratégia |
|--------------|------------|
| Next.js (Alimento do Amor) | Lê o chunk `/_next/static/chunks/app/page-*.js` com os dados embutidos |
| HTML do Gestor | Faz parse dos `<article class="card">` e da lista de ordem |

Grupos importados ficam com `preservarNumerosTemario: true` para manter a numeração oficial do site de origem.

Código: `gestor/lib/importar-site.js` · API `POST /api/importar-site` e `/api/importar-site/preview`.
