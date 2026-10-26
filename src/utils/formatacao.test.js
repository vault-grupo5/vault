// Testes da formatação para o padrão brasileiro (utils/formatacao.js). Rodar com: npm test
import { describe, expect, it } from 'vitest'
import {
  formatarHorario,
  formatarMoeda,
  formatarMoedaComSinal,
  formatarPorcentagem,
  formatarQuantidade,
  lerNumero,
  separarCentavos,
  tipoVariacao,
} from './formatacao.js'

// O Intl põe um espaço "não separável" (U+00A0) entre R$ e o número, para não quebrar a linha ali.
// Trocamos por um espaço comum para o teste ficar legível.
const comEspacoNormal = (texto) => texto.replace(/\u00a0/g, ' ')

describe('formatarMoeda', () => {
  it('usa R$, ponto no milhar e vírgula nos centavos', () => {
    expect(comEspacoNormal(formatarMoeda(1234.5))).toBe('R$ 1.234,50')
    expect(comEspacoNormal(formatarMoeda(0))).toBe('R$ 0,00')
  })

  it('trata null/undefined como zero', () => {
    expect(comEspacoNormal(formatarMoeda(undefined))).toBe('R$ 0,00')
  })
})

describe('formatarMoedaComSinal', () => {
  it('põe + no ganho e − (sinal tipográfico) no prejuízo', () => {
    expect(comEspacoNormal(formatarMoedaComSinal(120))).toBe('+R$ 120,00')
    expect(comEspacoNormal(formatarMoedaComSinal(-35.1))).toBe('−R$ 35,10')
    expect(comEspacoNormal(formatarMoedaComSinal(0))).toBe('R$ 0,00')
  })
})

describe('separarCentavos', () => {
  it('separa a parte inteira dos centavos', () => {
    const { inteiro, centavos } = separarCentavos(1234.5)
    expect(comEspacoNormal(inteiro)).toBe('R$ 1.234')
    expect(centavos).toBe(',50')
  })
})

describe('formatarPorcentagem', () => {
  it('duas casas, vírgula e sinal', () => {
    expect(formatarPorcentagem(2.345)).toBe('+2,35%')
    expect(formatarPorcentagem(-1.2)).toBe('−1,20%')
    expect(formatarPorcentagem(0)).toBe('0,00%')
  })
})

describe('formatarQuantidade', () => {
  it('usa ponto no milhar', () => {
    expect(formatarQuantidade(1500)).toBe('1.500')
  })
})

describe('tipoVariacao', () => {
  it('classifica em ganho, perda ou neutro', () => {
    expect(tipoVariacao(0.01)).toBe('ganho')
    expect(tipoVariacao(-3)).toBe('perda')
    expect(tipoVariacao(0)).toBe('neutro')
  })
})

describe('formatarHorario', () => {
  it('devolve HH:MM para uma data válida', () => {
    expect(formatarHorario('2026-10-23T17:07:00.000Z')).toMatch(/^\d{2}:\d{2}$/)
  })

  it('devolve vazio para data ausente ou inválida', () => {
    expect(formatarHorario(undefined)).toBe('')
    expect(formatarHorario('não é data')).toBe('')
  })
})

describe('lerNumero', () => {
  it('aceita vírgula ou ponto como decimal', () => {
    expect(lerNumero('12,5')).toBe(12.5)
    expect(lerNumero('12.5')).toBe(12.5)
  })

  it('entende o milhar com ponto quando há vírgula', () => {
    expect(lerNumero('1.234,56')).toBe(1234.56)
  })

  it('ignora espaços e devolve NaN para texto inválido ou vazio', () => {
    expect(lerNumero(' 100 ')).toBe(100)
    expect(lerNumero('abc')).toBeNaN()
    expect(lerNumero('')).toBeNaN()
  })
})
