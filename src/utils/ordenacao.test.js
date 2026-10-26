// Testes da ordenação da lista (utils/ordenacao.js). Rodar com: npm test
import { describe, expect, it } from 'vitest'
import { ordenarPosicoes } from './ordenacao.js'

const p = (ticker, nome, lucro, valorAtual, temCotacao = true) => ({
  ticker,
  cotacao: nome ? { nome } : undefined,
  lucro,
  valorAtual,
  temCotacao,
})

// Ordem de cadastro
const LISTA = [
  p('PETR4', 'Petroleo Brasileiro', 500, 11000),
  p('VALE3', 'Vale S.A.', -560, 4900),
  p('ITUB4', 'Itaú Unibanco', 2700, 7200),
  p('XPTO3', null, 0, 50, false), // sem cotação e sem nome
  p('ABEV3', 'Ambev', -10, 900),
]
const tickers = (lista) => lista.map((x) => x.ticker)

describe('ordenarPosicoes', () => {
  it('"cadastro" mantém a ordem original', () => {
    expect(tickers(ordenarPosicoes(LISTA, 'cadastro'))).toEqual(['PETR4', 'VALE3', 'ITUB4', 'XPTO3', 'ABEV3'])
  })

  it('"lucro" vai do maior lucro ao maior prejuízo, com os sem cotação no fim', () => {
    expect(tickers(ordenarPosicoes(LISTA, 'lucro'))).toEqual(['ITUB4', 'PETR4', 'ABEV3', 'VALE3', 'XPTO3'])
  })

  it('"valor" vai do maior para o menor valor atual', () => {
    expect(tickers(ordenarPosicoes(LISTA, 'valor'))).toEqual(['PETR4', 'ITUB4', 'VALE3', 'ABEV3', 'XPTO3'])
  })

  it('"nome" ordena pelo nome da empresa ignorando acentos (e usa o ticker se não houver nome)', () => {
    expect(tickers(ordenarPosicoes(LISTA, 'nome'))).toEqual(['ABEV3', 'ITUB4', 'PETR4', 'VALE3', 'XPTO3'])
  })

  it('não altera a lista original', () => {
    const copia = [...LISTA]
    ordenarPosicoes(LISTA, 'valor')
    expect(LISTA).toEqual(copia)
  })

  it('critério desconhecido cai na ordem de cadastro', () => {
    expect(tickers(ordenarPosicoes(LISTA, 'qualquer'))).toEqual(tickers(LISTA))
  })
})
