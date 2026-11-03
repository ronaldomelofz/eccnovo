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
2. **Publicar no site** — `npm run sync`, `npm run validate`, commit e push em `main` (deploy automático Netlify).

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
| POST | `/api/deploy` | JSON `{ "mensagem": "..." }` opcional |

Porta padrão: **3848** (`COMANDO_PORT`).
