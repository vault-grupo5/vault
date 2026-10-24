import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Cabecalho from './components/Cabecalho.jsx'
import BannerErro from './components/BannerErro.jsx'
import ResumoCarteira from './components/ResumoCarteira.jsx'
import FormularioAtivo from './components/FormularioAtivo.jsx'
import ListaCarteira from './components/ListaCarteira.jsx'
import GraficoPizza from './components/GraficoPizza.jsx'
import { carregarCarteira, salvarCarteira } from './utils/storage.js'
import { calcularPosicoes, calcularResumo } from './utils/calculos.js'
import { buscarCotacoes } from './services/brapi.js'
import './App.css'

// De quanto em quanto tempo as cotações são atualizadas sozinhas.
// A brapi grátis tem ~30 min de atraso e o cache dura 10 min, então 10 min basta.
const INTERVALO_ATUALIZACAO_MS = 10 * 60 * 1000

// Componente principal: guarda o estado da carteira e das cotações e monta o layout.
// Os outros componentes recebem os dados e as funções por props.
function App() {
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
    },
    [chaveTickers],
  )

  // Busca as cotações quando o app abre, quando os tickers mudam
  // e depois a cada INTERVALO_ATUALIZACAO_MS
  useEffect(() => {
    // Buscar dados de uma API externa é exatamente o uso certo de um useEffect,
    // por isso desligamos aqui o aviso do linter sobre setState dentro do effect.
    // oxlint-disable-next-line react/set-state-in-effect
    atualizarCotacoes()
    const timer = setInterval(atualizarCotacoes, INTERVALO_ATUALIZACAO_MS)
    return () => clearInterval(timer) // limpa o timer quando o componente sai ou os tickers mudam
  }, [atualizarCotacoes])

  // ---------- Ações sobre a carteira ----------
  // Sempre criamos uma NOVA lista (nunca alteramos a antiga),
  // porque é assim que o React percebe que algo mudou e redesenha a tela.

  // O formulário já buscou a cotação para validar o ticker, então aproveitamos ela
  function adicionarAtivo(novoAtivo, cotacao) {
    setAtivos((atuais) => [...atuais, novoAtivo])
    if (cotacao) setCotacoes((atuais) => ({ ...atuais, [novoAtivo.ticker]: cotacao }))
  }

  // mudancas: só os campos que mudaram, ex { quantidade: 200 }
  function editarAtivo(id, mudancas) {
    setAtivos((atuais) => atuais.map((a) => (a.id === id ? { ...a, ...mudancas } : a)))
  }

  function removerAtivo(id) {
    setAtivos((atuais) => atuais.filter((a) => a.id !== id))
  }

  // ---------- Valores calculados ----------
  // useMemo: só recalcula quando os ativos ou as cotações mudam
  const posicoes = useMemo(() => calcularPosicoes(ativos, cotacoes), [ativos, cotacoes])
  const resumo = useMemo(() => calcularResumo(posicoes), [posicoes])

  // Horário da cotação mais recente, para o indicador "ao vivo"
  const horarioCotacao = useMemo(() => {
    const horarios = posicoes.map((p) => p.cotacao?.atualizadoEm).filter(Boolean)
    return horarios.sort().at(-1) // texto ISO pode ser ordenado como texto
  }, [posicoes])

  // Banner de erro só quando NENHUM ativo tem cotação (falha geral, ex: sem internet).
  // Erros de um ativo só aparecem na própria linha da lista.
  const mensagensErro = Object.values(errosCotacao)
  const falhaGeral = !carregando && ativos.length > 0 && resumo.semCotacao === ativos.length && mensagensErro.length > 0

  return (
    <div className="app">
      <Cabecalho
        horarioCotacao={horarioCotacao}
        atualizando={carregando}
        aoAtualizar={ativos.length > 0 ? () => atualizarCotacoes({ ignorarCache: true }) : undefined}
      />

      {falhaGeral && (
        <BannerErro mensagem={mensagensErro[0]} aoTentarDeNovo={() => atualizarCotacoes({ ignorarCache: true })} />
      )}

      <main className="grid">
        <section className="cartao grid__resumo" aria-labelledby="titulo-resumo">
          <h2 className="sr-only" id="titulo-resumo">
            Resumo
          </h2>
          <ResumoCarteira resumo={resumo} carregando={carregando} />
        </section>

        <section className="cartao grid__formulario" aria-labelledby="titulo-formulario">
          <h2 className="cartao__titulo" id="titulo-formulario">
            Adicionar ativo
          </h2>
          <FormularioAtivo tickersExistentes={ativos.map((a) => a.ticker)} aoAdicionar={adicionarAtivo} />
        </section>

        <section className="cartao grid__lista" aria-labelledby="titulo-lista">
          <h2 className="cartao__titulo" id="titulo-lista">
            Meus ativos
          </h2>
          <ListaCarteira
            posicoes={posicoes}
            carregando={carregando}
            erros={errosCotacao}
            aoEditar={editarAtivo}
            aoRemover={removerAtivo}
          />
        </section>

        <section className="cartao grid__grafico" aria-labelledby="titulo-grafico">
          <h2 className="cartao__titulo" id="titulo-grafico">
            Distribuição
          </h2>
          <GraficoPizza posicoes={posicoes} />
        </section>
      </main>

      <footer className="rodape">
        VAULT · Grupo 5 · DW2 — cotações da <a href="https://brapi.dev">brapi</a> com atraso de ~30 min
      </footer>
    </div>
  )
}

export default App
