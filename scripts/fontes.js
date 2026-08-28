/**
 * FONTES OFICIAIS DO PROJETO ECC
 * ==============================
 * Toda foto e todo dado de encontro vêm destas pastas/arquivos na raiz do projeto.
 * Não altere public/FOTOS/ ou app/data/encontros.ts manualmente — use `npm run sync`.
 */
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..')

/** Pasta onde o usuário coloca novas fotos (fonte única) */
const FOTOS_DIR = path.join(PROJECT_ROOT, 'FOTOS')

/** Planilha oficial com listagem dos encontros */
const AGENDA_XLSX = path.join(PROJECT_ROOT, 'AGENDA ENCONTROS.xlsx')

/** Destino das fotos no site (gerado por sync-fotos.js) */
const PUBLIC_FOTOS_DIR = path.join(PROJECT_ROOT, 'public', 'FOTOS')

/** Arquivo de dados do site (gerado por sync-encontros.js) */
const ENCONTROS_TS = path.join(PROJECT_ROOT, 'app', 'data', 'encontros.ts')

/** Caminho web das fotos no site */
const FOTOS_WEB_PREFIX = '/FOTOS'

module.exports = {
  PROJECT_ROOT,
  FOTOS_DIR,
  AGENDA_XLSX,
  PUBLIC_FOTOS_DIR,
  ENCONTROS_TS,
  FOTOS_WEB_PREFIX,
}
