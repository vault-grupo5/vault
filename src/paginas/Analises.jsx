import { Link } from 'react-router-dom'
import { useTituloDaPagina } from '../hooks/useTituloDaPagina.js'
import './Paginas.css'

// Página "Análises": gráficos sobre o desempenho da carteira ao longo do tempo.
// - carteira: objeto do hook useCarteira
function Analises({ carteira }) {
  useTituloDaPagina('Análises')
  const vazia = carteira.ativos.length === 0

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
          </div>
        </section>
      ) : (
        <section className="cartao comecar" aria-labelledby="titulo-em-breve">
          <h2 className="cartao__titulo" id="titulo-em-breve">
            Em breve
          </h2>
          <p className="comecar__texto">
            Evolução do patrimônio, comparação com o Ibovespa e rentabilidade por ativo vão aparecer aqui.
          </p>
        </section>
      )}
    </div>
  )
}

export default Analises
