import { createContext, useContext } from 'react'
import { formatarMoeda, formatarMoedaComSinal } from '../utils/formatacao.js'

// Modo privacidade: quando ligado, todos os valores em R$ aparecem como "R$ •••••"
// (útil para abrir o VAULT em público ou compartilhar a tela). As porcentagens continuam visíveis.
//
// Por que um Context (contexto do React): os valores em R$ aparecem em muitos componentes,
// alguns bem "fundos" (linha da lista, balão do gráfico, painel do histórico). Com o Context,
// o App informa uma vez se é para esconder e qualquer componente lê com useMoeda(),
// sem precisar passar uma prop por todos os componentes do caminho.
export const PrivacidadeContexto = createContext(false)

export const VALOR_OCULTO = 'R$ •••••'

// Uso: const { moeda, moedaComSinal, ocultar } = useMoeda()
//      moeda(1234.5)          → "R$ 1.234,50"  (ou "R$ •••••" no modo privacidade)
//      moedaComSinal(-35.1)   → "−R$ 35,10"    (ou "R$ •••••")
export function useMoeda() {
  const ocultar = useContext(PrivacidadeContexto)
  return {
    ocultar,
    moeda: (valor) => (ocultar ? VALOR_OCULTO : formatarMoeda(valor)),
    moedaComSinal: (valor) => (ocultar ? VALOR_OCULTO : formatarMoedaComSinal(valor)),
  }
}
