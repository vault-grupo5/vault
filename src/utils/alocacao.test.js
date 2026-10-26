// Testes da distribuição para o gráfico de rosca (utils/alocacao.js). Rodar com: npm test
import { describe, expect, it } from 'vitest'
import { agruparPorAtivo, agruparPorSetor, montarFatias, ordenarParaDesenho } from './alocacao.js'

const pos = (pares) => pares.map(([ticker, valorAtual]) => ({ ticker, valorAtual }))

describe('agruparPorSetor', () => {
  it('soma os ativos do mesmo setor e lista os tickers, na ordem em que o setor aparece', () => {
    const setores = { PETR4: 'Petróleo', ITUB4: 'Financeiro', BBAS3: 'Financeiro' }
    const grupos = agruparPorSetor(pos([['PETR4', 100], ['ITUB4', 50], ['BBAS3', 30]]), (t) => setores[t])
    expect(grupos).toEqual([
      { chave: 'Petróleo', rotulo: 'Petróleo', valor: 100, detalhe: 'PETR4' },
      { chave: 'Financeiro', rotulo: 'Financeiro', valor: 80, detalhe: 'ITUB4, BBAS3' },
    ])
  })
})

describe('montarFatias', () => {
  it('ordena do maior para o menor e calcula a %', () => {
    const fatias = montarFatias(agruparPorAtivo(pos([['A', 10], ['B', 30]])))
    expect(fatias.map((f) => f.chave)).toEqual(['B', 'A'])
    expect(fatias[0].percentual).toBeCloseTo(75)
  })

  it('a cor segue a ordem da carteira, não o tamanho', () => {
    const fatias = montarFatias(agruparPorAtivo(pos([['A', 10], ['B', 30]])))
    expect(fatias.find((f) => f.chave === 'A').indiceCor).toBe(1)
    expect(fatias.find((f) => f.chave === 'B').indiceCor).toBe(2)
  })

  it('com mais de 6 grupos, ficam os 5 maiores e o resto vira "Outros (n)" sem cor', () => {
    const fatias = montarFatias(agruparPorAtivo(pos([['A', 5], ['B', 40], ['C', 30], ['D', 20], ['E', 9], ['F', 8], ['G', 7]])))
    expect(fatias).toHaveLength(6)
    const outros = fatias.at(-1)
    expect(outros.rotulo).toBe('Outros (2)')
    expect(outros.valor).toBe(12) // A (5) + G (7)
    expect(outros.indiceCor).toBeNull()
    expect(fatias.reduce((s, f) => s + f.percentual, 0)).toBeCloseTo(100)
  })

  it('carteira vazia ou sem valor devolve lista vazia', () => {
    expect(montarFatias([])).toEqual([])
    expect(montarFatias(agruparPorAtivo(pos([['A', 0]])))).toEqual([])
  })
})

describe('ordenarParaDesenho', () => {
  const cores = (fatias) => ordenarParaDesenho(fatias).map((f) => f.indiceCor ?? 'cinza').join('-')

  it('desenha na ordem das cores (validada para daltonismo)', () => {
    expect(cores(montarFatias(agruparPorAtivo(pos([['A', 1], ['B', 3], ['C', 2]]))))).toBe('1-2-3')
  })

  it('com 4 fatias usa 1-2-4-3 (o azul não encosta no roxo)', () => {
    expect(cores(montarFatias(agruparPorAtivo(pos([['A', 10], ['B', 40], ['C', 30], ['D', 20]]))))).toBe('1-2-4-3')
  })

  it('"Outros" fica sempre no fim', () => {
    const fatias = montarFatias(agruparPorAtivo(pos([['A', 5], ['B', 40], ['C', 30], ['D', 20], ['E', 9], ['F', 8], ['G', 7]])))
    expect(cores(fatias)).toBe('1-2-3-4-5-cinza')
  })
})
