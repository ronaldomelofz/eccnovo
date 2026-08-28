import type { Encontro } from './encontros'
import { ORDEM_CASAIS } from './casais'
import { sortEncontrosAsc } from './ordenar'

export interface StatusCasalRodada {
  ordem: number
  casal: string
  jaFoiAnfitriao: boolean
  dataUltimoEncontro: string | null
  descricaoUltimoEncontro: string | null
}

export interface RodadaAtual {
  encontrosNaRodada: Encontro[]
  statusCasais: StatusCasalRodada[]
  pendentes: StatusCasalRodada[]
  completos: number
  totalCasais: number
  proximosNaOrdem: StatusCasalRodada[]
  numeroInicioCiclo: number
  numeroFimCiclo: number
  temario: number | null
}

function parseNumeroEncontro(descricao: string): number | null {
  const match = descricao.match(/^(\d+)º ENCONTRO/)
  return match ? Number.parseInt(match[1], 10) : null
}

function parseTemario(descricao: string): number | null {
  const match = descricao.match(/(\d+)º TEMÁRIO/)
  return match ? Number.parseInt(match[1], 10) : null
}

/** Rodada atual = bloco de 10 encontros (1–10, 11–20, 21–30…) do temário vigente */
export function calcularRodadaAtual(encontros: Encontro[]): RodadaAtual {
  const sorted = sortEncontrosAsc(encontros)
  const comDescricao = sorted.filter(
    (e) => parseNumeroEncontro(e.descricao) !== null && parseTemario(e.descricao) !== null
  )

  if (comDescricao.length === 0) {
    return {
      encontrosNaRodada: [],
      statusCasais: ORDEM_CASAIS.map((casal, index) => ({
        ordem: index + 1,
        casal,
        jaFoiAnfitriao: false,
        dataUltimoEncontro: null,
        descricaoUltimoEncontro: null,
      })),
      pendentes: [],
      completos: 0,
      totalCasais: ORDEM_CASAIS.length,
      proximosNaOrdem: [],
      numeroInicioCiclo: 1,
      numeroFimCiclo: 10,
      temario: null,
    }
  }

  const ultimo = comDescricao[comDescricao.length - 1]
  const ultimoNumero = parseNumeroEncontro(ultimo.descricao)!
  const temarioAtual = parseTemario(ultimo.descricao)!

  const numeroInicioCiclo = Math.floor((ultimoNumero - 1) / 10) * 10 + 1
  const numeroFimCiclo = numeroInicioCiclo + 9

  const encontrosNaRodada = comDescricao.filter((e) => {
    const numero = parseNumeroEncontro(e.descricao)!
    const temario = parseTemario(e.descricao)!
    return temario === temarioAtual && numero >= numeroInicioCiclo && numero <= numeroFimCiclo
  })

  const anfitrioesRodada = new Set(encontrosNaRodada.map((e) => e.anfitriao))

  const statusCasais: StatusCasalRodada[] = ORDEM_CASAIS.map((casal, index) => {
    const encontrosDoCasal = encontrosNaRodada.filter((e) => e.anfitriao === casal)
    const ultimoEncontro = encontrosDoCasal[encontrosDoCasal.length - 1]
    return {
      ordem: index + 1,
      casal,
      jaFoiAnfitriao: anfitrioesRodada.has(casal),
      dataUltimoEncontro: ultimoEncontro
        ? `${ultimoEncontro.dia} de ${ultimoEncontro.mes} de ${ultimoEncontro.ano}`
        : null,
      descricaoUltimoEncontro: ultimoEncontro?.descricao ?? null,
    }
  })

  const pendentes = statusCasais.filter((c) => !c.jaFoiAnfitriao)

  return {
    encontrosNaRodada,
    statusCasais,
    pendentes,
    completos: statusCasais.filter((c) => c.jaFoiAnfitriao).length,
    totalCasais: ORDEM_CASAIS.length,
    proximosNaOrdem: pendentes,
    numeroInicioCiclo,
    numeroFimCiclo,
    temario: temarioAtual,
  }
}
