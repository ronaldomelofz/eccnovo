# Modelo de Dados

## Grupo

```json
{
  "id": "alimento-do-amor",
  "nome": "ECC Alimento do Amor",
  "periodoInicio": "2023-04-28",
  "periodoFim": null,
  "casais": [
    { "id": "c1", "nome": "ROBERVAL E IARA", "ordem": 1 },
    { "id": "c2", "nome": "JOÃO MAURICIO E FERNANDA", "ordem": 2 }
  ],
  "criadoEm": "ISO",
  "atualizadoEm": "ISO"
}
```

- `casais[].ordem` define a sequência oficial do rodízio
- Novo grupo começa com lista vazia; o coordenador cadastra os casais

## Encontro

```json
{
  "id": "uuid",
  "grupoId": "alimento-do-amor",
  "ordem": 44,
  "data": "2026-08-27",
  "anfitriao": "HUGO E YANE",
  "temario": 2,
  "numeroNoTemario": 28,
  "foto": "ENCONTRO-44-27-08-2026.jpeg",
  "semFoto": false
}
```

- `ordem` = número sequencial global do encontro no grupo (pela data, automático)
- `temario` + `numeroNoTemario` geram a descrição: `28º ENCONTRO 2º TEMÁRIO`
- `numeroNoTemario` é **informado pelo operador** (o sistema só sugere a sequência)
- Foto fica em `gestor/dados/{grupoId}/fotos/`

## Rodada

Uma **rodada** = bloco de N encontros onde N = quantidade de casais (ex.: 10).

- Ciclo 1–10, 11–20, 21–30… (pelo `numeroNoTemario` ou pela contagem de anfitriões únicos)
- **Pendentes**: casais da ordem oficial que ainda não foram anfitriões na rodada atual
- **Próximo sugerido**: primeiro pendente na ordem; se rodada completa, inicia nova rodada com o 1º casal (ou o próximo na sequência configurável)

## Arquivos no disco

```
gestor/dados/
  index.json                 # lista de grupos
  {grupoId}/
    grupo.json
    encontros.json
    fotos/
```
