import { useCallback, useState } from 'react'
import FormularioAtivo from '../components/FormularioAtivo.jsx'
import ListaCarteira from '../components/ListaCarteira.jsx'
import PainelHistorico from '../components/PainelHistorico.jsx'
import { useTituloDaPagina } from '../hooks/useTituloDaPagina.js'
import './Paginas.css'

// Página "Meus ativos": cadastro e lista (editar, remover, ordenar, ver o histórico de cada um).
// - carteira: objeto do hook useCarteira
function MeusAtivos({ carteira }) {
  useTituloDaPagina('Meus ativos')

  // Ticker cujo histórico está aberto no painel (null = painel fechado)
  const [tickerAberto, setTickerAberto] = useState(null)
  const fecharHistorico = useCallback(() => setTickerAberto(null), [])
  // Ativo do painel de histórico. Se ele sumir da carteira, o painel simplesmente fecha.
  const posicaoAberta = carteira.posicoes.find((p) => p.ticker === tickerAberto)

  return (
    <div className="pagina">
      <header>
        <h1 className="pagina__titulo" tabIndex={-1}>
          Meus ativos
        </h1>
        <p className="pagina__descricao">Clique num ativo para ver como o preço dele andou nos últimos 3 meses.</p>
      </header>

      <div className="grade-ativos">
        <section className="cartao grade-ativos__formulario" aria-labelledby="titulo-formulario">
          <h2 className="cartao__titulo" id="titulo-formulario">
            Adicionar ativo
          </h2>
          <FormularioAtivo
            tickersExistentes={carteira.ativos.map((a) => a.ticker)}
            aoAdicionar={carteira.adicionarAtivo}
          />
        </section>

        <section className="cartao grade-ativos__lista" aria-labelledby="titulo-lista">
          <h2 className="cartao__titulo" id="titulo-lista">
            Carteira
          </h2>
          <ListaCarteira
            posicoes={carteira.posicoesOrdenadas}
            ordem={carteira.ordem}
            aoMudarOrdem={carteira.mudarOrdem}
            carregando={carteira.carregando}
            erros={carteira.errosCotacao}
            aoEditar={carteira.editarAtivo}
            aoRemover={carteira.removerAtivo}
            aoAbrirHistorico={setTickerAberto}
            aoCarregarExemplo={carteira.carregarExemplo}
          />
        </section>
      </div>

      {posicaoAberta && <PainelHistorico key={posicaoAberta.ticker} posicao={posicaoAberta} aoFechar={fecharHistorico} />}
    </div>
  )
}

export default MeusAtivos
