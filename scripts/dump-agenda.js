const XLSX = require('xlsx')

const agendaPath = 'E:/PROJETOS-CURSOR/SITEECC/AGENDA ENCONTROS.xlsx'

function normalize(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

const workbook = XLSX.readFile(agendaPath)
const out = []
for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r].map(normalize)
    const joined = row.join(' | ')
    if (/2025/.test(joined) || /\bSet/i.test(joined) || /Setembro/i.test(joined) || /09\b/.test(joined) || /03\b/.test(joined) || /ENCONTRO/i.test(joined)) {
      out.push({ sheet: sheetName, row: r + 1, values: row })
    }
  }
}

console.log(JSON.stringify(out, null, 2))





