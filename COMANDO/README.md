# Comando ECC — Site Alimento do Amor

Backend local (Express) para cadastrar encontros e publicar no Netlify.

## Subir o painel

Na **raiz do SITEECC**:

```bash
npm run comando
```

Abra http://localhost:3848

Atalho Windows (sobe o servidor e abre o navegador): `COMANDO/Iniciar-Comando-Site.bat`

Variável opcional: `ECC_SITE_ROOT` aponta para a raiz do projeto se não for o pai de `COMANDO/`.

## Fluxo

1. **Salvar** — grava linha em `AGENDA ENCONTROS.xlsx` e, se enviar arquivo, copia para `FOTOS/` com nome padrão do site.
2. **Publicar no site** — sync, validate, `git add` em `app/data/encontros.ts` e `public/FOTOS/`, commit e push em `main` (planilha e `FOTOS/` ficam locais, no `.gitignore`).

Fontes oficiais: planilha + `FOTOS/` na raiz. Não edite `app/data/encontros.ts` nem `public/FOTOS/` à mão.

Site: https://eccalimentodoamor.netlify.app

## API

| Método | Rota | Uso |
|--------|------|-----|
| GET | `/api/status` | Totais e próximo nº sugerido |
| GET | `/api/casais` | Lista de casais |
| GET | `/api/encontros` | Planilha parseada |
| GET | `/api/encontros/:num` | Um encontro |
| POST | `/api/encontros/salvar` | multipart: campos + `foto` |
| DELETE | `/api/encontros/:num` | Remove da planilha; `?apagarFoto=0` mantém FOTOS/ |
| POST | `/api/deploy` | JSON `{ "mensagem": "..." }` opcional |

Se **Salvar** der erro de rede, confira se o servidor está ativo e **feche a planilha no Excel** (arquivo bloqueado).

Porta padrão: **3848** (`COMANDO_PORT`).
