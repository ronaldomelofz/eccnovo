import type { Encontro } from './encontros'
import { ORDEM_CASAIS } from './casais'

export interface StatusCasalRodada {
  ordem: number
  casal: string
  jaFoiAnfitriao: boolean
  dataUltimoEncontro: string | null
  descricaoUltimoEncontro: string | null
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
  completos: number
  totalCasais: number
  proximosNaOrdem: StatusCasalRodada[]
  numeroInicioCiclo: number
  numeroFimCiclo: number
  temario: number | null
  rodadaCompleta: boolean
}

/**
 * A formação inicial teve 9 encontros (o 10º casal entrou no 10º).
 * Depois disso, cada rodada é um bloco de 10 encontros: 10–19, 20–29, 30–39, 40–49…
 * O número usado é o da planilha (sequência global), não o “Nº no temário”.
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

function numeroGlobal(encontro: Encontro, fallback: number) {
  return encontro.numero > 0 ? encontro.numero : fallback
}

export function calcularRodadaAtual(encontros: Encontro[]): RodadaAtual {
  const total = ORDEM_CASAIS.length
  const numbered = [...encontros]
    .map((encontro, index) => ({ ...encontro, numero: numeroGlobal(encontro, index + 1) }))
    .sort((a, b) => a.numero - b.numero)

  const faixa = faixaRodada(numbered.at(-1)?.numero ?? 1, total)
  const participantes = ORDEM_CASAIS.slice(0, faixa.tamanho)
  const encontrosNaRodada = numbered.filter(
    (encontro) => encontro.numero >= faixa.inicio && encontro.numero <= faixa.fim
  )

  const contagem = new Map<string, number>()
  for (const encontro of encontrosNaRodada) {
    contagem.set(encontro.anfitriao, (contagem.get(encontro.anfitriao) || 0) + 1)
  }
  const repetidos = Array.from(contagem.entries())
    .filter(([, quantidade]) => quantidade > 1)
    .map(([casal, quantidade]) => ({ casal, quantidade }))

  const statusCasais: StatusCasalRodada[] = participantes.map((casal, index) => {
    const doCasal = encontrosNaRodada.filter((encontro) => encontro.anfitriao === casal)
    const ultimo = doCasal.at(-1)
    return {
      ordem: index + 1,
      casal,
      jaFoiAnfitriao: doCasal.length > 0,
      dataUltimoEncontro: ultimo ? `${ultimo.dia} de ${ultimo.mes} de ${ultimo.ano}` : null,
      descricaoUltimoEncontro: ultimo?.descricao ?? null,
    }
  })

  const pendentes = statusCasais.filter((casal) => !casal.jaFoiAnfitriao)
  const temarioMatch = numbered.at(-1)?.descricao.match(/(\d+)º TEMÁRIO/)

  return {
    nomeRodada: faixa.nome,
    encontrosNaRodada,
    statusCasais,
    pendentes,
    repetidos,
    completos: statusCasais.filter((casal) => casal.jaFoiAnfitriao).length,
    totalCasais: participantes.length,
    proximosNaOrdem: pendentes,
    numeroInicioCiclo: faixa.inicio,
    numeroFimCiclo: faixa.fim,
    temario: temarioMatch ? Number(temarioMatch[1]) : null,
    rodadaCompleta: participantes.length > 0 && encontrosNaRodada.length > 0 && pendentes.length === 0,
  }
}
