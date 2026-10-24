// Serviço de cotações da brapi (https://brapi.dev)
// Responsável por buscar o preço atual das ações da B3.
//
// Plano grátis: 1 ticker por requisição e cotações com atraso de ~30 min.
// Por isso usamos cache: se a cotação foi buscada há pouco tempo,
// devolvemos a que já temos em vez de gastar outra requisição.

const URL_BASE = 'https://brapi.dev/api/quote'
const TOKEN = import.meta.env.VITE_BRAPI_TOKEN
const TEMPO_CACHE_MS = 10 * 60 * 1000 // 10 minutos
const CHAVE_CACHE = 'vault:cotacoes'
const PAUSA_ENTRE_TICKERS_MS = 300 // respiro entre uma requisição e outra
const ESPERA_ANTES_DE_REPETIR_MS = 2000 // espera antes de repetir quando a API diz "limite atingido" (429)

// Devolve uma Promise que termina depois de "ms" milissegundos. Uso: await esperar(300)
function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms))
}

// ---------- Cache (guardado no localStorage) ----------

function lerCache() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_CACHE)) ?? {}
  } catch {
    return {}
  }
}

function salvarNoCache(ticker, cotacao) {
  try {
    const cache = lerCache()
    cache[ticker] = { cotacao, salvoEm: Date.now() }
    localStorage.setItem(CHAVE_CACHE, JSON.stringify(cache))
  } catch {
    // Se o navegador bloquear o localStorage, o app continua funcionando sem cache
  }
}

function buscarNoCache(ticker) {
  const item = lerCache()[ticker]
  if (!item) return null
  const expirou = Date.now() - item.salvoEm > TEMPO_CACHE_MS
  return expirou ? null : item.cotacao
}

// ---------- Busca na API ----------

// Busca a cotação de UM ticker. Ex: buscarCotacao('PETR4')
export async function buscarCotacao(ticker, { ignorarCache = false } = {}) {
  const codigo = ticker.trim().toUpperCase()

  if (!ignorarCache) {
    const emCache = buscarNoCache(codigo)
    if (emCache) return emCache
  }

  const url = new URL(`${URL_BASE}/${encodeURIComponent(codigo)}`)
  if (TOKEN) url.searchParams.set('token', TOKEN)

  let resposta
  try {
    resposta = await fetch(url)
    // 429 = "muitas requisições". Esperamos um pouco e tentamos de novo, uma única vez.
    // Se falhar de novo, o erro segue para a mensagem amigável lá embaixo.
    if (resposta.status === 429) {
      await esperar(ESPERA_ANTES_DE_REPETIR_MS)
      resposta = await fetch(url)
    }
  } catch {
    throw new Error('Sem conexão com a API. Verifique sua internet.')
  }

  const dados = await resposta.json().catch(() => ({}))

  if (!resposta.ok) {
    throw new Error(mensagemDeErro(resposta.status, codigo, dados))
  }

  const resultado = dados.results?.[0]
  if (!resultado) {
    throw new Error(`Ticker ${codigo} não encontrado.`)
  }

  // Transformamos a resposta da API num formato mais simples, em português
  const cotacao = {
    ticker: resultado.symbol,
    nome: resultado.longName ?? resultado.shortName ?? resultado.symbol,
    preco: resultado.regularMarketPrice,
    variacaoDia: resultado.regularMarketChangePercent,
    atualizadoEm: resultado.regularMarketTime,
    logo: resultado.logourl,
  }

  salvarNoCache(codigo, cotacao)
  return cotacao
}

// Busca vários tickers (uma requisição por ticker, por causa do plano grátis).
// Busca UM DE CADA VEZ, com uma pausa curta entre eles: pedir todos ao mesmo
// tempo fazia a brapi responder "limite de requisições" (429) para alguns.
// Se um falhar, os outros continuam: o resultado traz { cotacoes, erros }.
export async function buscarCotacoes(tickers, opcoes) {
  const unicos = [...new Set(tickers.map((t) => t.trim().toUpperCase()))]

  const cotacoes = {}
  const erros = {}
  for (const [indice, ticker] of unicos.entries()) {
    // Pausa só antes de uma requisição de verdade (se vem do cache, não precisa esperar)
    const vaiNaApi = opcoes?.ignorarCache || !buscarNoCache(ticker)
    if (indice > 0 && vaiNaApi) await esperar(PAUSA_ENTRE_TICKERS_MS)

    try {
      cotacoes[ticker] = await buscarCotacao(ticker, opcoes)
    } catch (erro) {
      erros[ticker] = erro.message
    }
  }
  return { cotacoes, erros }
}

// Traduz o código de erro HTTP numa mensagem amigável pro usuário
function mensagemDeErro(status, ticker, dados) {
  if (status === 404 || status === 400) return `Ticker ${ticker} não encontrado.`
  if (status === 401 || status === 403) return 'Token da API inválido ou sem permissão para este ativo.'
  if (status === 429) return 'Limite de requisições da API atingido. Tente mais tarde.'
  return dados.message ?? 'Erro ao buscar cotação. Tente novamente.'
}