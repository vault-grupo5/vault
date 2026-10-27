import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { FlaskConical, Plus } from 'lucide-react'
import ResumoCarteira from '../components/ResumoCarteira.jsx'
import Carregando from '../components/Carregando.jsx'
import { useTituloDaPagina } from '../hooks/useTituloDaPagina.js'
import './Paginas.css'

// O gráfico (e o Chart.js) só é baixado quando há ativos para mostrar
const GraficoRosca = lazy(() => import('../components/GraficoRosca.jsx'))

// Página inicial: o resumo da carteira (patrimônio, lucro, dia) e a distribuição.
// - carteira: objeto do hook useCarteira
function VisaoGeral({ carteira }) {
  useTituloDaPagina('Visão geral')
  const vazia = carteira.ativos.length === 0

  return (
    <div className="pagina">
      <header>
        {/* tabIndex -1: o Layout leva o foco para cá ao trocar de página (leitor de tela anuncia) */}
        <h1 className="pagina__titulo" tabIndex={-1}>
          Visão geral
        </h1>
      </header>

      <section className="cartao" aria-labelledby="titulo-resumo">
        <h2 className="sr-only" id="titulo-resumo">
          Resumo
        </h2>
        <ResumoCarteira resumo={carteira.resumo} carregando={carteira.carregando} />
      </section>

      {vazia ? (
        // Carteira vazia: em vez de um gráfico sem nada, um caminho claro para começar
        <section className="cartao comecar" aria-labelledby="titulo-comecar">
          <h2 className="cartao__titulo" id="titulo-comecar">
            Comece pela sua carteira
          </h2>
          <p className="comecar__texto">
            Cadastre as ações, FIIs ou ETFs que você tem, com a quantidade e o preço médio. O VAULT busca as cotações
            e calcula o patrimônio e o lucro.
          </p>
          <div className="comecar__acoes">
            <Link className="botao botao--primario" to="/ativos">
              <Plus size={18} aria-hidden="true" /> Cadastrar ativo
            </Link>
            {/* Para conhecer o VAULT sem cadastrar nada: carrega ativos fictícios (ver utils/carteiraExemplo.js) */}
            <button type="button" className="botao botao--fantasma" onClick={carteira.carregarExemplo}>
              <FlaskConical size={18} aria-hidden="true" /> Ver carteira de exemplo
            </button>
          </div>
        </section>
      ) : (
        <section className="cartao" aria-labelledby="titulo-distribuicao">
          <h2 className="cartao__titulo" id="titulo-distribuicao">
            Distribuição
          </h2>
          <Suspense fallback={<Carregando altura={240} texto="Carregando o gráfico…" />}>
            <GraficoRosca posicoes={carteira.posicoes} />
          </Suspense>
        </section>
      )}
    </div>
  )
}

export default VisaoGeral
