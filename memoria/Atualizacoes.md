# Atualizações do Gestor

## Pasta oficial

`E:\PROJETOS-CURSOR\SITEECC\EXECUTAVEL\ATUALIZACOES`

## Gerar pacote

```bash
npm run gestor:dist:win
npm run gestor:pack-update
```

Cria `ECC-Gestor-Setup-{versão}.exe` + `latest.json` na pasta acima.

## Receber no app

Aba **Atualizações** → Verificar → **Receber atualização** (abre o instalador).

API: `GET /api/atualizacoes/status` · `POST /api/atualizacoes/receber` · `GET /api/atualizacoes/abrir-pasta`
