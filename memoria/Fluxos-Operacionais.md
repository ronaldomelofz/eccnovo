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
- Quando a rodada fecha, o site e o gestor mostram **nova rodada iniciada** e a lista dos casais aptos para o próximo encontro (a partir do 1º da ordem)

## 4. Após fechar uma rodada

Quando o último casal pendente é registrado como anfitrião:

1. Sistema marca rodada completa
2. O site publicado avisa no topo: **Nova rodada iniciada**
3. A aba Ordem dos Casais abre na nova sequência: todos os casais aptos, o 1º destacado como próximo encontro
4. Sugere próximo: 1º casal da ordem oficial

Regra adotada: **reinicia a ordem do 1º casal** no início de cada nova rodada. O coordenador ainda escolhe o anfitrião ao cadastrar; a sugestão aponta o **primeiro da lista oficial que ainda não hospedou nesta rodada**, e se todos hospedaram, sugere o **1º da ordem** para a nova rodada.
