import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import GraficoEvolucao from '../components/GraficoEvolucao.jsx'
import { useHistoricos } from '../hooks/useHistoricos.js'
import { useTituloDaPagina } from '../hooks/useTituloDaPagina.js'
import { calcularEvolucao } from '../utils/evolucao.js'
import '../components/Analises.css'
import './Paginas.css'

// Página "Análises": como a carteira se comportou nos últimos 3 meses.
// Os históricos são buscados só quando a pessoa abre esta página (e ficam 1 hora no cache).
// - carteira: objeto do hook useCarteira
function Analises({ carteira }) {
  useTituloDaPagina('Análises')
  const { ativos } = carteira
  const vazia = ativos.length === 0

  const tickers = useMemo(() => ativos.map((a) => a.ticker), [ativos])
  const historicos = useHistoricos(tickers)

  // Só calculamos quando todos os históricos chegaram (evita o gráfico "crescer" durante a carga)
  const evolucao = useMemo(
    () => (historicos.carregando ? null : calcularEvolucao(ativos, historicos.historicos)),
    [ativos, historicos.carregando, historicos.historicos],
  )

  return (
    <div className="pagina">
      <header>
        <h1 className="pagina__titulo" tabIndex={-1}>
          Análises
        </h1>
        <p className="pagina__descricao">Como a carteira se comportou nos últimos 3 meses, com o histórico da brapi.</p>
      </header>

      {vazia ? (
        <section className="cartao comecar" aria-labelledby="titulo-sem-dados">
          <h2 className="cartao__titulo" id="titulo-sem-dados">
            Ainda não há o que analisar
          </h2>
          <p className="comecar__texto">As análises usam os ativos da sua carteira. Cadastre pelo menos um para começar.</p>
          <div className="comecar__acoes">
            <Link className="botao botao--primario" to="/ativos">
              Cadastrar ativo
            </Link>
            <button type="button" className="botao botao--fantasma" onClick={carteira.carregarExemplo}>
              Ver carteira de exemplo
            </button>
          </div>
        </section>
      ) : (
        <section className="cartao" aria-labelledby="titulo-evolucao" aria-busy={historicos.carregando}>
          <h2 className="cartao__titulo" id="titulo-evolucao">
            Evolução do patrimônio
          </h2>
          {evolucao ? (
            <GraficoEvolucao pontos={evolucao.pontos} semHistorico={evolucao.semHistorico} />
          ) : (
            <div className="analise__carregando" role="status">
              <span className="esqueleto analise__esqueleto" />
              <p className="analise__progresso">
                Carregando o histórico: {historicos.feitos} de {historicos.total} ativo(s)…
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default Analises
