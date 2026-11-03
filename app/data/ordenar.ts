/** Ordem cronológica: Janeiro → Dezembro */
export const MESES_ORDEM: Record<string, number> = {
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

export interface EncontroOrdenavel {
  ano: number
  mes: string
  dia: string
}

function compararData(a: EncontroOrdenavel, b: EncontroOrdenavel) {
  if (a.ano !== b.ano) return a.ano - b.ano
  const mesA = MESES_ORDEM[a.mes] ?? 0
  const mesB = MESES_ORDEM[b.mes] ?? 0
  if (mesA !== mesB) return mesA - mesB
  return parseInt(a.dia, 10) - parseInt(b.dia, 10)
}

export function sortEncontrosAsc<T extends EncontroOrdenavel>(items: T[]): T[] {
  return [...items].sort(compararData)
}

/** Último encontro primeiro. */
export function sortEncontrosDesc<T extends EncontroOrdenavel>(items: T[]): T[] {
  return [...items].sort((a, b) => compararData(b, a))
}
