// Evolução do patrimônio: quanto a carteira valeria em cada dia dos últimos 3 meses.
// São funções "puras" (só recebem dados e devolvem resultados), testadas em evolucao.test.js.
//
// IMPORTANTE: usamos a quantidade ATUAL de cada ativo em todos os dias. O VAULT não guarda
// o histórico de compras e vendas, então a conta responde à pergunta
// "quanto valeriam, em cada dia, os ativos que tenho hoje?".
//
// Formatos:
//   ativos     = [{ ticker, quantidade, ... }]
//   historicos = { PETR4: [{ data, fechamento }], VALE3: [...] }   (data em milissegundos)

// Chave do dia ("2026-07-28") para juntar os preços de ativos diferentes no mesmo dia.
// A brapi marca cada dia à meia-noite de Brasília (03:00 em UTC), então a data em UTC
// já é o dia certo.
function chaveDoDia(ms) {
  return new Date(ms).toISOString().slice(0, 10)
}

// Calcula a série [{ data, valor }] do patrimônio, do dia mais antigo para o mais novo.
// Devolve também quais tickers ficaram de fora por não terem histórico.
export function calcularEvolucao(ativos, historicos) {
  // Soma a quantidade por ticker (por segurança, caso o mesmo ticker apareça duas vezes)
  const quantidades = {}
  for (const ativo of ativos) {
    quantidades[ativo.ticker] = (quantidades[ativo.ticker] ?? 0) + ativo.quantidade
  }

  const tickers = Object.keys(quantidades)
  const comHistorico = tickers.filter((t) => historicos[t]?.length > 0)
  const semHistorico = tickers.filter((t) => !(historicos[t]?.length > 0))

  if (comHistorico.length === 0) return { pontos: [], semHistorico }

  // Preço de fechamento de cada ticker por dia: { PETR4: { '2026-07-28': 41.01, ... } }
  const precoPorDia = {}
  const todosOsDias = new Map() // chave do dia → data em ms (para o eixo do gráfico)
  for (const ticker of comHistorico) {
    precoPorDia[ticker] = {}
    for (const ponto of historicos[ticker]) {
      const dia = chaveDoDia(ponto.data)
      precoPorDia[ticker][dia] = ponto.fechamento
      if (!todosOsDias.has(dia)) todosOsDias.set(dia, ponto.data)
    }
  }

  // A série começa no primeiro dia em que TODOS os ativos já têm preço.
  // Se um ativo só tem histórico a partir de certa data, começar antes faria o gráfico
  // dar um "salto" falso no dia em que ele entra na conta.
  const inicio = comHistorico
    .map((t) => chaveDoDia(historicos[t][0].data))
    .sort()
    .at(-1)

  const dias = [...todosOsDias.keys()].filter((dia) => dia >= inicio).sort()

  // Para cada dia, soma quantidade × preço. Se um ativo não teve preço num dia (ex: sem negócio),
  // usamos o último preço conhecido dele ("carrega o anterior para frente").
  const ultimoPreco = {}
  const pontos = dias.map((dia) => {
    let valor = 0
    for (const ticker of comHistorico) {
      const preco = precoPorDia[ticker][dia]
      if (preco !== undefined) ultimoPreco[ticker] = preco
      valor += quantidades[ticker] * (ultimoPreco[ticker] ?? 0)
    }
    return { data: todosOsDias.get(dia), valor }
  })

  return { pontos, semHistorico }
}

// Variação em % entre o primeiro e o último ponto de uma série [{ valor }].
// Ex: de 1000 para 1100 → 10 (por cento). Série vazia ou começando em 0 → 0.
export function variacaoDoPeriodo(pontos) {
  if (pontos.length < 2 || pontos[0].valor === 0) return 0
  return (pontos.at(-1).valor / pontos[0].valor - 1) * 100
}
