# Fontes oficiais — ECC Alimento do Amor

Coloque nesta pasta **todas as fotos e o áudio** dos encontros.

## Convenção de nomes

```
ENCONTRO-{número}-{dia}-{mês}-{ano}.jpeg
```

Exemplos:
- `ENCONTRO-36-20-12-2025.jpeg`
- `ENCONTRO-37-31-01-2026.jpeg`

Também nesta pasta:
- `logo.jpeg` — logo do ECC
- `Algo Em Comum.mp3` — música do site

## Planilha

Os dados dos encontros (data, anfitrião, descrição) vêm de:

```
AGENDA ENCONTROS.xlsx   (na raiz do projeto, ao lado desta pasta)
```

## Sincronizar

Após adicionar fotos ou atualizar a planilha:

```bash
npm run sync
```

Isso copia as fotos para `public/FOTOS/` e gera `app/data/encontros.ts` automaticamente.
