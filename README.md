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
npm run gestor       # Gestor Local (coordenadores) → http://localhost:3847
npm run gestor:seed  # importa grupo Alimento do Amor no gestor
npm run gestor:desktop   # app instalável (Electron)
npm run gestor:dist:win  # gera ECC-Gestor-Setup.exe
```

## ECC Gestor Local

Aplicação para coordenadores de **qualquer grupo ECC** organizarem encontros no PC:

- Configuração (nome, período, casais, **logo**)
- Cadastro de encontros (foto, anfitrião, data, ordem, temário)
- Controle da ordem / rodada e sugestão do próximo encontro
- **Publicação automática no Netlify** (login Gmail/Google, nome do site, deploy)

Docs: `gestor/README.md` · Memória Obsidian: `memoria/`

## Estrutura

```
FOTOS/                    ← FONTE: fotos e áudio (você edita aqui)
AGENDA ENCONTROS.xlsx     ← FONTE: dados dos encontros
public/FOTOS/             ← gerado pelo sync (não editar)
app/data/encontros.ts     ← gerado pelo sync (não editar)
scripts/fontes.js         ← caminhos oficiais centralizados
gestor/                   ← app local multi-grupo (Electron + Netlify)
memoria/                  ← notas Obsidian do produto Gestor
dist-gestor/              ← instaladores Windows/Mac (gerados)
```

---

**ECC Alimento do Amor — Encontros de Casais com Cristo**
