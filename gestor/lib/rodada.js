/**
 * Rodada de anfitriões.
 * Formação 1–9 quando há 10 casais; depois blocos de 10 pelo número global (ordem).
 * Não usa o número do temário para fechar a rodada.
 */

function descricaoEncontro(e) {
  return `${e.numeroNoTemario}º ENCONTRO ${e.temario}º TEMÁRIO`
}

function normNome(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function faixaRodada(numero, total) {
  const formacao = total === 10 ? 9 : 0
  if (formacao && numero <= formacao) {
    return { inicio: 1, fim: formacao, nome: 'Formação inicial', tamanho: formacao }
  }
  const base = formacao ? formacao + 1 : 1
  const n = Math.max(numero, base)
  const inicio = base + Math.floor((n - base) / total) * total
  const indice = Math.floor((inicio - base) / total) + 1
  return { inicio, fim: inicio + total - 1, nome: `${indice}ª rodada`, tamanho: total }
}

function avaliar(faixa, ordemCasais, sorted) {
  const participantes = ordemCasais.slice(0, faixa.tamanho)
  const oficiais = new Set(participantes.map((c) => normNome(c.nome)))
  const encontrosNaRodada = sorted.filter((e) => {
    const num = Number(e.ordem)
    return num >= faixa.inicio && num <= faixa.fim
  })

  const contagem = new Map()
  for (const encontro of encontrosNaRodada) {
    const chave = normNome(encontro.anfitriao)
    const atual = contagem.get(chave)
    if (atual) atual.quantidade += 1
    else contagem.set(chave, { casal: encontro.anfitriao, quantidade: 1 })
  }

  const repetidos = [...contagem.values()].filter((item) => item.quantidade > 1)
  const foraDaOrdem = [...contagem.values()]
    .map((item) => item.casal)
    .filter((casal) => !oficiais.has(normNome(casal)))

  const statusCasais = participantes.map((c) => {
    const doCasal = encontrosNaRodada.filter((e) => normNome(e.anfitriao) === normNome(c.nome))
    const last = doCasal[doCasal.length - 1]
    return {
      ordem: c.ordem,
      casal: c.nome,
      jaFoiAnfitriao: doCasal.length > 0,
      dataUltimoEncontro: last ? last.data : null,
      descricaoUltimoEncontro: last ? descricaoEncontro(last) : null,
      numeroEncontro: last ? Number(last.ordem) : null,
    }
  })

  const pendentes = statusCasais.filter((c) => !c.jaFoiAnfitriao)
  return { participantes, encontrosNaRodada, repetidos, foraDaOrdem, statusCasais, pendentes }
}

/**
 * @param {Array<{nome:string,ordem:number}>} casais
 * @param {Array} encontros
 */
function calcularRodada(casais, encontros) {
  const ordemCasais = [...casais].sort((a, b) => a.ordem - b.ordem)
  const total = ordemCasais.length || 1
  const sorted = [...encontros].sort(
    (a, b) => a.ordem - b.ordem || String(a.data).localeCompare(String(b.data))
  )

  if (sorted.length === 0) {
    const faixa = faixaRodada(1, total)
    const statusCasais = ordemCasais.slice(0, faixa.tamanho).map((c) => ({
      ordem: c.ordem,
      casal: c.nome,
      jaFoiAnfitriao: false,
      dataUltimoEncontro: null,
      descricaoUltimoEncontro: null,
      numeroEncontro: null,
    }))
    return {
      nomeRodada: faixa.nome,
      encontrosNaRodada: [],
      statusCasais,
      pendentes: statusCasais,
      repetidos: [],
      foraDaOrdem: [],
      completos: 0,
      totalCasais: statusCasais.length,
      proximosNaOrdem: statusCasais,
      numeroInicioCiclo: faixa.inicio,
      numeroFimCiclo: faixa.fim,
      temario: null,
      novaRodada: false,
      rodadaCompleta: false,
    }
  }

  const ultimo = sorted[sorted.length - 1]
  const temarioAtual = Number(ultimo.temario) || 1
  const n = Number(ultimo.ordem) || sorted.length
  let faixa = faixaRodada(n, total)
  let avaliacao = avaliar(faixa, ordemCasais, sorted)
  let novaRodada = false

  if (avaliacao.pendentes.length === 0 && avaliacao.encontrosNaRodada.length > 0) {
    faixa = faixaRodada(faixa.fim + 1, total)
    avaliacao = avaliar(faixa, ordemCasais, sorted)
    novaRodada = true
  }

  return {
    nomeRodada: faixa.nome,
    encontrosNaRodada: avaliacao.encontrosNaRodada,
    statusCasais: avaliacao.statusCasais,
    pendentes: avaliacao.pendentes,
    repetidos: avaliacao.repetidos,
    foraDaOrdem: avaliacao.foraDaOrdem,
    completos: avaliacao.statusCasais.filter((c) => c.jaFoiAnfitriao).length,
    totalCasais: avaliacao.participantes.length,
    proximosNaOrdem: avaliacao.pendentes,
    numeroInicioCiclo: faixa.inicio,
    numeroFimCiclo: faixa.fim,
    temario: temarioAtual,
    novaRodada,
    rodadaCompleta: novaRodada,
  }
}

function sugerirProximo(casais, encontros) {
  const ordemCasais = [...casais].sort((a, b) => a.ordem - b.ordem)
  const sorted = [...encontros].sort((a, b) => a.ordem - b.ordem)
  const rodada = calcularRodada(casais, encontros)

  const ultimaOrdem = sorted.length ? Math.max(...sorted.map((e) => Number(e.ordem) || 0)) : 0
  const ultimo = sorted[sorted.length - 1]

  let anfitriaoSugerido
  let temario
  let numeroNoTemario
  let mensagem

  if (ordemCasais.length === 0) {
    return {
      ordem: ultimaOrdem + 1,
      anfitriao: null,
      temario: 1,
      numeroNoTemario: 1,
      mensagem: 'Cadastre os casais do grupo antes de sugerir o próximo encontro.',
      rodadaCompleta: false,
      rodada,
    }
  }

  if (!ultimo) {
    anfitriaoSugerido = ordemCasais[0].nome
    temario = 1
    numeroNoTemario = 1
    mensagem = 'Primeiro encontro do grupo — sugestão: 1º casal da ordem.'
  } else if (rodada.novaRodada) {
    anfitriaoSugerido = ordemCasais[0].nome
    temario = Number(ultimo.temario) || 1
    numeroNoTemario = Number(ultimo.numeroNoTemario) + 1
    mensagem = `Nova rodada iniciada. Próximo na ordem: ${anfitriaoSugerido}.`
  } else if (rodada.pendentes.length > 0) {
    anfitriaoSugerido = rodada.pendentes[0].casal
    temario = rodada.temario || ultimo.temario
    numeroNoTemario = Number(ultimo.numeroNoTemario) + 1
    mensagem = `Ainda faltam ${rodada.pendentes.length} casal(is) nesta rodada. Próximo na ordem: ${anfitriaoSugerido}.`
  } else {
    anfitriaoSugerido = ordemCasais[0].nome
    temario = Number(ultimo.temario) || 1
    numeroNoTemario = Number(ultimo.numeroNoTemario) + 1
    mensagem = `Rodada completa. Nova rodada sugerida com ${anfitriaoSugerido}.`
  }

  return {
    ordem: ultimaOrdem + 1,
    anfitriao: anfitriaoSugerido,
    temario,
    numeroNoTemario,
    dataSugerida: null,
    mensagem,
    rodadaCompleta: rodada.rodadaCompleta,
    rodada,
  }
}

module.exports = {
  calcularRodada,
  sugerirProximo,
  descricaoEncontro,
  normNome,
}
