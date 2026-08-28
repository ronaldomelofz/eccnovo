const MESES_ORDEM = {
  Janeiro: 1,
  Fevereiro: 2,
  Março: 3,
  Abril: 4,
  Maio: 5,
  Junho: 6,
  Julho: 7,
  Agosto: 8,
  Setembro: 9,
  Outubro: 10,
  Novembro: 11,
  Dezembro: 12,
}

function sortEncontrosDesc(items) {
  return [...items].sort((a, b) => {
    if (a.ano !== b.ano) return b.ano - a.ano
    const mesA = MESES_ORDEM[a.mes] ?? 0
    const mesB = MESES_ORDEM[b.mes] ?? 0
    if (mesA !== mesB) return mesB - mesA
    return parseInt(b.dia, 10) - parseInt(a.dia, 10)
  })
}

module.exports = { MESES_ORDEM, sortEncontrosDesc }
