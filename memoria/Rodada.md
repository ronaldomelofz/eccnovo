---
tags: [regra]
atualizado: 2026-10-31
---

# Rodada

A rodada segue o número global da planilha, não o número escrito no temário.

- Encontros 1–9: formação inicial (9 casais; Mauro e Daliane entram no 10º).
- Depois, blocos de 10: 10–19, 20–29, 30–39, 40–49…

A 4ª rodada (40–49) está em andamento. Ainda faltam Ronald e Sara, Marcio e Fernanda e Mauro e Daliane.

## Enquanto a rodada está aberta

Lista marca quem já foi (✓) e quem falta (!). O próximo sugerido é o primeiro pendente na ordem oficial.

## Quando a rodada fecha

Não deixar a tela em “10 de 10 / Rodada completa” com todos verdes.

Mostrar:

1. No topo: **Nova rodada iniciada**
2. A nova sequência: todos os casais **aptos** para o próximo encontro
3. O **1º da ordem** em destaque como próximo encontro

Vale no Gestor (aba Ordem), no HTML gerado pelo Gestor e no site `app/page.tsx`.

Código: `gestor/lib/rodada.js` (`rodadaCompleta`), `gestor/public/app.js`, `gestor/lib/site-generator.js`, `app/page.tsx`.

O site da planilha só muda com `npm run sync` + push. O site publicado pelo Gestor só muda ao clicar **Publicar** de novo.
