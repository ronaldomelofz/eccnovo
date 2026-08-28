const fs = require('fs')
const { FOTOS_DIR, ENCONTROS_TS, FOTOS_WEB_PREFIX } = require('./fontes')
const { parseAgendaExcel } = require('./lib/agenda')
const { sortEncontrosAsc } = require('./lib/ordenar')

function findPhotoFile(num, fotosDir) {
  if (!fs.existsSync(fotosDir)) return null
  const prefix = `ENCONTRO-${String(num).padStart(2, '0')}-`
  return (
    fs
      .readdirSync(fotosDir)
      .find((f) => f.toUpperCase().startsWith(prefix.toUpperCase())) || null
  )
}

function buildEncontroLine(item, fotosDir) {
  const parts = [
    `ano: ${item.ano}`,
    `mes: "${item.mes}"`,
    `dia: "${item.dia}"`,
    `anfitriao: "${item.anfitriao}"`,
  ]

  const semFoto = item.fotoStatus === 'SEM FOTO'
  const photoFile = !semFoto ? findPhotoFile(item.num, fotosDir) : null

  if (semFoto || !photoFile) {
    if (!semFoto && item.fotoStatus === 'FOTO') {
      console.warn(`⚠ Encontro ${item.num}: planilha indica FOTO, mas arquivo não encontrado em FOTOS/`)
    }
    if (semFoto) {
      parts.push('semFoto: true')
    }
  } else {
    parts.push(`foto: "${FOTOS_WEB_PREFIX}/${photoFile}"`)
  }

  parts.push(`descricao: "${item.descricao}"`)
  return `  { ${parts.join(', ')} },`
}

function generateEncontrosTs(items, fotosDir) {
  const lines = []
  let lastAno = null

  for (const item of items) {
    if (item.ano !== lastAno) {
      lines.push(`  // ${item.ano}`)
      lastAno = item.ano
    }
    lines.push(buildEncontroLine(item, fotosDir))
  }

  return `// GERADO AUTOMATICAMENTE — NÃO EDITAR MANUALMENTE
// Fontes: FOTOS/ + AGENDA ENCONTROS.xlsx (raiz do projeto)
// Atualizar: npm run sync

export interface Encontro {
  ano: number;
  mes: string;
  dia: string;
  anfitriao: string;
  foto?: string;
  semFoto?: boolean;
  descricao: string;
}

export const encontros: Encontro[] = [
${lines.join('\n')}
];
`
}

function syncEncontros() {
  const items = parseAgendaExcel()

  if (!items) {
    console.log('Planilha AGENDA ENCONTROS.xlsx não encontrada — encontros.ts mantido.')
    return false
  }

  const nums = items.map((i) => i.num)
  const duplicados = nums.filter((n, i) => nums.indexOf(n) !== i)
  if (duplicados.length) {
    console.warn(
      `⚠ Números duplicados na planilha: ${[...new Set(duplicados)].join(', ')} — fotos podem ficar incorretas.`
    )
  }

  const content = generateEncontrosTs(sortEncontrosAsc(items), FOTOS_DIR)
  fs.writeFileSync(ENCONTROS_TS, content, 'utf8')
  console.log(`✓ encontros.ts gerado com ${items.length} encontros (fonte: planilha + FOTOS/)`)
  return true
}

if (require.main === module) {
  syncEncontros()
}

module.exports = { syncEncontros }
