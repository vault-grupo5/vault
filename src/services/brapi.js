// Serviço de cotações da brapi (https://brapi.dev)
// Responsável por buscar o preço atual das ações da B3.
//
// Plano grátis: 1 ticker por requisição e cotações com atraso de ~30 min.
// Por isso usamos cache: se a cotação foi buscada há pouco tempo,
// devolvemos a que já temos em vez de gastar outra requisição.

import { lerDoCache, salvarNoCache as salvarGenerico } from '../utils/cache.js'

const URL_BASE = 'https://brapi.dev/api/quote'
const TOKEN = import.meta.env.VITE_BRAPI_TOKEN
const TEMPO_CACHE_MS = 10 * 60 * 1000 // 10 minutos
const CHAVE_CACHE = 'vault:cotacoes'
const CHAVE_HISTORICOS = 'vault:historicos'
const TEMPO_CACHE_HISTORICO_MS = 60 * 60 * 1000 // 1 hora: são candles diários, mudam pouco
const CHAVE_BUSCAS = 'vault:buscas'
const TEMPO_CACHE_BUSCA_MS = 24 * 60 * 60 * 1000 // 24 horas: a lista de ações quase não muda
const CHAVE_SETORES = 'vault:setores'
const TEMPO_CACHE_SETOR_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias
const PAUSA_ENTRE_TICKERS_MS = 300 // respiro entre uma requisição e outra
const ESPERA_ANTES_DE_REPETIR_MS = 2000 // espera antes de repetir quando a API diz "limite atingido" (429)

// Devolve uma Promise que termina depois de "ms" milissegundos. Uso: await esperar(300)
function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms))
}

// ---------- Fila de requisições ----------
// O plano grátis da brapi aceita só 1 requisição ao MESMO tempo: se duas chegam juntas,
// uma recebe erro 429 mesmo com cota sobrando. Como o app faz vários tipos de busca
// (cotações, histórico, sugestões), todas passam por esta fila e rodam uma após a outra.
let fila = Promise.resolve()

function enfileirar(tarefa) {
  const resultado = fila.then(tarefa)
  // Se uma tarefa der erro, a fila continua andando para as próximas
  fila = resultado.catch(() => {})
  return resultado
}

