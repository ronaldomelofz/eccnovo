const XLSX = require('xlsx')

const agendaPath = 'E:/PROJETOS-CURSOR/SITEECC/AGENDA ENCONTROS.xlsx'

function normalize(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function findEncontro33() {
  const workbook = XLSX.readFile(agendaPath)
  const targets = [
    /\b03[\/.\-]09[\/.\-]2025\b/i,
    /03\s*de\s*setembro\s*de\s*2025/i,
    /encontro\s*-?\s*33/i,
  ]

  const hits = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r].map(normalize)
      const joined = row.join(' | ')
      if (targets.some((re) => re.test(joined))) {
        hits.push({ sheet: sheetName, row: r + 1, values: row })
      }
    }
  }
  return hits
}

const results = findEncontro33()
console.log(JSON.stringify(results, null, 2))





