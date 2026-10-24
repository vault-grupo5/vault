import { useEffect, useMemo, useState } from 'react'
import { buscarSugestoes } from '../services/brapi.js'
import { filtrarAcoesLocais } from '../utils/acoesB3.js'

const ATRASO_DEBOUNCE_MS = 400 // espera a pessoa parar de digitar antes de consultar a API
const MINIMO_PARA_API = 2 // com 1 letra só, a busca na API traria resultados demais
const LOCAL_SUFICIENTE = 5 // se a lista local já achou isso tudo, nem precisamos da API

// Junta duas listas sem repetir ticker, mantendo a ordem (a primeira lista tem prioridade)
function mesclar(primeira, segunda) {
  const jaTem = new Set(primeira.map((s) => s.ticker))
  return [...primeira, ...segunda.filter((s) => !jaTem.has(s.ticker))]
}

// Hook que devolve as sugestões de ações para o texto digitado no campo de ticker.
//
// Como funciona (em duas camadas):
//  1. Lista LOCAL: responde na hora, a cada tecla, sem custo.
//  2. API da brapi: só quando a lista local achou poucas opções, e com DEBOUNCE
//     (esperamos 400 ms sem digitar). Sem o debounce, digitar "petrobras" faria
//     9 requisições; com ele, faz 1. Os resultados ficam em cache por 24 h.
//
// Devolve: { sugestoes: [{ ticker, nome, logo }], buscando: boolean }
export function useSugestoes(texto) {
  const termo = texto.trim().toUpperCase()

  // Resultado instantâneo da lista local
  const locais = useMemo(() => filtrarAcoesLocais(termo), [termo])
  const precisaDaApi = termo.length >= MINIMO_PARA_API && locais.length < LOCAL_SUFICIENTE

  // termoParaApi = o termo "assentado" (já passou o debounce)
  const [termoParaApi, setTermoParaApi] = useState('')
  const [respostaApi, setRespostaApi] = useState({ termo: '', itens: [], falhou: false })

  // Debounce: só atualiza termoParaApi se a pessoa ficar 400 ms sem digitar.
  // Cada tecla nova cancela o timer anterior (função de limpeza do useEffect).
  useEffect(() => {
    if (!precisaDaApi) return
    const timer = setTimeout(() => setTermoParaApi(termo), ATRASO_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [termo, precisaDaApi])

  // Consulta a API quando o termo assentado muda
  useEffect(() => {
    if (!termoParaApi) return
    const controle = new AbortController() // permite cancelar se a pessoa digitar outra coisa

    buscarSugestoes(termoParaApi, { signal: controle.signal })
      .then((itens) => setRespostaApi({ termo: termoParaApi, itens, falhou: false }))
      .catch((erro) => {
        if (erro.name === 'AbortError') return // cancelada de propósito: não é erro
        // Qualquer falha (sem internet, sem token, limite...) cai para a lista local
        setRespostaApi({ termo: termoParaApi, itens: [], falhou: true })
      })

    return () => controle.abort()
  }, [termoParaApi])

  // A resposta da API só vale se for para o que está digitado AGORA
  const apiRespondeu = respostaApi.termo === termo
  // Se a API não achou nada (ou falhou), mantemos o que a lista local encontrou
  const usarApi = precisaDaApi && apiRespondeu && !respostaApi.falhou && respostaApi.itens.length > 0

  return {
    // Mesclamos: primeiro as locais (as mais negociadas), depois as da API que ainda não apareceram.
    // As da API trazem também o logo e as ações menos conhecidas.
    sugestoes: usarApi ? mesclar(locais, respostaApi.itens) : locais,
    // "Buscando" = precisa da API e a resposta ainda não chegou (digitando ou a caminho)
    buscando: precisaDaApi && !apiRespondeu,
  }
}