// Faz a requisição (dentro da fila) e devolve o JSON da resposta.
// Se vier 429, espera um pouco e tenta de novo, uma única vez.
// Em caso de erro, lança um Error com mensagem amigável e o código HTTP em erro.status.
//
// "signal" (opcional) permite cancelar: se a pessoa já digitou outra coisa, a busca antiga
// que ainda espera na fila nem chega a ser enviada (não gasta requisição).
function pedirJson(url, codigo, signal) {
  return enfileirar(async () => {
    if (signal?.aborted) throw new DOMException('Busca cancelada', 'AbortError')

    let resposta
    try {
      resposta = await fetch(url, { signal })
      if (resposta.status === 429) {
        await esperar(ESPERA_ANTES_DE_REPETIR_MS)
        resposta = await fetch(url, { signal })
      }
    } catch (erro) {
      if (erro.name === 'AbortError') throw erro // cancelamento não é "sem internet"
      throw new Error('Sem conexão com a API. Verifique sua internet.')
    }

    const dados = await resposta.json().catch(() => ({}))
    if (!resposta.ok) {
      const erro = new Error(mensagemDeErro(resposta.status, codigo, dados))
      erro.status = resposta.status
      throw erro
    }
    return dados
  })
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

  const dados = await pedirJson(url, codigo)

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

// Busca o histórico de preços dos últimos 3 meses (o máximo do plano grátis), um ponto por dia.
// Devolve uma lista do mais antigo para o mais novo: [{ data: 1785121200000, fechamento: 41.01 }]
// - data vem em milissegundos (a API manda em segundos; convertemos para o JavaScript entender)
// - cache de 1 hora: abrir o mesmo ativo de novo não gasta requisição
export async function buscarHistorico(ticker, { ignorarCache = false } = {}) {
  const codigo = ticker.trim().toUpperCase()

  if (!ignorarCache) {
    const emCache = lerDoCache(CHAVE_HISTORICOS, codigo, TEMPO_CACHE_HISTORICO_MS)
    if (emCache) return emCache
  }

  const url = new URL(`${URL_BASE}/${encodeURIComponent(codigo)}`)
  url.searchParams.set('range', '3mo')
  url.searchParams.set('interval', '1d')
  if (TOKEN) url.searchParams.set('token', TOKEN)

  let dados
  try {
    dados = await pedirJson(url, codigo)
  } catch (erro) {
    // 400/403 aqui significa que o plano não permite histórico deste ativo
    if (erro.status === 400 || erro.status === 403) {
      throw new Error(`Histórico de ${codigo} indisponível no plano atual.`, { cause: erro })
    }
    throw erro
  }

  const pontos = dados.results?.[0]?.historicalDataPrice ?? []
  const historico = pontos
    .filter((p) => typeof p.close === 'number') // alguns dias podem vir sem preço
    .map((p) => ({ data: p.date * 1000, fechamento: p.close }))
    .sort((a, b) => a.data - b.data)

  if (historico.length === 0) {
    throw new Error(`Sem histórico de preços para ${codigo}.`)
  }

  salvarGenerico(CHAVE_HISTORICOS, codigo, historico)
  return historico
}

// Busca ações pelo código ou pelo nome (ex: "petro", "magazine", "ITUB") para as sugestões do formulário.
// Devolve [{ ticker, nome, logo }]. O resultado fica 24 h no cache: quem digita a mesma coisa
// de novo não gasta requisição.
// - signal: AbortController.signal para cancelar quando a pessoa continua digitando
export async function buscarSugestoes(termo, { signal } = {}) {
  const busca = termo.trim().toUpperCase()

  const emCache = lerDoCache(CHAVE_BUSCAS, busca, TEMPO_CACHE_BUSCA_MS)
  if (emCache) return emCache // lista vazia também vale: "nada encontrado" é um resultado

  const url = new URL(`${URL_BASE}/list`)
  url.searchParams.set('search', busca)
  url.searchParams.set('limit', '8')
  if (TOKEN) url.searchParams.set('token', TOKEN)

  const dados = await pedirJson(url, busca, signal)

  const sugestoes = (dados.stocks ?? []).map((acao) => ({
    ticker: acao.stock,
    nome: acao.name,
    logo: acao.logo,
  }))

  salvarGenerico(CHAVE_BUSCAS, busca, sugestoes, 40)
  return sugestoes
}

// Busca o setor de um ativo (para a distribuição "por setor").
// Usa a mesma lista de ações das sugestões (/quote/list), que traz o setor no plano grátis.
// Devolve { setor, tipo }:
//   setor: em inglês, como a brapi manda (ex: "Finance", "Energy Minerals") ou null
//   tipo:  "stock" (ação), "fund" (FII/ETF) ou "bdr"; null se o ticker não foi encontrado
// Cache de 30 dias: o setor de uma empresa quase nunca muda.
export async function buscarSetor(ticker) {
  const codigo = ticker.trim().toUpperCase()

  const emCache = lerDoCache(CHAVE_SETORES, codigo, TEMPO_CACHE_SETOR_MS)
  if (emCache) return emCache

  const url = new URL(`${URL_BASE}/list`)
  url.searchParams.set('search', codigo)
  url.searchParams.set('limit', '10')
  if (TOKEN) url.searchParams.set('token', TOKEN)

  const dados = await pedirJson(url, codigo)
  // A busca também traz parecidos (ex: PETR4F); pegamos só o ticker exato
  const acao = (dados.stocks ?? []).find((a) => a.stock === codigo)
  const resultado = { setor: acao?.sector ?? null, tipo: acao?.type ?? null }

  salvarGenerico(CHAVE_SETORES, codigo, resultado, 200)
  return resultado
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