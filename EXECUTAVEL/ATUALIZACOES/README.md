# Pacotes de atualização — ECC Gestor

## Arquivos

| Arquivo | Uso |
|---------|-----|
| `ECC-Gestor-Setup-X.Y.Z.exe` | Instalador (mensagem: sistema em atualização) |
| `ECC-Gestor-Update-X.Y.Z.eccupdate` | **Duplo clique** abre o app e inicia a atualização |

## Duas formas de atualizar

1. No app → aba **Atualizações** → **Localizar arquivo** → **Atualizar**
2. Duplo clique no arquivo `.eccupdate`

## Gerar pacotes

```bash
npm run gestor:dist:win
npm run gestor:pack-update
```
