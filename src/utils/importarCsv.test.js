// Testes da importação de CSV (utils/importarCsv.js). Rodar com: npm test
import { describe, expect, it } from 'vitest'
import { lerCsvDaCarteira } from './importarCsv.js'
import { gerarCsv } from './exportarCsv.js'

const CAB = 'Ticker;Empresa;Quantidade;Preço médio (R$);Preço atual (R$);Valor investido (R$);Valor atual (R$);Lucro/prejuízo (R$);Lucro/prejuízo (%);Situação'
const sem = (ativos) => ativos.map(({ ticker, quantidade, precoMedio }) => ({ ticker, quantidade, precoMedio }))

describe('lerCsvDaCarteira', () => {
  it('lê um arquivo exportado pelo próprio VAULT (ida e volta)', () => {
    const posicoes = [
      { ticker: 'PETR4', quantidade: 100, precoMedio: 32.5, valorInvestido: 3250, valorAtual: 4000, lucro: 750, lucroPercentual: 23, temCotacao: true, precoAtual: 40, cotacao: { nome: 'Petrobras; "PN"' } },
      { ticker: 'VALE3', quantidade: 50, precoMedio: 60, valorInvestido: 3000, valorAtual: 2900, lucro: -100, lucroPercentual: -3, temCotacao: false },
    ]
    const resumo = { valorInvestido: 6250, valorAtual: 6900, lucro: 650, lucroPercentual: 10 }
    const { ativos, erros } = lerCsvDaCarteira(gerarCsv(posicoes, resumo))
    expect(erros).toEqual([])
    expect(sem(ativos)).toEqual([
      { ticker: 'PETR4', quantidade: 100, precoMedio: 32.5 },
      { ticker: 'VALE3', quantidade: 50, precoMedio: 60 },
    ])
    expect(ativos[0].id).toBeTypeOf('string')
  })

  it('aceita quebra de linha LF e ignora linhas em branco', () => {
    const { ativos, erros } = lerCsvDaCarteira(`${CAB}\n\nitub4;;10;28,90;;;;;;\n`)
    expect(erros).toEqual([])
    expect(sem(ativos)).toEqual([{ ticker: 'ITUB4', quantidade: 10, precoMedio: 28.9 }])
  })

  it('recusa arquivo vazio e cabeçalho desconhecido', () => {
    expect(lerCsvDaCarteira('').erros[0]).toMatch(/vazio/)
    expect(lerCsvDaCarteira('a;b;c\n1;2;3').erros[0]).toMatch(/Cabeçalho/)
  })

  it('recusa arquivo sem ativos', () => {
    expect(lerCsvDaCarteira(`${CAB}\nTOTAL;;;;;1;1;0;0;`).erros[0]).toMatch(/nenhum ativo/)
  })

  it('aponta a linha de cada problema e não importa nada', () => {
    const { ativos, erros } = lerCsvDaCarteira(`${CAB}\nPETR4;;abc;32,5\nXX;;10;5\nVALE3;;10;0`)
    expect(ativos).toEqual([])
    expect(erros).toHaveLength(3)
    expect(erros[0]).toMatch(/^Linha 2:.*quantidade/)
    expect(erros[1]).toMatch(/^Linha 3:.*ticker/)
    expect(erros[2]).toMatch(/^Linha 4:.*preço médio/)
  })

  it('recusa ticker repetido e quantidade fracionada', () => {
    const { erros } = lerCsvDaCarteira(`${CAB}\nPETR4;;10;5\nPETR4;;10;5\nVALE3;;1,5;5`)
    expect(erros).toHaveLength(2)
    expect(erros[0]).toMatch(/repetido/)
    expect(erros[1]).toMatch(/inteiro/)
  })
})
