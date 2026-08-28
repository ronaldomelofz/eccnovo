# ECC Alimento do Amor

Site oficial do ECC Alimento do Amor — Encontros de Casais com Cristo.

**Site:** https://eccalimentodoamor.netlify.app  
**Repositório:** https://github.com/ronaldomelofz/eccnovo

## Fontes oficiais (sempre usar estas pastas)

| O quê | Onde colocar |
|-------|--------------|
| **Fotos e áudio** | `FOTOS/` (raiz do projeto) |
| **Listagem dos encontros** | `AGENDA ENCONTROS.xlsx` (raiz do projeto) |

> O sistema **nunca** deve ser atualizado manualmente em `public/FOTOS/` ou `app/data/encontros.ts`.  
> Use sempre `npm run sync` após alterar a planilha ou adicionar fotos.

Referência no código: `scripts/fontes.js` · Memória do agente: `AGENTS.md` · Regra Cursor: `.cursor/rules/fontes-projeto.mdc`

## Adicionar novos encontros

1. Atualize a planilha `AGENDA ENCONTROS.xlsx`
2. Coloque a foto em `FOTOS/` → `ENCONTRO-{n}-{dd}-{mm}-{aaaa}.jpeg`
3. Execute:

```bash
npm run sync
```

4. Commit e push para `main` → deploy automático no Netlify

## Comandos

```bash
npm install          # instalar dependências
npm run sync         # sincroniza FOTOS/ + planilha → site
npm run validate     # valida planilha vs encontros.ts
npm run dev          # desenvolvimento local (sync automático antes)
npm run build        # build produção (sync automático antes)
```

## Estrutura

```
FOTOS/                    ← FONTE: fotos e áudio (você edita aqui)
AGENDA ENCONTROS.xlsx     ← FONTE: dados dos encontros
public/FOTOS/             ← gerado pelo sync (não editar)
app/data/encontros.ts     ← gerado pelo sync (não editar)
scripts/fontes.js         ← caminhos oficiais centralizados
```

---

**ECC Alimento do Amor — Encontros de Casais com Cristo**
