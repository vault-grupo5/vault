// Formato padrão de um ativo da carteira.
// Todas as partes do VAULT usam esse formato.
//
// {
//   id: string,         // identificador único, gerado automaticamente
//   ticker: string,     // código da ação, ex: "PETR4"
//   quantidade: number, // quantas ações a pessoa tem
//   precoMedio: number  // preço médio pago por ação, em R$
// }

// ---------- Limites dos valores digitados ----------
// Sem limite, "99999999999999999999" vira 1e20 (o JavaScript perde precisão acima de ~9 quadrilhões)
// e os valores em R$ ficam gigantes demais para caber na tela. Estes limites valem no formulário,
// na edição da lista e na importação de CSV.
export const QUANTIDADE_MAXIMA = 10_000_000
export const PRECO_MEDIO_MINIMO = 0.01
export const PRECO_MEDIO_MAXIMO = 1_000_000

// Cada função devolve o texto do erro, ou '' se o valor é válido. Recebem o número já lido (lerNumero).
export function erroDeQuantidade(quantidade) {
  if (!Number.isInteger(quantidade) || quantidade < 1) return 'Informe uma quantidade inteira maior que zero.'
  if (quantidade > QUANTIDADE_MAXIMA) return 'A quantidade máxima é 10.000.000.'
  return ''
}

export function erroDePrecoMedio(precoMedio) {
  if (!Number.isFinite(precoMedio) || precoMedio <= 0) return 'Informe um preço médio maior que zero (ex: 32,50).'
  if (precoMedio < PRECO_MEDIO_MINIMO) return 'O preço médio mínimo é R$ 0,01.'
  if (precoMedio > PRECO_MEDIO_MAXIMO) return 'O preço médio máximo é R$ 1.000.000,00.'
  return ''
}

export function criarAtivo(ticker, quantidade, precoMedio) {
  return {
    id: crypto.randomUUID(),
    ticker: ticker.trim().toUpperCase(),
    quantidade: Number(quantidade),
    precoMedio: Number(precoMedio),
  }
}

// Formato de ticker da B3: 4 letras + 1 ou 2 números (+ "F" do mercado fracionário).
// Ex: PETR4, VALE3, TAEE11, BOVA11, PETR4F. Usado no formulário e na importação de CSV.
export const FORMATO_TICKER = /^[A-Z]{4}\d{1,2}F?$/
