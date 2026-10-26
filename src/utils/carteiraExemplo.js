// Carteira de demonstração: deixa quem abre o VAULT pela primeira vez ver tudo funcionando
// (resumo, gráficos, análises) sem precisar cadastrar nada.
//
// Os TICKERS são reais, para as cotações virem de verdade da brapi.
// As QUANTIDADES e os PREÇOS MÉDIOS são inventados (escolhidos para ter ativos no lucro e no prejuízo).
//
// Como sabemos que um ativo é de exemplo: o id começa com "exemplo-". Isso não precisa de
// nenhuma informação extra guardada, e permite apagar só os ativos de exemplo,
// mantendo qualquer ativo real que a pessoa tenha cadastrado depois.

const PREFIXO_EXEMPLO = 'exemplo-'

const ATIVOS_EXEMPLO = [
  { ticker: 'PETR4', quantidade: 200, precoMedio: 38.4 },
  { ticker: 'VALE3', quantidade: 60, precoMedio: 70.2 },
  { ticker: 'ITUB4', quantidade: 150, precoMedio: 33.9 },
  { ticker: 'MGLU3', quantidade: 400, precoMedio: 9.8 },
  { ticker: 'WEGE3', quantidade: 50, precoMedio: 39.6 },
  { ticker: 'HGLG11', quantidade: 20, precoMedio: 158 },
]

// Devolve os ativos de exemplo no formato padrão { id, ticker, quantidade, precoMedio }
export function criarCarteiraExemplo() {
  return ATIVOS_EXEMPLO.map((ativo, indice) => ({ id: `${PREFIXO_EXEMPLO}${indice + 1}`, ...ativo }))
}

// true se o ativo faz parte da carteira de exemplo
export function ehExemplo(ativo) {
  return ativo.id.startsWith(PREFIXO_EXEMPLO)
}
