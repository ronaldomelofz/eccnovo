const fs = require('fs')
const { AGENDA_XLSX, ENCONTROS_TS } = require('./fontes')
const { parseAgendaExcel } = require('./lib/agenda')

if (!fs.existsSync(AGENDA_XLSX)) {
  console.log(JSON.stringify({
    skipped: true,
    reason: 'AGENDA ENCONTROS.xlsx não encontrada — validação ignorada (CI/deploy).',
  }))
  process.exit(0)
}

function parseEncontrosTs() {
  const content = fs.readFileSync(ENCONTROS_TS, 'utf8')
  const blocks = [...content.matchAll(/\{[^}]+\}/g)].map((m) => m[0])
  return blocks
    .filter((b) => b.includes('ano:'))
    .map((b) => {
      const get = (key) => {
        const m = b.match(new RegExp(`${key}:\\s*"([^"]+)"`))
        return m ? m[1] : undefined
      }
      const getNum = (key) => {
        const m = b.match(new RegExp(`${key}:\\s*(\\d+)`))
        return m ? Number(m[1]) : undefined
      }
      return {
        ano: getNum('ano'),
        mes: get('mes'),
        dia: get('dia'),
        anfitriao: get('anfitriao'),
        descricao: get('descricao'),
        semFoto: /semFoto:\s*true/.test(b),
        foto: get('foto'),
      }
    })
}

const excel = parseAgendaExcel()
const site = parseEncontrosTs()
const mismatches = []

for (const e of excel) {
  const match = site.find(
    (s) => s.ano === e.ano && s.mes === e.mes && s.dia === e.dia
  )
  if (!match) {
    mismatches.push({ num: e.num, issue: 'nao encontrado no site', excel: e })
    continue
  }
  if (match.anfitriao !== e.anfitriao) {
    mismatches.push({
      num: e.num,
      issue: 'anfitriao diferente',
      excel: e.anfitriao,
      site: match.anfitriao,
    })
  }
  if (e.fotoStatus === 'SEM FOTO' && !match.semFoto) {
    mismatches.push({ num: e.num, issue: 'deveria estar sem foto' })
  }
  if (e.fotoStatus === 'FOTO' && match.semFoto) {
    mismatches.push({ num: e.num, issue: 'nao deveria estar sem foto' })
  }
}

console.log(JSON.stringify({ excelTotal: excel.length, siteTotal: site.length, mismatches }, null, 2))
process.exit(mismatches.length ? 1 : 0)
