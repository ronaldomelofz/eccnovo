# AGENTS.md — ECC Alimento do Amor

## Fontes oficiais (sempre usar)

```
E:\PROJETOS-CURSOR\SITEECC\FOTOS\              ← fotos e áudio
E:\PROJETOS-CURSOR\SITEECC\AGENDA ENCONTROS.xlsx  ← dados dos encontros
```

Referência no código: `scripts/fontes.js` e `app/data/fontes.config.ts`

## Ao atualizar o site

1. Ler dados da planilha `AGENDA ENCONTROS.xlsx`
2. Ler fotos de `FOTOS/`
3. Executar `npm run sync`
4. Não editar `encontros.ts` nem `public/FOTOS/` manualmente

## Deploy

- Repositório: https://github.com/ronaldomelofz/eccnovo
- Site: https://eccalimentodoamor.netlify.app
- Push em `main` → deploy automático Netlify

## Envio ao final (obrigatório)

**Sempre** ao concluir alterações no projeto:

1. Executar `npm run sync` e `npm run validate` (se aplicável)
2. Fazer **commit** das mudanças relevantes
3. Fazer **push** para `origin main` (deploy Netlify automático)

Não encerrar a tarefa sem commit + push, salvo se o usuário pedir explicitamente para não enviar.
