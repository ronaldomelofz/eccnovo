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
  const n = Number(ultimo.numeroNoTemario) || sorted.length
  const temarioAtual = Number(ultimo.temario) || 1
  const numeroInicioCiclo = Math.floor((n - 1) / total) * total + 1
  const numeroFimCiclo = numeroInicioCiclo + total - 1

  const encontrosNaRodada = sorted.filter((e) => {
    const num = Number(e.numeroNoTemario)
    return Number(e.temario) === temarioAtual && num >= numeroInicioCiclo && num <= numeroFimCiclo
  })

  const anfitrioes = new Set(encontrosNaRodada.map((e) => e.anfitriao))

  const statusCasais = ordemCasais.map((c) => {
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
  const rodadaCompleta = ordemCasais.length > 0 && pendentes.length === 0

  return {
    encontrosNaRodada,
    statusCasais,
    pendentes,
    completos,
    totalCasais: ordemCasais.length,
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
