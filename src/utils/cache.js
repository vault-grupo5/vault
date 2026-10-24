// Cache simples com prazo de validade, guardado no localStorage.
// Usado pelo histórico de preços e pela busca de ações: são dados que a API
// cobra por requisição (plano grátis: 15.000 por mês), então reaproveitamos
// o que já buscamos em vez de pedir de novo.
//
// Estrutura guardada: { "PETR4": { valor: ..., salvoEm: 1700000000000 }, ... }
// Cada "namespace" (ex: "vault:historicos") é uma chave separada do localStorage.

function lerTudo(namespace) {
  try {
    return JSON.parse(localStorage.getItem(namespace)) ?? {}
  } catch {
    return {}
  }
}

// Devolve o valor guardado, ou null se não existe ou já passou do prazo (ttlMs)
export function lerDoCache(namespace, chave, ttlMs) {
  const item = lerTudo(namespace)[chave]
  if (!item) return null
  return Date.now() - item.salvoEm > ttlMs ? null : item.valor
}

// Guarda um valor. Se o cache passar de "maximo" itens, apaga os mais antigos
// (senão o localStorage, que tem ~5 MB, poderia encher com o tempo).
export function salvarNoCache(namespace, chave, valor, maximo = 50) {
  try {
    const tudo = lerTudo(namespace)
    tudo[chave] = { valor, salvoEm: Date.now() }

    const chaves = Object.keys(tudo)
    if (chaves.length > maximo) {
      chaves
        .sort((a, b) => tudo[a].salvoEm - tudo[b].salvoEm) // mais antigos primeiro
        .slice(0, chaves.length - maximo)
        .forEach((antiga) => delete tudo[antiga])
    }

    localStorage.setItem(namespace, JSON.stringify(tudo))
  } catch {
    // Se o navegador bloquear o localStorage, o app continua funcionando sem cache
  }
}
