// Testes da exportação em CSV (utils/exportarCsv.js). Rodar com: npm test
import { describe, expect, it } from 'vitest'
import { gerarCsv, nomeDoArquivoCsv } from './exportarCsv.js'

const posicao = (extra) => ({
  ticker: 'PETR4',
  cotacao: { nome: 'Petrobras' },
  quantidade: 1000,
  precoMedio: 30,
  precoAtual: 33.1,
  valorInvestido: 30000,
  valorAtual: 33100.5,
  lucro: 3100.5,
  lucroPercentual: 10.335,
  temCotacao: true,
  ...extra,
})
const RESUMO = { valorInvestido: 30000, valorAtual: 33100.5, lucro: 3100.5, lucroPercentual: 10.335 }
const linhas = (csv) => csv.slice(1).split('\r\n') // tira o BOM e separa as linhas

describe('gerarCsv', () => {
  it('começa com BOM UTF-8 e usa CRLF', () => {
    const csv = gerarCsv([posicao()], RESUMO)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('usa ; como separador e vírgula decimal, sem R$ nem ponto de milhar', () => {
    expect(linhas(gerarCsv([posicao()], RESUMO))[1]).toBe(
      'PETR4;Petrobras;1000;30,00;33,10;30000,00;33100,50;3100,50;10,34;Cotação atual',
    )
  })

  it('termina com a linha de TOTAL', () => {
    expect(linhas(gerarCsv([posicao()], RESUMO))[2]).toBe('TOTAL;;;;;30000,00;33100,50;3100,50;10,34;')
  })

  it('ativo sem cotação deixa o preço atual vazio e avisa na situação', () => {
    const linha = linhas(gerarCsv([posicao({ temCotacao: false, cotacao: undefined })], RESUMO))[1]
    expect(linha.split(';')[4]).toBe('')
    expect(linha.endsWith('Sem cotação (usando preço médio)')).toBe(true)
  })

  it('protege contra fórmula e escapa ; e aspas', () => {
    const csv = gerarCsv([posicao({ cotacao: { nome: '=HYPERLINK("x")' } }), posicao({ cotacao: { nome: 'A "B"; C' } })], RESUMO)
    const [, formula, aspas] = linhas(csv)
    expect(formula.split(';')[1]).toBe(`"'=HYPERLINK(""x"")"`)
    expect(aspas).toContain('"A ""B""; C"')
  })
})

describe('nomeDoArquivoCsv', () => {
  it('usa a data local no formato AAAA-MM-DD', () => {
    expect(nomeDoArquivoCsv(new Date(2026, 9, 4))).toBe('vault-carteira-2026-10-04.csv')
    expect(nomeDoArquivoCsv(new Date(2026, 11, 31, 23, 59))).toBe('vault-carteira-2026-12-31.csv')
  })
})
