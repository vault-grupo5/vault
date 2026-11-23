// Testes dos limites de quantidade e preço médio (utils/ativo.js). Rodar com: npm test
import { describe, expect, it } from 'vitest'
import { erroDePrecoMedio, erroDeQuantidade } from './ativo.js'

describe('erroDeQuantidade', () => {
  it('aceita de 1 até 10.000.000', () => {
    expect(erroDeQuantidade(1)).toBe('')
    expect(erroDeQuantidade(10_000_000)).toBe('')
  })

  it('recusa zero, negativo, fracionado e texto inválido', () => {
    for (const q of [0, -5, 1.5, NaN]) expect(erroDeQuantidade(q)).toMatch(/inteira maior que zero/)
  })

  it('recusa acima do máximo, inclusive números gigantes', () => {
    expect(erroDeQuantidade(10_000_001)).toBe('A quantidade máxima é 10.000.000.')
    expect(erroDeQuantidade(1e20)).toBe('A quantidade máxima é 10.000.000.')
  })
})

describe('erroDePrecoMedio', () => {
  it('aceita de R$ 0,01 até R$ 1.000.000,00', () => {
    expect(erroDePrecoMedio(0.01)).toBe('')
    expect(erroDePrecoMedio(32.5)).toBe('')
    expect(erroDePrecoMedio(1_000_000)).toBe('')
  })

  it('recusa zero, negativo e texto inválido', () => {
    for (const p of [0, -1, NaN, Infinity]) expect(erroDePrecoMedio(p)).toMatch(/maior que zero/)
  })

  it('recusa abaixo do mínimo e acima do máximo', () => {
    expect(erroDePrecoMedio(0.001)).toBe('O preço médio mínimo é R$ 0,01.')
    expect(erroDePrecoMedio(1_000_000.01)).toBe('O preço médio máximo é R$ 1.000.000,00.')
  })
})
