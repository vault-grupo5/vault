import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAtualizacaoAutomatica } from './useAtualizacaoAutomatica.js'
import { carregarCarteira, salvarCarteira } from '../utils/storage.js'
import { calcularPosicoes, calcularResumo } from '../utils/calculos.js'
import { carregarOrdenacao, ordenarPosicoes, salvarOrdenacao } from '../utils/ordenacao.js'
import { baixarArquivoCsv, gerarCsv, nomeDoArquivoCsv } from '../utils/exportarCsv.js'
import { buscarCotacoes } from '../services/brapi.js'

// De quanto em quanto tempo as cotações são atualizadas sozinhas.
// A brapi grátis tem ~30 min de atraso e o cache dura 10 min, então 10 min basta.
// Custo: com 5 ativos são 30 requisições por hora (o plano grátis permite 15.000 por mês).
export const INTERVALO_ATUALIZACAO_MS = 10 * 60 * 1000

// Hook com TODO o estado da carteira: ativos, cotações, avisos, ordenação e as ações
// (adicionar, editar, remover, exportar...).
//
// Por que um hook: o site tem 3 páginas (Visão geral, Meus ativos, Análises) que usam os
// mesmos dados. O App chama useCarteira() uma única vez e passa o resultado para as páginas.
// Assim existe UMA cópia dos dados e UMA busca de cotações, não importa a página aberta.
export function useCarteira() {
  // ---------- Estado ----------

  // Lista de ativos. Passamos uma FUNÇÃO para o useState: assim o
  // localStorage só é lido uma vez, quando o app abre (e não a cada render).
  const [ativos, setAtivos] = useState(carregarCarteira)

  // Cotações da brapi, no formato { PETR4: {...}, VALE3: {...} }
  const [cotacoes, setCotacoes] = useState({})
  // Erros por ticker, no formato { XPTO3: 'Ticker XPTO3 não encontrado.' }
  const [errosCotacao, setErrosCotacao] = useState({})
  // Começa "carregando" se já há ativos salvos: a busca vai começar logo em seguida
  const [carregando, setCarregando] = useState(ativos.length > 0)
  // Quando as cotações foram buscadas pela última vez (ms). Serve de base para a atualização automática.
  const [ultimaBusca, setUltimaBusca] = useState(null)
  // Aviso flutuante mostrado após cadastrar, editar ou remover: { id, texto, tipo }
  const [aviso, setAviso] = useState(null)
  // Critério de ordenação da lista (lembrado entre visitas)
  const [ordem, setOrdem] = useState(carregarOrdenacao)

  // Toda vez que a lista de ativos muda, salvamos no navegador
  useEffect(() => {
    salvarCarteira(ativos)
  }, [ativos])

  // ---------- Cotações ----------

  // Os tickers da carteira em ordem, juntos num texto (ex: "PETR4,VALE3").
  // Usamos texto porque o useEffect compara dependências com ===,
  // e um texto igual não dispara a busca de novo à toa (um array novo dispararia).
  const chaveTickers = useMemo(() => [...new Set(ativos.map((a) => a.ticker))].sort().join(','), [ativos])

  // Conta as buscas: se uma busca antiga terminar depois de uma nova,
  // ignoramos o resultado antigo (evita mostrar dado velho)
  const numeroDaBusca = useRef(0)

  // useCallback: mantém a mesma função entre renders, para poder usá-la no useEffect
  const atualizarCotacoes = useCallback(
    async ({ ignorarCache = false } = {}) => {
      const tickers = chaveTickers ? chaveTickers.split(',') : []
      if (tickers.length === 0) return

      const minhaBusca = ++numeroDaBusca.current
      setCarregando(true)
      const { cotacoes: novas, erros } = await buscarCotacoes(tickers, { ignorarCache })
      if (minhaBusca !== numeroDaBusca.current) return // chegou uma busca mais nova

      // Juntamos com as cotações que já tínhamos (se uma falhar agora, mantemos a anterior)
      setCotacoes((atuais) => ({ ...atuais, ...novas }))
      setErrosCotacao(erros)
      setCarregando(false)
      setUltimaBusca(Date.now())
    },
    [chaveTickers],
  )

  // Busca as cotações quando o app abre e quando os tickers mudam
  useEffect(() => {
    // Buscar dados de uma API externa é exatamente o uso certo de um useEffect,
    // por isso desligamos aqui o aviso do linter sobre setState dentro do effect.
    // oxlint-disable-next-line react/set-state-in-effect
    atualizarCotacoes()
  }, [atualizarCotacoes])

  // Atualização automática: a cada INTERVALO_ATUALIZACAO_MS, respeitando o cache e
  // pausando enquanto a aba está escondida (ver utils/agendador.js)
  useAtualizacaoAutomatica({
    aoAtualizar: atualizarCotacoes,
    ultimaBusca,
    intervaloMs: INTERVALO_ATUALIZACAO_MS,
  })

  // ---------- Avisos ----------

  // Mostra um aviso novo. O id (contador) faz o Aviso reiniciar a contagem de tempo
  // mesmo que o texto seja igual ao anterior.
  const mostrarAviso = useCallback((texto, tipo) => {
    setAviso((anterior) => ({ id: (anterior?.id ?? 0) + 1, texto, tipo }))
  }, [])

  // useCallback: a função fica a mesma entre renders, senão o timer do Aviso reiniciaria à toa
  const fecharAviso = useCallback(() => setAviso(null), [])

  // ---------- Ações sobre a carteira ----------
  // Sempre criamos uma NOVA lista (nunca alteramos a antiga),
  // porque é assim que o React percebe que algo mudou e redesenha a tela.

  // O formulário já buscou a cotação para validar o ticker, então aproveitamos ela
  function adicionarAtivo(novoAtivo, cotacao) {
    setAtivos((atuais) => [...atuais, novoAtivo])
    if (cotacao) setCotacoes((atuais) => ({ ...atuais, [novoAtivo.ticker]: cotacao }))
    mostrarAviso(`${novoAtivo.ticker} adicionado à carteira`, 'sucesso')
  }

  // mudancas: só os campos que mudaram, ex { quantidade: 200 }
  function editarAtivo(id, mudancas) {
    const ativo = ativos.find((a) => a.id === id)
    setAtivos((atuais) => atuais.map((a) => (a.id === id ? { ...a, ...mudancas } : a)))
    if (ativo) mostrarAviso(`${ativo.ticker} atualizado`, 'sucesso')
  }

  function removerAtivo(id) {
    const ativo = ativos.find((a) => a.id === id)
    setAtivos((atuais) => atuais.filter((a) => a.id !== id))
    if (ativo) mostrarAviso(`${ativo.ticker} removido da carteira`, 'remocao')
  }

  // ---------- Valores calculados ----------
  // useMemo: só recalcula quando os ativos ou as cotações mudam
  const posicoes = useMemo(() => calcularPosicoes(ativos, cotacoes), [ativos, cotacoes])
  const resumo = useMemo(() => calcularResumo(posicoes), [posicoes])

  // Lista na ordem escolhida. Só a LISTA é reordenada: o gráfico de distribuição continua usando
  // "posicoes" (ordem de cadastro) para que cada ativo mantenha sempre a mesma cor.
  const posicoesOrdenadas = useMemo(() => ordenarPosicoes(posicoes, ordem), [posicoes, ordem])

  function mudarOrdem(criterio) {
    setOrdem(criterio)
    salvarOrdenacao(criterio)
  }

  // Baixa a carteira em CSV, na mesma ordem em que aparece na lista
  function exportarCarteira() {
    baixarArquivoCsv(nomeDoArquivoCsv(), gerarCsv(posicoesOrdenadas, resumo))
    mostrarAviso(`Carteira exportada em CSV (${posicoesOrdenadas.length} ativo(s))`, 'sucesso')
  }

  // Horário da cotação mais recente, para o indicador "ao vivo"
  const horarioCotacao = useMemo(() => {
    const horarios = posicoes.map((p) => p.cotacao?.atualizadoEm).filter(Boolean)
    return horarios.sort().at(-1) // texto ISO pode ser ordenado como texto
  }, [posicoes])

  // Falha geral = NENHUM ativo tem cotação (ex: sem internet). Erros de um ativo só
  // aparecem na própria linha da lista.
  const mensagensErro = Object.values(errosCotacao)
  const falhaGeral = !carregando && ativos.length > 0 && resumo.semCotacao === ativos.length && mensagensErro.length > 0

  return {
    // dados
    ativos,
    posicoes,
    posicoesOrdenadas,
    resumo,
    errosCotacao,
    carregando,
    ultimaBusca,
    horarioCotacao,
    falhaGeral,
    mensagemErroGeral: mensagensErro[0],
    ordem,
    aviso,
    // ações
    adicionarAtivo,
    editarAtivo,
    removerAtivo,
    mudarOrdem,
    exportarCarteira,
    atualizarCotacoes,
    mostrarAviso,
    fecharAviso,
  }
}
