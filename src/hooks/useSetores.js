import { useBuscaPorTicker } from './useBuscaPorTicker.js'
import { buscarSetor } from '../services/brapi.js'

const NENHUM = []

// Setor de cada ticker (para a distribuição "por setor" do gráfico de rosca).
// - ligado: só busca quando a pessoa escolhe "por setor" (não gasta requisição à toa).
//   Depois da primeira vez fica 30 dias no cache, então trocar de visão é instantâneo.
//
// Devolve { setores: { PETR4: { setor, tipo } }, erros, carregando, feitos, total }
export function useSetores(tickers, ligado) {
  const { resultados, ...resto } = useBuscaPorTicker(ligado ? tickers : NENHUM, buscarSetor)
  return { setores: resultados, ...resto }
}
