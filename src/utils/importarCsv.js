// Importação da carteira a partir de um CSV, no MESMO formato que o "Exportar CSV" gera
// (ver utils/exportarCsv.js): separador ";", vírgula decimal, primeira linha de cabeçalho,
// última linha "TOTAL". Só as colunas Ticker, Quantidade e Preço médio são lidas;
// as outras (empresa, valores calculados) são ignoradas, pois o app recalcula tudo.
//
// Função pura: recebe o TEXTO do arquivo e devolve { ativos, erros }.
// Se houver QUALQUER erro, nada é importado (tudo ou nada), para a carteira não ficar pela metade.

import { criarAtivo, FORMATO_TICKER } from './ativo.js'
import { lerNumero } from './formatacao.js'

export const MAX_ATIVOS_IMPORTACAO = 200

// Tira acento e maiúsculas, para achar "Preço médio (R$)" mesmo se o arquivo foi mexido no Excel
const normalizar = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

// Quebra o texto em linhas e colunas. Entende células entre aspas (podem ter ";" dentro e "" = uma aspa).
function lerLinhas(texto) {
  const linhas = []
  let linha = []
  let celula = ''
  let entreAspas = false

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (entreAspas) {
      if (c === '"' && texto[i + 1] === '"') {
        celula += '"'
        i++
      } else if (c === '"') {
        entreAspas = false
      } else {
        celula += c
      }
    } else if (c === '"') {
      entreAspas = true
    } else if (c === ';') {
      linha.push(celula)
      celula = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      linha.push(celula)
      linhas.push(linha)
      linha = []
      celula = ''
    } else {
      celula += c
    }
  }
  if (celula !== '' || linha.length > 0) {
    linha.push(celula)
    linhas.push(linha)
  }
  return linhas
}

export function lerCsvDaCarteira(texto) {
  const semBom = texto.replace(/^\uFEFF/, '')
  const linhas = lerLinhas(semBom)

  // Número de linha que a pessoa vê no Excel = posição + 1
  const ehVazia = (l) => l.every((c) => c.trim() === '')
  const primeira = linhas.findIndex((l) => !ehVazia(l))
  if (primeira === -1) return { ativos: [], erros: ['O arquivo está vazio.'] }

  // ---- Cabeçalho: descobre em que coluna está cada dado ----
  const nomes = linhas[primeira].map(normalizar)
  const colTicker = nomes.findIndex((n) => n.startsWith('ticker'))
  const colQuantidade = nomes.findIndex((n) => n.startsWith('quantidade'))
  const colPreco = nomes.findIndex((n) => n.startsWith('preco medio'))
  if (colTicker === -1 || colQuantidade === -1 || colPreco === -1) {
    return {
      ativos: [],
      erros: [
        'Cabeçalho não reconhecido. A primeira linha precisa ter as colunas "Ticker", "Quantidade" e "Preço médio (R$)", separadas por ponto e vírgula. Use um arquivo gerado pelo botão "Exportar CSV" do VAULT.',
      ],
    }
  }

  // ---- Linhas de dados ----
  const ativos = []
  const erros = []
  const vistos = new Set()

  for (let i = primeira + 1; i < linhas.length; i++) {
    const linha = linhas[i]
    if (ehVazia(linha)) continue

    const ticker = (linha[colTicker] ?? '').trim().toUpperCase()
    if (ticker === 'TOTAL') continue // última linha do arquivo exportado

    const onde = `Linha ${i + 1}`
    const quantidade = lerNumero(linha[colQuantidade] ?? '')
    const precoMedio = lerNumero(linha[colPreco] ?? '')
    const problemas = []

    if (!FORMATO_TICKER.test(ticker)) problemas.push(`ticker "${ticker}" inválido (use o formato da B3, ex: PETR4)`)
    else if (vistos.has(ticker)) problemas.push(`ticker ${ticker} repetido`)
    if (!Number.isInteger(quantidade) || quantidade <= 0) problemas.push('quantidade precisa ser um número inteiro maior que zero')
    if (!Number.isFinite(precoMedio) || precoMedio <= 0) problemas.push('preço médio precisa ser um número maior que zero (ex: 32,50)')

    if (problemas.length > 0) {
      erros.push(`${onde}: ${problemas.join('; ')}.`)
      continue
    }
    vistos.add(ticker)
    ativos.push(criarAtivo(ticker, quantidade, precoMedio))
  }

  if (erros.length === 0 && ativos.length === 0) erros.push('O arquivo não tem nenhum ativo.')
  if (ativos.length > MAX_ATIVOS_IMPORTACAO) {
    erros.push(`O arquivo tem ${ativos.length} ativos; o limite é ${MAX_ATIVOS_IMPORTACAO}.`)
  }

  return { ativos: erros.length > 0 ? [] : ativos, erros }
}
