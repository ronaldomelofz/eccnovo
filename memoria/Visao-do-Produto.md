# Visão do Produto

## Problema

Cada grupo ECC precisa organizar encontros em casas de casais, com rodízio de anfitriões, fotos e numeração por temário. Hoje isso é feito de forma artesanal (planilha + pastas de fotos).

## Solução

Aplicação **local** (roda no computador do coordenador) para:

1. Cadastrar o **grupo** (nome, período, casais)
2. Registrar **encontros** (foto, anfitrião, data, ordem, temário)
3. Controlar a **ordem / rodada** (quem já recebeu, quem falta, próximo sugerido)
4. Produzir / alimentar o **site de acompanhamento** dos encontros

## Usuários

- Coordenadores de grupos ECC (vários grupos distintos)
- Cada instalação local gerencia um ou mais grupos no próprio PC

## Princípios

- Dados ficam no computador (pasta `gestor/dados/`)
- Opções universais: nome do grupo, período, lista de casais
- Após completar uma rodada (todos os casais anfitriões), o sistema sugere o próximo encontro
- Reaproveitar a lógica já validada no site Alimento do Amor (rodada, ordenação, UI)
