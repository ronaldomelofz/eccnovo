/** Ordem oficial de rodízio dos 10 casais anfitriões */
export const ORDEM_CASAIS = [
  'ROBERVAL E IARA',
  'JOÃO MAURICIO E FERNANDA',
  'RIBINHA E ROSANA',
  'RAULINO E NAIR',
  'RUBENS E FERNANDA',
  'RONALD E SARA',
  'HUGO E YANE',
  'RONALDO E SANDRA',
  'MARCIO E FERNANDA',
  'MAURO E DALIANE',
] as const

export type CasalOrdem = (typeof ORDEM_CASAIS)[number]
