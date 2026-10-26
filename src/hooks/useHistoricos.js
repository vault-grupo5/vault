import { useEffect, useState } from 'react'
import { buscarHistorico } from '../services/brapi.js'

// Busca o histórico de 3 meses de vários tickers, um de cada vez.
// Usa o buscarHistorico do brapi.js, que já passa pela FILA (1 requisição por vez, regra do
// plano grátis) e pelo CACHE de 1 hora (abrir a página de novo não gasta requisição).
//
// Devolve:
//   historicos: { PETR4: [{ data, fechamento }], ... }  (só os que deram certo)
//   erros:      { XPTO3: 'mensagem' }
//   carregando: true até terminar todos
//   feitos / total: para mostrar "Carregando 3 de 6"
export function useHistoricos(tickers) {
  // Texto com os tickers (ex: "PETR4,VALE3"): o efeito só roda de novo se a LISTA mudar,
  // e não a cada renderização (um array novo seria sempre "diferente" para o React)
  const chave = [...new Set(tickers)].sort().join(',')

  const [estado, setEstado] = useState({ chave: '', historicos: {}, erros: {}, feitos: 0 })

  useEffect(() => {
    if (!chave) return
    let cancelado = false // se a lista mudar no meio, paramos de atualizar a tela com a busca velha
    const lista = chave.split(',')

    async function buscarTodos() {
      const historicos = {}
      const erros = {}
      for (const [indice, ticker] of lista.entries()) {
        try {
          historicos[ticker] = await buscarHistorico(ticker)
        } catch (erro) {
          erros[ticker] = erro.message
        }
        if (cancelado) return
        // Atualiza a cada ativo, para a tela mostrar o progresso
        setEstado({ chave, historicos: { ...historicos }, erros: { ...erros }, feitos: indice + 1 })
      }
    }

    buscarTodos()
    return () => {
      cancelado = true
    }
  }, [chave])

  // Enquanto a busca da lista atual não começou, o estado ainda é da lista anterior
  const atual = estado.chave === chave
  const total = chave ? chave.split(',').length : 0
  const feitos = atual ? estado.feitos : 0

  return {
    historicos: atual ? estado.historicos : {},
    erros: atual ? estado.erros : {},
    carregando: feitos < total,
    feitos,
    total,
  }
}
