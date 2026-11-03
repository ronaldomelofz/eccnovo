/**
 * Rodada de anfitriões — ver memoria/Modelo-de-Dados.md e Fluxos-Operacionais.md
 */

function descricaoEncontro(e) {
  return `${e.numeroNoTemario}º ENCONTRO ${e.temario}º TEMÁRIO`
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
    const statusCasais = ordemCasais.map((c) => ({
      ordem: c.ordem,
      casal: c.nome,
      jaFoiAnfitriao: false,
      dataUltimoEncontro: null,
      descricaoUltimoEncontro: null,
    }))
    return {
      encontrosNaRodada: [],
      statusCasais,
      pendentes: statusCasais,
      completos: 0,
      totalCasais: ordemCasais.length,
      proximosNaOrdem: statusCasais,
      numeroInicioCiclo: 1,
      numeroFimCiclo: total,
      temario: null,
      rodadaCompleta: false,
    }
  }

  const ultimo = sorted[sorted.length - 1]
  const temarioAtual = Number(ultimo.temario) || 1
  const formacao = total === 10 ? 9 : 0
  const n = Number(ultimo.ordem) || sorted.length
  let numeroInicioCiclo
  let numeroFimCiclo
  let nomeRodada
  let participantes
  if (formacao && n <= formacao) {
    numeroInicioCiclo = 1
    numeroFimCiclo = formacao
    nomeRodada = 'Formação inicial'
    participantes = ordemCasais.slice(0, formacao)
  } else {
    const base = formacao ? formacao + 1 : 1
    const atual = Math.max(n, base)
    numeroInicioCiclo = base + Math.floor((atual - base) / total) * total
    numeroFimCiclo = numeroInicioCiclo + total - 1
    const indice = Math.floor((numeroInicioCiclo - base) / total) + 1
    nomeRodada = `${indice}ª rodada`
    participantes = ordemCasais
  }

  const encontrosNaRodada = sorted.filter((e) => {
    const num = Number(e.ordem)
    return num >= numeroInicioCiclo && num <= numeroFimCiclo
  })

  const anfitrioes = new Set(encontrosNaRodada.map((e) => e.anfitriao))

  const statusCasais = participantes.map((c) => {
    const doCasal = encontrosNaRodada.filter((e) => e.anfitriao === c.nome)
    const last = doCasal[doCasal.length - 1]
    return {
      ordem: c.ordem,
      casal: c.nome,
      jaFoiAnfitriao: anfitrioes.has(c.nome),
      dataUltimoEncontro: last ? last.data : null,
      descricaoUltimoEncontro: last ? descricaoEncontro(last) : null,
    }
  })

  const pendentes = statusCasais.filter((c) => !c.jaFoiAnfitriao)
  const completos = statusCasais.filter((c) => c.jaFoiAnfitriao).length
  const rodadaCompleta = participantes.length > 0 && encontrosNaRodada.length > 0 && pendentes.length === 0

  return {
    nomeRodada,
    encontrosNaRodada,
    statusCasais,
    pendentes,
    completos,
    totalCasais: participantes.length,
    proximosNaOrdem: pendentes,
    numeroInicioCiclo,
    numeroFimCiclo,
    temario: temarioAtual,
    rodadaCompleta,
  }
}

/**
 * Sugere o próximo encontro após o estado atual (ou após incluir um encontro hipotético).
 */
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
  } else if (rodada.pendentes.length > 0) {
    anfitriaoSugerido = rodada.pendentes[0].casal
    temario = rodada.temario || ultimo.temario
    numeroNoTemario = Number(ultimo.numeroNoTemario) + 1
    mensagem = `Ainda faltam ${rodada.pendentes.length} casal(is) nesta rodada. Próximo na ordem: ${anfitriaoSugerido}.`
  } else {
    // Rodada completa → inicia nova
    anfitriaoSugerido = ordemCasais[0].nome
    temario = Number(ultimo.temario)
    numeroNoTemario = Number(ultimo.numeroNoTemario) + 1
    mensagem = `Rodada completa! Nova rodada sugerida com ${anfitriaoSugerido} (1º da ordem).`
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
}
