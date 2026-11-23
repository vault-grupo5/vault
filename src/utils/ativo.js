// Formato padrão de um ativo da carteira.
// Todas as partes do VAULT usam esse formato.
//
// {
//   id: string,         // identificador único, gerado automaticamente
//   ticker: string,     // código da ação, ex: "PETR4"
//   quantidade: number, // quantas ações a pessoa tem
//   precoMedio: number  // preço médio pago por ação, em R$
// }

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
