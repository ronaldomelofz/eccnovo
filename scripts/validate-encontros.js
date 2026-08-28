const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

const agendaPath = path.join(__dirname, '..', 'AGENDA ENCONTROS.xlsx')
const encontrosPath = path.join(__dirname, '..', 'app', 'data', 'encontros.ts')

const MESES = {
  JANEIRO: 'Janeiro',
  FEVEREIRO: 'Fevereiro',
  'MARÇO': 'Março',
  MARCO: 'Março',
  ABRIL: 'Abril',
  MAIO: 'Maio',
  JUNHO: 'Junho',
  JULHO: 'Julho',
  AGOSTO: 'Agosto',
  SETEMBRO: 'Setembro',
  OUTUBRO: 'Outubro',
  NOVEMBRO: 'Novembro',
  DEZEMBRO: 'Dezembro',
}

function parseExcel() {
  const wb = XLSX.readFile(agendaPath)
  const rows = XLSX.utils.sheet_to_json(wb.Sheets.Plan1, { header: 1, defval: '' })
  let ano = 2023
  const items = []

  for (const row of rows) {
    if (row[1] === 2024 || row[1] === '2024') {
      ano = 2024
      continue
    }
    if (row[1] === 2025 || row[1] === '2025') {
      ano = 2025
    }
    const num = row[0]
    if (!num || Number.isNaN(Number(num))) continue

    const mesRaw = String(row[1]).toUpperCase()
    const mes = MESES[mesRaw]
    if (!mes) continue

    items.push({
      num: Number(num),
      ano: num >= 37 ? 2026 : ano,
      mes,
      dia: String(row[2]).padStart(2, '0'),
      anfitriao: String(row[3]).trim(),
      descricao: String(row[4]).trim(),
      fotoStatus: String(row[6] || '').trim().toUpperCase(),
    })
  }

  return items
}

function parseEncontrosTs() {
  const content = fs.readFileSync(encontrosPath, 'utf8')
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

const excel = parseExcel()
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
