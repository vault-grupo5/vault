// Cálculos da carteira: valor investido, valor atual e lucro/prejuízo.
// São funções "puras": recebem dados e devolvem resultados, sem mexer em nada fora delas.
// Isso deixa fácil de testar e de explicar.
//
// Lembrete do formato:
//   ativo   = { id, ticker, quantidade, precoMedio }
//   cotacao = { ticker, nome, preco, variacaoDia, atualizadoEm, logo }  (vem da brapi)

// Calcula os números de UM ativo.
// Se ainda não temos a cotação, usamos o preço médio como valor atual
// (lucro zero) e marcamos temCotacao = false para a tela avisar.
export function calcularPosicao(ativo, cotacao) {
  const valorInvestido = ativo.quantidade * ativo.precoMedio
  const temCotacao = typeof cotacao?.preco === 'number'
  const precoAtual = temCotacao ? cotacao.preco : ativo.precoMedio
  const valorAtual = ativo.quantidade * precoAtual
  const lucro = valorAtual - valorInvestido
  // Porcentagem: quanto o lucro representa do que foi investido
  const lucroPercentual = valorInvestido > 0 ? (lucro / valorInvestido) * 100 : 0

  return {
    ...ativo,
    cotacao,
    temCotacao,
    precoAtual,
    valorInvestido,
    valorAtual,
    lucro,
    lucroPercentual,
  }
}

// Calcula a posição de todos os ativos.
// cotacoes é um objeto { PETR4: {...}, VALE3: {...} }
export function calcularPosicoes(ativos, cotacoes) {
  return ativos.map((ativo) => calcularPosicao(ativo, cotacoes[ativo.ticker]))
}

// Soma tudo para o resumo geral da carteira.
export function calcularResumo(posicoes) {
  let valorInvestido = 0
  let valorAtual = 0
  let variacaoDia = 0 // quanto a carteira ganhou/perdeu hoje, em R$

  for (const posicao of posicoes) {
    valorInvestido += posicao.valorInvestido
    valorAtual += posicao.valorAtual

    // A brapi dá a variação do dia em %. Para achar quanto isso é em R$:
    // se hoje vale V e subiu p%, ontem valia V / (1 + p/100). A diferença é o ganho do dia.
    const percentualDia = posicao.cotacao?.variacaoDia
    if (posicao.temCotacao && typeof percentualDia === 'number') {
      variacaoDia += posicao.valorAtual - posicao.valorAtual / (1 + percentualDia / 100)
    }
  }

  const lucro = valorAtual - valorInvestido
  const valorOntem = valorAtual - variacaoDia

  return {
    quantidadeAtivos: posicoes.length,
    valorInvestido,
    valorAtual,
    lucro,
    lucroPercentual: valorInvestido > 0 ? (lucro / valorInvestido) * 100 : 0,
    variacaoDia,
    variacaoDiaPercentual: valorOntem > 0 ? (variacaoDia / valorOntem) * 100 : 0,
    // Quantos ativos ainda estão sem cotação (para avisar que o total é aproximado)
    semCotacao: posicoes.filter((p) => !p.temCotacao).length,
  }
}

// Quanto cada ativo representa do total (usado no gráfico de pizza).
// Devolve do maior para o menor: [{ ticker, valor, percentual }]
export function calcularDistribuicao(posicoes) {
  const total = posicoes.reduce((soma, p) => soma + p.valorAtual, 0)
  if (total <= 0) return []

  return posicoes
    .map((p) => ({
      ticker: p.ticker,
      valor: p.valorAtual,
      percentual: (p.valorAtual / total) * 100,
    }))
    .sort((a, b) => b.valor - a.valor)
}
