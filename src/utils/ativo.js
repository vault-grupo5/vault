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