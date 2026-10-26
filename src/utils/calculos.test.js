// Testes dos cálculos da carteira (utils/calculos.js). Rodar com: npm test
import { describe, expect, it } from 'vitest'
import { calcularDistribuicao, calcularPosicao, calcularPosicoes, calcularResumo } from './calculos.js'

const PETR4 = { id: '1', ticker: 'PETR4', quantidade: 100, precoMedio: 30 }
const VALE3 = { id: '2', ticker: 'VALE3', quantidade: 10, precoMedio: 70 }

describe('calcularPosicao', () => {
  it('calcula investido, atual, lucro em R$ e em %', () => {
    const p = calcularPosicao(PETR4, { preco: 33, variacaoDia: 1 })
    expect(p.valorInvestido).toBe(3000)
    expect(p.valorAtual).toBe(3300)
    expect(p.lucro).toBe(300)
    expect(p.lucroPercentual).toBeCloseTo(10)
    expect(p.temCotacao).toBe(true)
  })

  it('prejuízo dá lucro negativo', () => {
    const p = calcularPosicao(VALE3, { preco: 63 })
    expect(p.lucro).toBe(-70)
    expect(p.lucroPercentual).toBeCloseTo(-10)
  })

  it('sem cotação usa o preço médio (lucro zero) e marca temCotacao = false', () => {
    const p = calcularPosicao(PETR4, undefined)
    expect(p.temCotacao).toBe(false)
    expect(p.valorAtual).toBe(3000)
    expect(p.lucro).toBe(0)
  })

  it('mantém os campos do ativo', () => {
    const p = calcularPosicao(PETR4, { preco: 31 })
    expect(p).toMatchObject({ id: '1', ticker: 'PETR4', quantidade: 100, precoMedio: 30 })
  })
})

describe('calcularResumo', () => {
  const posicoes = calcularPosicoes([PETR4, VALE3], {
    PETR4: { preco: 33, variacaoDia: 10 }, // hoje 3300; ontem 3000 → ganhou 300 no dia
    // VALE3 sem cotação
  })
  const resumo = calcularResumo(posicoes)

  it('soma investido, atual e lucro', () => {
    expect(resumo.quantidadeAtivos).toBe(2)
    expect(resumo.valorInvestido).toBe(3700)
    expect(resumo.valorAtual).toBe(4000) // 3300 + 700 (VALE3 pelo preço médio)
    expect(resumo.lucro).toBe(300)
    expect(resumo.lucroPercentual).toBeCloseTo((300 / 3700) * 100)
  })

  it('calcula a variação do dia em R$ a partir da % da brapi', () => {
    expect(resumo.variacaoDia).toBeCloseTo(300)
  })

  it('conta os ativos sem cotação', () => {
    expect(resumo.semCotacao).toBe(1)
  })

  it('carteira vazia não quebra (tudo zero)', () => {
    const vazio = calcularResumo([])
    expect(vazio).toMatchObject({ quantidadeAtivos: 0, valorAtual: 0, lucro: 0, lucroPercentual: 0, variacaoDiaPercentual: 0 })
  })
})

describe('calcularDistribuicao', () => {
  it('devolve a participação de cada ativo, do maior para o menor', () => {
    const posicoes = calcularPosicoes([VALE3, PETR4], { PETR4: { preco: 30 }, VALE3: { preco: 100 } })
    const d = calcularDistribuicao(posicoes)
    expect(d.map((x) => x.ticker)).toEqual(['PETR4', 'VALE3'])
    expect(d[0].percentual).toBeCloseTo(75) // 3000 de 4000
    expect(d.reduce((s, x) => s + x.percentual, 0)).toBeCloseTo(100)
  })

  it('total zero devolve lista vazia', () => {
    expect(calcularDistribuicao([])).toEqual([])
  })
})
