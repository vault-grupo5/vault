import { useBuscaPorTicker } from './useBuscaPorTicker.js'
import { buscarHistorico } from '../services/brapi.js'

// Histórico de 3 meses de vários tickers (usado na página Análises).
// buscarHistorico já tem fila e cache de 1 hora; a organização fica no useBuscaPorTicker.
//
// Devolve { historicos: { PETR4: [{ data, fechamento }] }, erros, carregando, feitos, total }
export function useHistoricos(tickers) {
  const { resultados, ...resto } = useBuscaPorTicker(tickers, buscarHistorico)
  return { historicos: resultados, ...resto }
}
