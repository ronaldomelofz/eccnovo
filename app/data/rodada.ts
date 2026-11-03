import type { Encontro } from './encontros'
import { ORDEM_CASAIS } from './casais'
import { sortEncontrosAsc } from './ordenar'

export interface StatusCasalRodada {
  ordem: number
  casal: string
  jaFoiAnfitriao: boolean
  dataUltimoEncontro: string | null
  descricaoUltimoEncontro: string | null
  numeroEncontro: number | null
}

export interface RepeticaoRodada {
  casal: string
  quantidade: number
}

export interface RodadaAtual {
  nomeRodada: string
  encontrosNaRodada: Encontro[]
  statusCasais: StatusCasalRodada[]
  pendentes: StatusCasalRodada[]
  repetidos: RepeticaoRodada[]
  foraDaOrdem: string[]
  completos: number
  totalCasais: number
  proximosNaOrdem: StatusCasalRodada[]
  numeroInicioCiclo: number
  numeroFimCiclo: number
  temario: number | null
  /** A rodada anterior fechou; a lista é a nova sequência, com todos aptos. */
  novaRodada: boolean
  rodadaCompleta: boolean
}

export function normNome(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

/**
 * Formação inicial: encontros 1–9 (9 casais; o 10º entra no encontro 10).
 * Depois, blocos de 10: 10–19, 20–29, 30–39, 40–49…
 * O número é o da planilha, não o escrito no temário.
 */
function faixaRodada(numero: number, totalCasais: number) {
  const formacao = totalCasais === 10 ? 9 : 0
  if (formacao && numero <= formacao) {
    return { inicio: 1, fim: formacao, nome: 'Formação inicial', tamanho: formacao }
  }
  const base = formacao ? formacao + 1 : 1
  const n = Math.max(numero, base)
  const inicio = base + Math.floor((n - base) / totalCasais) * totalCasais
  const indice = Math.floor((inicio - base) / totalCasais) + 1
  return { inicio, fim: inicio + totalCasais - 1, nome: `${indice}ª rodada`, tamanho: totalCasais }
}

function avaliar(
  faixa: { inicio: number; fim: number; nome: string; tamanho: number },
  numbered: Encontro[]
) {
  const participantes = ORDEM_CASAIS.slice(0, faixa.tamanho)
  const oficiais = new Set(participantes.map(normNome))
  const encontrosNaRodada = numbered.filter(
    (encontro) => encontro.numero >= faixa.inicio && encontro.numero <= faixa.fim
  )

  const contagem = new Map<string, { casal: string; quantidade: number }>()
  for (const encontro of encontrosNaRodada) {
    const chave = normNome(encontro.anfitriao)
    const atual = contagem.get(chave)
    if (atual) atual.quantidade += 1
    else contagem.set(chave, { casal: encontro.anfitriao, quantidade: 1 })
  }

  const repetidos = Array.from(contagem.values())
    .filter((item) => item.quantidade > 1)
    .map(({ casal, quantidade }) => ({ casal, quantidade }))

  const foraDaOrdem = Array.from(contagem.values())
    .map((item) => item.casal)
    .filter((casal) => !oficiais.has(normNome(casal)))

  const statusCasais: StatusCasalRodada[] = participantes.map((casal, index) => {
    const doCasal = encontrosNaRodada.filter((encontro) => normNome(encontro.anfitriao) === normNome(casal))
    const ultimo = doCasal[doCasal.length - 1]
    return {
      ordem: index + 1,
      casal,
      jaFoiAnfitriao: doCasal.length > 0,
      dataUltimoEncontro: ultimo ? `${ultimo.dia} de ${ultimo.mes} de ${ultimo.ano}` : null,
      descricaoUltimoEncontro: ultimo?.descricao ?? null,
      numeroEncontro: ultimo?.numero ?? null,
    }
  })

  const pendentes = statusCasais.filter((casal) => !casal.jaFoiAnfitriao)
  return { participantes, encontrosNaRodada, repetidos, foraDaOrdem, statusCasais, pendentes }
}

export function calcularRodadaAtual(encontros: Encontro[]): RodadaAtual {
  const total = ORDEM_CASAIS.length
  const numbered = sortEncontrosAsc(encontros)
    .map((encontro, index) => ({
      ...encontro,
      numero: encontro.numero > 0 ? encontro.numero : index + 1,
    }))
    .sort((a, b) => a.numero - b.numero)

  const ultimoNumero = numbered[numbered.length - 1]?.numero ?? 1
  let faixa = faixaRodada(ultimoNumero, total)
  let avaliacao = avaliar(faixa, numbered)
  let novaRodada = false

  if (avaliacao.pendentes.length === 0 && avaliacao.encontrosNaRodada.length > 0) {
    faixa = faixaRodada(faixa.fim + 1, total)
    avaliacao = avaliar(faixa, numbered)
    novaRodada = true
  }

  const temarioMatch = numbered[numbered.length - 1]?.descricao.match(/(\d+)º TEMÁRIO/)

  return {
    nomeRodada: faixa.nome,
    encontrosNaRodada: avaliacao.encontrosNaRodada,
    statusCasais: avaliacao.statusCasais,
    pendentes: avaliacao.pendentes,
    repetidos: avaliacao.repetidos,
    foraDaOrdem: avaliacao.foraDaOrdem,
    completos: avaliacao.statusCasais.filter((casal) => casal.jaFoiAnfitriao).length,
    totalCasais: avaliacao.participantes.length,
    proximosNaOrdem: avaliacao.pendentes,
    numeroInicioCiclo: faixa.inicio,
    numeroFimCiclo: faixa.fim,
    temario: temarioMatch ? Number(temarioMatch[1]) : null,
    novaRodada,
    rodadaCompleta: novaRodada,
  }
}
