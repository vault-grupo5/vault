// Distribuição da carteira para o gráfico de rosca: "por ativo" ou "por setor".
// Funções puras (sem React), testadas em alocacao.test.js.
//
// A cor de cada fatia segue a ORDEM em que o grupo aparece na carteira (ordem de cadastro),
// e não o tamanho. Assim, se um ativo passar outro em valor, as fatias trocam de lugar
// mas cada um continua com a sua cor.

export const MAXIMO_DE_FATIAS = 6 // temos 6 cores; a partir daí os menores viram "Outros"

// Um grupo por ativo, na ordem da carteira: [{ chave, rotulo, valor, detalhe }]
export function agruparPorAtivo(posicoes) {
  return posicoes.map((p) => ({ chave: p.ticker, rotulo: p.ticker, valor: p.valorAtual, detalhe: p.cotacao?.nome ?? '' }))
}

// Um grupo por setor, na ordem em que cada setor aparece pela primeira vez na carteira.
// - setorDe(ticker): função que devolve o nome do setor de um ticker
// O detalhe lista os tickers do setor (ex: "PETR4, PRIO3").
export function agruparPorSetor(posicoes, setorDe) {
  const grupos = new Map()
  for (const p of posicoes) {
    const setor = setorDe(p.ticker)
    if (!grupos.has(setor)) grupos.set(setor, { chave: setor, rotulo: setor, valor: 0, tickers: [] })
    const grupo = grupos.get(setor)
    grupo.valor += p.valorAtual
    grupo.tickers.push(p.ticker)
  }
  return [...grupos.values()].map(({ tickers, ...grupo }) => ({ ...grupo, detalhe: tickers.join(', ') }))
}

// Monta as fatias a partir dos grupos (que chegam na ordem da carteira):
// [{ chave, rotulo, valor, percentual, detalhe, indiceCor }]
// - do maior para o menor;
// - se houver mais grupos que MAXIMO_DE_FATIAS, ficam os 5 maiores e o resto vira "Outros (n)";
// - indiceCor (1 a 6) segue a ordem da carteira; "Outros" tem indiceCor = null (cinza).
export function montarFatias(grupos) {
  const total = grupos.reduce((soma, g) => soma + g.valor, 0)
  if (total <= 0) return []

  const ordemDaCarteira = grupos.map((g) => g.chave)
  const doMaiorParaOMenor = [...grupos].sort((a, b) => b.valor - a.valor)

  let principais = doMaiorParaOMenor
  let outros = null
  if (grupos.length > MAXIMO_DE_FATIAS) {
    principais = doMaiorParaOMenor.slice(0, MAXIMO_DE_FATIAS - 1)
    const resto = doMaiorParaOMenor.slice(MAXIMO_DE_FATIAS - 1)
    const valorResto = resto.reduce((soma, g) => soma + g.valor, 0)
    outros = {
      chave: 'outros',
      rotulo: `Outros (${resto.length})`,
      valor: valorResto,
      percentual: (valorResto / total) * 100,
      detalhe: resto.map((g) => g.rotulo).join(', '),
      indiceCor: null,
    }
  }

  // Cor = posição do grupo na carteira, contando só os que aparecem como fatia própria
  const chavesPrincipais = new Set(principais.map((g) => g.chave))
  const ordemDasCores = ordemDaCarteira.filter((c) => chavesPrincipais.has(c))

  const fatias = principais.map((g) => ({
    ...g,
    percentual: (g.valor / total) * 100,
    indiceCor: ordemDasCores.indexOf(g.chave) + 1,
  }))
  return outros ? [...fatias, outros] : fatias
}

// Ordem em que as fatias são DESENHADAS na rosca (a legenda continua do maior para o menor).
//
// Por quê: numa rosca, cada fatia encosta na vizinha, e a última encosta na primeira.
// Se as fatias fossem desenhadas do maior para o menor, QUALQUER par de cores poderia
// ficar lado a lado, e algumas (ex: rosa × verde, amarelo × laranja) ficam quase iguais
// para quem tem daltonismo. Testamos com o validador de paletas, nos dois temas, todas as
// quantidades de fatias: desenhar na ordem das cores (1, 2, 3...) passa em todos os casos,
// menos com 4 fatias — aí o azul (4) encostaria no roxo (1). Para 4, a ordem 1-2-4-3 passa.
// "Outros" (cinza) fica sempre no fim.
const ORDEM_ESPECIAL = { 4: [1, 2, 4, 3] }

export function ordenarParaDesenho(fatias) {
  const coloridas = fatias.filter((f) => f.indiceCor !== null).sort((a, b) => a.indiceCor - b.indiceCor)
  const outros = fatias.filter((f) => f.indiceCor === null)

  const especial = ORDEM_ESPECIAL[coloridas.length]
  const ordenadas = especial ? especial.map((indice) => coloridas.find((f) => f.indiceCor === indice)) : coloridas
  return [...ordenadas, ...outros]
}
