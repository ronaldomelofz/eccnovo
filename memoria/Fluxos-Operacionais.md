# Fluxos Operacionais

## 1. Primeiro uso

1. Abrir o Gestor (`npm run gestor`)
2. Criar grupo (nome + período)
3. Cadastrar casais na ordem do rodízio
4. Ir para aba Encontros e registrar o 1º encontro

## 2. Registrar encontro

Campos obrigatórios:

- Data
- Casal anfitrião (lista dos casais do grupo)
- Número de ordem (sugerido = último + 1)
- Temário
- Número do encontro no temário (sugerido)
- Foto (anexo) ou marcar “sem foto”

Ao salvar: se a rodada completar (todos os casais já anfitriões), exibir **próximo encontro sugerido**.

## 3. Aba Ordem dos Encontros

- Lista dos casais na ordem oficial
- Marca quem já foi / quem falta na rodada atual
- Destaca o próximo na fila
- Mostra encontros da rodada atual

## 4. Após fechar uma rodada

Quando o último casal pendente é registrado como anfitrião:

1. Sistema marca rodada completa
2. Sugere próximo: próximo casal na ordem (reinicia do 1º se quiser ciclo fixo), ordem+1, número no temário+1 (ou 1º do próximo bloco)

Regra adotada: **reinicia a ordem do 1º casal** no início de cada nova rodada de N encontros, mas na prática o coordenador escolhe o anfitrião; a sugestão aponta o **primeiro da lista oficial que ainda não hospedou nesta rodada**, e se todos hospedaram, sugere o **1º da ordem** para a nova rodada.
