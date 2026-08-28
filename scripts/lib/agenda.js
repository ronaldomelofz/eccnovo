const XLSX = require('xlsx')
const fs = require('fs')
const { AGENDA_XLSX } = require('../fontes')

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

function parseAgendaExcel(agendaPath = AGENDA_XLSX) {
  if (!fs.existsSync(agendaPath)) {
    return null
  }

  const wb = XLSX.readFile(agendaPath)
  const sheet = wb.Sheets.Plan1 || wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

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
      ano: Number(num) >= 37 ? 2026 : ano,
      mes,
      dia: String(row[2]).padStart(2, '0'),
      anfitriao: String(row[3]).trim(),
      descricao: String(row[4]).trim(),
      fotoStatus: String(row[6] || '').trim().toUpperCase(),
    })
  }

  return items
}

module.exports = { MESES, parseAgendaExcel }
