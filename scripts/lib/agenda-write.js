const fs = require('fs')
const XLSX = require('xlsx')
const { AGENDA_XLSX } = require('../fontes')
const { parseAgendaExcel, MESES } = require('./agenda')

const MES_PARA_PLANILHA = {
  Janeiro: 'JANEIRO',
  Fevereiro: 'FEVEREIRO',
  Março: 'MARÇO',
  Abril: 'ABRIL',
  Maio: 'MAIO',
  Junho: 'JUNHO',
  Julho: 'JULHO',
  Agosto: 'AGOSTO',
  Setembro: 'SETEMBRO',
  Outubro: 'OUTUBRO',
  Novembro: 'NOVEMBRO',
  Dezembro: 'DEZEMBRO',
}

function mesPlanilha(mesTitulo) {
  return MES_PARA_PLANILHA[mesTitulo] || String(mesTitulo).toUpperCase()
}

function readSheet(agendaPath = AGENDA_XLSX) {
  const wb = XLSX.readFile(agendaPath)
  const sheetName = wb.SheetNames.includes('Plan1') ? 'Plan1' : wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  return { wb, sheetName, sheet, rows }
}

function writeSheet(agendaPath, wb, sheetName, rows) {
  const newSheet = XLSX.utils.aoa_to_sheet(rows)
  wb.Sheets[sheetName] = newSheet
  if (!wb.SheetNames.includes(sheetName)) wb.SheetNames.push(sheetName)
  XLSX.writeFile(wb, agendaPath)
}

/**
 * @param {object} item
 * @param {number} item.num
 * @param {string} item.mes - Janeiro…
 * @param {string} item.dia
 * @param {string} item.anfitriao
 * @param {string} item.descricao
 * @param {string} [item.observacao]
 * @param {string} [item.fotoStatus] - FOTO | SEM FOTO | ''
 */
function upsertEncontroPlanilha(item, agendaPath = AGENDA_XLSX) {
  if (!fs.existsSync(agendaPath)) {
    throw new Error('Planilha AGENDA ENCONTROS.xlsx não encontrada na raiz do projeto.')
  }

  const num = Number(item.num)
  if (!num || num < 1) throw new Error('Número do encontro inválido.')

  const { wb, sheetName, rows } = readSheet(agendaPath)
  let rowIndex = -1
  for (let i = 0; i < rows.length; i++) {
    if (Number(rows[i][0]) === num) {
      rowIndex = i
      break
    }
  }

  const fotoStatus = (item.fotoStatus || 'FOTO').toUpperCase()
  const row = [
    num,
    mesPlanilha(item.mes),
    Number.parseInt(String(item.dia), 10) || item.dia,
    String(item.anfitriao || '').trim(),
    String(item.descricao || '').trim(),
    String(item.observacao || '').replace(/\s+/g, ' ').trim(),
    fotoStatus === 'SEM FOTO' ? 'SEM FOTO' : fotoStatus === 'FOTO' ? 'FOTO' : '',
  ]

  if (rowIndex >= 0) {
    rows[rowIndex] = row
  } else {
    let insertAt = rows.length
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i][0] !== '' && !Number.isNaN(Number(rows[i][0]))) {
        insertAt = i + 1
        break
      }
    }
    rows.splice(insertAt, 0, row)
  }

  writeSheet(agendaPath, wb, sheetName, rows)
  return parseAgendaExcel(agendaPath).find((e) => e.num === num)
}

function nomeArquivoFoto(item) {
  const mesNum = String(
    {
      Janeiro: '01',
      Fevereiro: '02',
      Março: '03',
      Abril: '04',
      Maio: '05',
      Junho: '06',
      Julho: '07',
      Agosto: '08',
      Setembro: '09',
      Outubro: '10',
      Novembro: '11',
      Dezembro: '12',
    }[item.mes] || '01'
  )
  const dia = String(item.dia).padStart(2, '0')
  const ext = item.ext || 'jpeg'
  return `ENCONTRO-${String(item.num).padStart(2, '0')}-${dia}-${mesNum}-${item.ano}.${ext}`
}

module.exports = {
  upsertEncontroPlanilha,
  nomeArquivoFoto,
  mesPlanilha,
}
