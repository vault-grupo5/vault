import { useEffect, useState } from 'react'

// Roda uma função de busca (ex: buscarHistorico, buscarSetor) para cada ticker, UM DE CADA VEZ.
// As funções do brapi.js já passam pela fila (1 requisição por vez, regra do plano grátis)
// e pelo cache; este hook só organiza os resultados e o progresso para a tela.
//
// Parâmetros:
// - tickers: lista de tickers (ex: ['PETR4', 'VALE3']). Lista vazia = não busca nada.
// - buscar: função assíncrona que recebe um ticker e devolve o resultado
//
// Devolve:
//   resultados: { PETR4: ..., VALE3: ... }  (só os que deram certo)
//   erros:      { XPTO3: 'mensagem' }
//   carregando: true até terminar todos
//   feitos / total: para mostrar "Carregando 3 de 6"
export function useBuscaPorTicker(tickers, buscar) {
  // Texto com os tickers (ex: "PETR4,VALE3"): o efeito só roda de novo se a LISTA mudar,
  // e não a cada renderização (um array novo seria sempre "diferente" para o React)
  const chave = [...new Set(tickers)].sort().join(',')

  const [estado, setEstado] = useState({ chave: '', resultados: {}, erros: {}, feitos: 0 })

  useEffect(() => {
    if (!chave) return
    let cancelado = false // se a lista mudar no meio, paramos de atualizar a tela com a busca velha
    const lista = chave.split(',')

    async function buscarTodos() {
      const resultados = {}
      const erros = {}
      for (const [indice, ticker] of lista.entries()) {
        try {
          resultados[ticker] = await buscar(ticker)
        } catch (erro) {
          erros[ticker] = erro.message
        }
        if (cancelado) return
        // Atualiza a cada ticker, para a tela mostrar o progresso
        setEstado({ chave, resultados: { ...resultados }, erros: { ...erros }, feitos: indice + 1 })
      }
    }

    buscarTodos()
    return () => {
      cancelado = true
    }
  }, [chave, buscar])

  // Enquanto a busca da lista atual não começou, o estado ainda é da lista anterior
  const atual = estado.chave === chave
  const total = chave ? chave.split(',').length : 0
  const feitos = atual ? estado.feitos : 0

  return {
    resultados: atual ? estado.resultados : {},
    erros: atual ? estado.erros : {},
    carregando: feitos < total,
    feitos,
    total,
  }
}
