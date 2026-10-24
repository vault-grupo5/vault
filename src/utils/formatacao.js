// Funções de formatação de números para o padrão brasileiro.
// Usamos o Intl.NumberFormat, que já vem no navegador e sabe
// colocar "R$", ponto no milhar e vírgula nos centavos.

// Criamos os formatadores uma vez só (criar de novo a cada chamada é mais lento)
const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const formatadorPorcentagem = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatadorQuantidade = new Intl.NumberFormat('pt-BR')

// 1234.5 → "R$ 1.234,50"
export function formatarMoeda(valor) {
  return formatadorMoeda.format(valor ?? 0)
}

// Separa a parte inteira dos centavos, para mostrar os centavos "apagados".
// 1234.5 → { inteiro: "R$ 1.234", centavos: ",50" }
export function separarCentavos(valor) {
  const texto = formatarMoeda(valor)
  const posicaoVirgula = texto.lastIndexOf(',')
  return {
    inteiro: texto.slice(0, posicaoVirgula),
    centavos: texto.slice(posicaoVirgula),
  }
}

// 2.345 → "+2,35%" e -1.2 → "−1,20%"
// O sinal de mais deixa claro que é ganho; o de menos é o "−" tipográfico (mais legível)
export function formatarPorcentagem(valor) {
  const numero = valor ?? 0
  const sinal = numero > 0 ? '+' : numero < 0 ? '−' : ''
  return `${sinal}${formatadorPorcentagem.format(Math.abs(numero))}%`
}

// Igual à moeda, mas com sinal na frente: "+R$ 120,00" ou "−R$ 35,10"
export function formatarMoedaComSinal(valor) {
  const numero = valor ?? 0
  const sinal = numero > 0 ? '+' : numero < 0 ? '−' : ''
  return `${sinal}${formatarMoeda(Math.abs(numero))}`
}

// 1500 → "1.500"
export function formatarQuantidade(valor) {
  return formatadorQuantidade.format(valor ?? 0)
}

// Diz se um valor é ganho, perda ou neutro.
// O resultado vira a classe CSS da pílula: "pilula--ganho", "pilula--perda"...
export function tipoVariacao(valor) {
  if (valor > 0) return 'ganho'
  if (valor < 0) return 'perda'
  return 'neutro'
}

// A brapi manda o horário da cotação como texto ISO ("2026-10-23T17:07:00.000Z").
// Convertemos para "14:07" no fuso de quem está usando o site.
export function formatarHorario(dataIso) {
  if (!dataIso) return ''
  const data = new Date(dataIso)
  if (Number.isNaN(data.getTime())) return ''
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Lê um número digitado pela pessoa, aceitando vírgula ou ponto.
// "1.234,56" → 1234.56   |   "12,5" → 12.5   |   "abc" → NaN
export function lerNumero(texto) {
  const limpo = String(texto).trim().replace(/\s/g, '')
  if (limpo === '') return NaN
  // Se tem vírgula, é o padrão brasileiro: tira os pontos de milhar e troca a vírgula por ponto
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  return Number(normalizado)
}
