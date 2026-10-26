// Testes da evolução do patrimônio e da comparação com o Ibovespa (utils/evolucao.js).
// Rodar com: npm test
import { describe, expect, it } from 'vitest'
import { calcularEvolucao, compararComIndice, variacaoDoPeriodo } from './evolucao.js'

// A brapi marca cada dia às 03:00 UTC (meia-noite em Brasília). Dias de julho de 2026.
const dia = (d) => Date.UTC(2026, 6, d, 3)
const chave = (ms) => new Date(ms).toISOString().slice(0, 10)

describe('calcularEvolucao', () => {
  const historicos = {
    AAAA3: [
      { data: dia(1), fechamento: 10 },
      { data: dia(2), fechamento: 11 },
      { data: dia(3), fechamento: 12 },
      { data: dia(6), fechamento: 13 },
    ],
    // começa um dia depois e NÃO tem o dia 3
    BBBB4: [
      { data: dia(2), fechamento: 100 },
      { data: dia(6), fechamento: 110 },
    ],
  }
  const ativos = [
    { ticker: 'AAAA3', quantidade: 10 },
    { ticker: 'BBBB4', quantidade: 2 },
  ]

  it('soma quantidade atual × fechamento de cada dia', () => {
    const { pontos } = calcularEvolucao(ativos, historicos)
    expect(pontos.at(-1).valor).toBe(10 * 13 + 2 * 110) // 350
  })

  it('começa no primeiro dia em que TODOS os ativos têm preço', () => {
    const { pontos } = calcularEvolucao(ativos, historicos)
    expect(chave(pontos[0].data)).toBe('2026-07-02')
    expect(pontos[0].valor).toBe(10 * 11 + 2 * 100) // 310
  })

  it('num dia sem preço de um ativo, usa o último preço conhecido dele', () => {
    const { pontos } = calcularEvolucao(ativos, historicos)
    const dia3 = pontos.find((p) => chave(p.data) === '2026-07-03')
    expect(dia3.valor).toBe(10 * 12 + 2 * 100) // BBBB4 continua a 100
  })

  it('soma quantidades do mesmo ticker repetido', () => {
    const { pontos } = calcularEvolucao([...ativos, { ticker: 'AAAA3', quantidade: 5 }], historicos)
    expect(pontos.at(-1).valor).toBe(15 * 13 + 2 * 110)
  })

  it('lista os ativos sem histórico e calcula com os outros', () => {
    const r = calcularEvolucao([...ativos, { ticker: 'SEMH3', quantidade: 5 }], historicos)
    expect(r.semHistorico).toEqual(['SEMH3'])
    expect(r.pontos.at(-1).valor).toBe(350)
  })

  it('sem nenhum histórico devolve série vazia', () => {
    expect(calcularEvolucao(ativos, {})).toEqual({ pontos: [], semHistorico: ['AAAA3', 'BBBB4'] })
    expect(calcularEvolucao([], {})).toEqual({ pontos: [], semHistorico: [] })
  })
})

describe('variacaoDoPeriodo', () => {
  it('compara o último ponto com o primeiro, em %', () => {
    expect(variacaoDoPeriodo([{ valor: 310 }, { valor: 320 }, { valor: 350 }])).toBeCloseTo((350 / 310 - 1) * 100)
  })

  it('série curta ou começando em zero dá 0', () => {
    expect(variacaoDoPeriodo([])).toBe(0)
    expect(variacaoDoPeriodo([{ valor: 100 }])).toBe(0)
    expect(variacaoDoPeriodo([{ valor: 0 }, { valor: 10 }])).toBe(0)
  })
})

describe('compararComIndice', () => {
  const carteira = [
    { data: dia(2), valor: 1000 },
    { data: dia(3), valor: 1100 },
    { data: dia(6), valor: 1050 },
  ]
  const ibovespa = [
    { data: dia(1), fechamento: 99 },
    { data: dia(2), fechamento: 100 },
    { data: dia(6), fechamento: 103 }, // falta o dia 3
  ]

  it('as duas séries começam em 0% no primeiro dia da carteira', () => {
    const r = compararComIndice(carteira, ibovespa)
    expect(r.pontos[0]).toMatchObject({ carteira: 0, indice: 0 })
  })

  it('calcula a rentabilidade final e a diferença em pontos percentuais', () => {
    const r = compararComIndice(carteira, ibovespa)
    expect(r.carteira).toBeCloseTo(5)
    expect(r.indice).toBeCloseTo(3)
    expect(r.diferenca).toBeCloseTo(2)
  })

  it('dia sem dado do índice repete o anterior', () => {
    const r = compararComIndice(carteira, ibovespa)
    expect(r.pontos[1].indice).toBeCloseTo(0)
    expect(r.pontos[1].carteira).toBeCloseTo(10)
  })

  it('devolve null quando não dá para comparar', () => {
    expect(compararComIndice(carteira, [])).toBeNull()
    expect(compararComIndice(carteira, undefined)).toBeNull()
    expect(compararComIndice([carteira[0]], ibovespa)).toBeNull()
    expect(compararComIndice(carteira, [{ data: dia(5), fechamento: 1 }])).toBeNull() // índice começa depois
  })
})
