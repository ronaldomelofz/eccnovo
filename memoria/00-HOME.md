---
tags: [moc, home]
atualizado: 2026-10-31
---

# ECC — memória

Leia **só este arquivo**. Abra **uma** nota da tabela se a tarefa exigir detalhe. Não percorra o vault.

## Agora

- Gestor **0.5.4** — `EXECUTAVEL/ECC-Gestor-Setup-0.5.4.exe`
- Site planilha: https://eccalimentodoamor.netlify.app (push em `main`)
- Dados do .exe: pasta userData do Electron (`dados/`), **não** `gestor/dados/`
- Instalar por cima **não apaga** encontros já digitados no executável

## Se a tarefa for

| Tarefa | Nota |
|---|---|
| Rodada fechou / nova sequência | [[Rodada]] |
| Campos do encontro, ordem, nº no temário | [[Modelo-de-Dados]] |
| Publicar Netlify ou gerar .exe | [[Publicacao-Netlify-Desktop]] |
| Pacote .eccupdate | [[Atualizacoes]] |
| Importar site por URL | [[Importar-Site]] |
| Onde está o código | [[Mapa-do-Codigo]] |
| Passo a passo do coordenador | [[Fluxos-Operacionais]] |

## Regras fixas

- Fontes do site público: `FOTOS/` e `AGENDA ENCONTROS.xlsx`. Depois `npm run sync`. Não editar `public/FOTOS/` nem `app/data/encontros.ts` à mão.
- Nº no temário: o operador digita. O sistema só sugere.
- Rodada = N encontros (N = quantidade de casais) no mesmo temário, pelo número no temário.
- Rodada completa → aviso **Nova rodada iniciada** e lista dos casais aptos, 1º da ordem em destaque.
- Ao concluir alteração: commit + push em `main`, e novo .exe se o Gestor mudou.

## Sessões

[[Diario/2026-10-31-nova-rodada]]
