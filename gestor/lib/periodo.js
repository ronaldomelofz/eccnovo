/**
 * Período de realização do encontro (cabeçalho do site)
 * Ex.: 57º / 2023 - 28, 29 e 30 de Abril de 2023
 */

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function formatPeriodoCabecalho(periodo) {
  if (!periodo) return ''
  if (periodo.textoManual && String(periodo.textoManual).trim()) {
    return String(periodo.textoManual).trim()
  }
  const num = periodo.numero
  const ano = periodo.ano
  const dias = String(periodo.dias || '').trim()
  const mes = String(periodo.mes || '').trim()
  if (!num || !ano || !dias || !mes) return ''
  return `${num}º / ${ano} - ${dias} de ${mes} de ${ano}`
}

function periodoFromForm(body = {}) {
  const periodo = {
    numero: body.periodoNumero ? Number(body.periodoNumero) : null,
    ano: body.periodoAno ? Number(body.periodoAno) : null,
    dias: body.periodoDias ? String(body.periodoDias).trim() : '',
    mes: body.periodoMes ? String(body.periodoMes).trim() : '',
    textoManual: body.periodoTextoManual ? String(body.periodoTextoManual).trim() : '',
  }
  const texto = formatPeriodoCabecalho(periodo)
  return {
    ...periodo,
    texto,
    // compat: início aproximado (primeiro dia numérico + mês)
    periodoInicio: inferIso(periodo),
    periodoFim: null,
  }
}

function inferIso(periodo) {
  if (!periodo?.ano || !periodo?.mes || !periodo?.dias) return null
  const mesIdx = MESES.findIndex((m) => m.toLowerCase() === periodo.mes.toLowerCase())
  if (mesIdx < 0) return null
  const diaMatch = String(periodo.dias).match(/(\d+)/)
  if (!diaMatch) return null
  const d = String(diaMatch[1]).padStart(2, '0')
  const m = String(mesIdx + 1).padStart(2, '0')
  return `${periodo.ano}-${m}-${d}`
}

module.exports = {
  MESES,
  formatPeriodoCabecalho,
  periodoFromForm,
  inferIso,
}
