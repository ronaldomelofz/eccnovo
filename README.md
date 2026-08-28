# ECC Alimento do Amor

Site oficial do ECC Alimento do Amor — Encontros de Casais com Cristo.

**Site em produção:** https://eccalimentodoamor.netlify.app

**Repositório:** https://github.com/ronaldomelofz/eccnovo

## Tecnologias

- Next.js 14 (export estático)
- TypeScript
- Tailwind CSS
- Netlify (deploy principal)

## Funcionalidades

- Galeria de fotos com navegação por teclado e setas
- Abas por ano (2026, 2025, 2024, 2023)
- Interface responsiva (desktop e mobile)
- Player de áudio
- 44 encontros catalogados com dados da agenda oficial

## Desenvolvimento local

```bash
npm install
npm run dev
```

Build de produção (gera pasta `out/` para Netlify):

```bash
npm run build
```

Validar dados contra a planilha `AGENDA ENCONTROS.xlsx`:

```bash
npm run validate
```

Sincronizar fotos da pasta local `FOTOS/` para `public/FOTOS/`:

```bash
npm run sync-fotos
```

## Deploy no Netlify

O deploy é automático via GitHub Actions ao fazer push na branch `main`.

Configuração em `netlify.toml`:
- Build: `npm run build`
- Publish: `out/`

### Adicionar novos encontros

1. Coloque a foto em `FOTOS/` (pasta local) ou diretamente em `public/FOTOS/`
2. Execute `npm run sync-fotos` (se usou a pasta local)
3. Atualize `app/data/encontros.ts` com os dados da agenda
4. Execute `npm run validate` para conferir
5. Commit e push para `main` — o Netlify atualiza automaticamente

## Estrutura

```
app/data/encontros.ts   # Dados dos encontros
public/FOTOS/           # Fotos servidas pelo site
netlify.toml            # Configuração Netlify
```

---

**ECC Alimento do Amor — Encontros de Casais com Cristo**
