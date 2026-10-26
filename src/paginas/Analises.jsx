import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import GraficoEvolucao from '../components/GraficoEvolucao.jsx'
import GraficoComparacao from '../components/GraficoComparacao.jsx'
import GraficoRentabilidade from '../components/GraficoRentabilidade.jsx'
import { useHistoricos } from '../hooks/useHistoricos.js'
import { useTituloDaPagina } from '../hooks/useTituloDaPagina.js'
import { calcularEvolucao, compararComIndice } from '../utils/evolucao.js'
import '../components/Analises.css'
import './Paginas.css'

// Símbolo do Ibovespa na brapi (conferido: o histórico de 3 meses vem no plano grátis)
const IBOVESPA = '^BVSP'

// Página "Análises": como a carteira se comportou nos últimos 3 meses.
// Os históricos são buscados só quando a pessoa abre esta página (e ficam 1 hora no cache).
// - carteira: objeto do hook useCarteira
function Analises({ carteira }) {
  useTituloDaPagina('Análises')
  const { ativos } = carteira
  const vazia = ativos.length === 0

  // O Ibovespa entra na mesma lista: também passa pela fila e pelo cache de 1 hora
  const tickers = useMemo(() => (ativos.length ? [...ativos.map((a) => a.ticker), IBOVESPA] : []), [ativos])
  const historicos = useHistoricos(tickers)

  // Só calculamos quando todos os históricos chegaram (evita o gráfico "crescer" durante a carga)
  const evolucao = useMemo(
    () => (historicos.carregando ? null : calcularEvolucao(ativos, historicos.historicos)),
    [ativos, historicos.carregando, historicos.historicos],
  )

  const comparacao = useMemo(
    () => (evolucao ? compararComIndice(evolucao.pontos, historicos.historicos[IBOVESPA]) : null),
    [evolucao, historicos.historicos],
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
                {/* total inclui o Ibovespa, buscado junto com os ativos */}
                Carregando os históricos: {historicos.feitos} de {historicos.total}…
              </p>
            </div>
          )}
        </section>
      )}

      {/* Comparação com o Ibovespa: só depois que a evolução está pronta */}
      {!vazia && evolucao && (
        <section className="cartao" aria-labelledby="titulo-comparacao">
          <h2 className="cartao__titulo" id="titulo-comparacao">
            Carteira × Ibovespa
          </h2>
          {comparacao ? (
            <GraficoComparacao comparacao={comparacao} />
          ) : (
            <p className="analise__vazio">
              Não foi possível comparar com o Ibovespa
              {historicos.erros[IBOVESPA] ? `: ${historicos.erros[IBOVESPA]}` : ' (histórico insuficiente).'}
            </p>
          )}
        </section>
      )}

      {/* Rentabilidade por ativo: usa as cotações atuais (não depende do histórico) */}
      {!vazia && (
        <section className="cartao" aria-labelledby="titulo-rentabilidade">
          <h2 className="cartao__titulo" id="titulo-rentabilidade">
            Rentabilidade por ativo
          </h2>
          <GraficoRentabilidade posicoes={carteira.posicoes} />
        </section>
      )}
    </div>
  )
}

export default Analises
