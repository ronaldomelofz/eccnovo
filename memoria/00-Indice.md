# Memória do projeto — ECC Gestor

Pasta no estilo **Obsidian**: notas em Markdown que documentam decisões, modelo de dados e fluxos.

> Coordenadores de grupos ECC usam o **Gestor Local** para organizar encontros e gerar o site de acompanhamento.

## Índice

| Nota | Conteúdo |
|------|----------|
| [[Visao-do-Produto]] | Objetivo, usuários, escopo |
| [[Modelo-de-Dados]] | Grupo, casais, encontros, rodada |
| [[Fluxos-Operacionais]] | Como o coordenador usa o sistema |
| [[Decisoes-Tecnicas]] | Stack, pastas, por que local |
| [[Publicacao-Netlify-Desktop]] | App instalável Win/Mac, logo, Netlify |
| [[Atualizacoes]] | Pacotes em EXECUTAVEL/ATUALIZACOES |
| [[Mapa-do-Codigo]] | Onde está cada peça |

## Relação com o site público

O site **ECC Alimento do Amor** (`app/`, Netlify) é o **produto gerado** para um grupo específico.

O **Gestor** (`gestor/`) é a **ferramenta local** universal: cada coordenador configura o próprio grupo, cadastra encontros e acompanha o rodízio de anfitriões.

## Como usar esta pasta

1. Abra `memoria/` no Obsidian (ou qualquer editor Markdown)
2. Atualize as notas quando mudar regra de negócio
3. O agente de IA deve ler estas notas antes de alterar o gestor
