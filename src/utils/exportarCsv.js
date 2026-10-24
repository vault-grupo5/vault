// Exportação da carteira para um arquivo CSV (abre no Excel, Google Planilhas etc.).
//
// Escolhas pensando no Excel em português:
// - separador ";" (ponto e vírgula): o Excel brasileiro usa a vírgula como casa decimal,
//   então não pode usá-la também para separar colunas;
// - números com vírgula decimal e sem símbolo "R$" nem ponto de milhar (ex: 1234,56),
//   para o Excel entender como NÚMERO e permitir somar, ordenar e fazer gráficos;
// - BOM UTF-8 no começo do arquivo: sem ele o Excel mostra "Ã§Ã£o" no lugar de "ção";
// - quebra de linha CRLF (\r\n), o padrão do formato CSV.

const SEPARADOR = ';'
const QUEBRA_DE_LINHA = '\r\n'
const BOM_UTF8 = '﻿'

// 1234.5 → "1234,50"   (null/undefined → vazio)
function numero(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor.toFixed(2).replace('.', ',') : ''
}

// Prepara um TEXTO para virar uma célula do CSV:
// 1) Proteção contra "injeção de fórmula": se o texto começa com = + - @ o Excel o trataria
//    como fórmula (e o nome da empresa vem de uma API externa). Um apóstrofo na frente
//    faz o Excel mostrar como texto comum.
// 2) Se tem ; " ou quebra de linha, a célula vai entre aspas e as aspas internas são dobradas.
function texto(valor) {
  let celula = String(valor ?? '')
  if (/^[=+\-@\t\r]/.test(celula)) celula = `'${celula}`
  if (/[;"\r\n]/.test(celula)) celula = `"${celula.replace(/"/g, '""')}"`
  return celula
}

const CABECALHO = [
  'Ticker',
  'Empresa',
  'Quantidade',
  'Preço médio (R$)',
  'Preço atual (R$)',
  'Valor investido (R$)',
  'Valor atual (R$)',
  'Lucro/prejuízo (R$)',
  'Lucro/prejuízo (%)',
  'Situação',
]

// Monta o texto do CSV.
// - posicoes: ativos com os cálculos (já na ordem em que aparecem na tela)
// - resumo: totais da carteira (calcularResumo)
export function gerarCsv(posicoes, resumo) {
  const linhas = [CABECALHO.map(texto).join(SEPARADOR)]

  for (const p of posicoes) {
    linhas.push(
      [
        texto(p.ticker),
        texto(p.cotacao?.nome ?? ''),
        p.quantidade, // inteiro: não precisa de casas decimais
        numero(p.precoMedio),
        p.temCotacao ? numero(p.precoAtual) : '', // sem cotação: deixa vazio em vez de inventar um preço
        numero(p.valorInvestido),
        numero(p.valorAtual),
        numero(p.lucro),
        numero(p.lucroPercentual),
        texto(p.temCotacao ? 'Cotação atual' : 'Sem cotação (usando preço médio)'),
      ].join(SEPARADOR),
    )
  }

  // Última linha: totais (os mesmos números do resumo da tela)
  linhas.push(
    ['TOTAL', '', '', '', '', numero(resumo.valorInvestido), numero(resumo.valorAtual), numero(resumo.lucro), numero(resumo.lucroPercentual), '']
      .join(SEPARADOR),
  )

  return BOM_UTF8 + linhas.join(QUEBRA_DE_LINHA) + QUEBRA_DE_LINHA
}

// Nome do arquivo com a data de hoje no fuso de quem usa: vault-carteira-2026-10-24.csv
// (usamos getFullYear/getMonth/getDate, que são locais; toISOString seria UTC e podia mostrar o dia errado à noite)
export function nomeDoArquivoCsv(data = new Date()) {
  const dois = (n) => String(n).padStart(2, '0')
  return `vault-carteira-${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}.csv`
}

// Faz o navegador baixar um arquivo de texto.
// Truque padrão: cria um link <a download> apontando para um "arquivo virtual" (Blob) e clica nele.
export function baixarArquivoCsv(nomeArquivo, conteudo) {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Libera a memória do arquivo virtual (esperamos um instante para o download começar)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
