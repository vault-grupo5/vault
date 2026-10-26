import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navegacao from './Navegacao.jsx'
import Cabecalho from './Cabecalho.jsx'
import BannerErro from './BannerErro.jsx'
import AvisoExemplo from './AvisoExemplo.jsx'
import Aviso from './Aviso.jsx'
import { INTERVALO_ATUALIZACAO_MS } from '../hooks/useCarteira.js'
import { formatarHorario } from '../utils/formatacao.js'
import './Layout.css'

// Moldura de todas as páginas: navegação, barra do topo, avisos e rodapé.
// O conteúdo da página aberta entra no lugar do <Outlet /> (é o react-router que escolhe).
//
// Props:
// - carteira: o objeto do hook useCarteira (dados e ações)
// - tema / aoAlternarTema: tema claro/escuro
// - ocultarValores / aoAlternarPrivacidade: modo privacidade
function Layout({ carteira, tema, aoAlternarTema, ocultarValores, aoAlternarPrivacidade }) {
  const local = useLocation()
  const primeiraVez = useRef(true)

  // Acessibilidade ao trocar de página: num site comum o navegador recarrega e o leitor de tela
  // começa do topo. Aqui a página troca SEM recarregar, então levamos o foco até o título (h1)
  // da página nova; assim o leitor de tela anuncia onde a pessoa chegou.
  // Na primeira abertura não mexemos no foco (a pessoa acabou de chegar).
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false
      return
    }
    document.querySelector('#conteudo h1')?.focus()
    window.scrollTo(0, 0)
  }, [local.pathname])

  // "Pular para o conteúdo": quem navega pelo teclado não precisa passar pelo menu todo.
  // É um botão (e não um link "#conteudo") porque com o HashRouter o # do endereço é a rota.
  function pularParaConteudo() {
    document.getElementById('conteudo')?.focus()
  }

  const temAtivos = carteira.ativos.length > 0

  return (
    <div className="estrutura">
      <button type="button" className="pular-conteudo" onClick={pularParaConteudo}>
        Pular para o conteúdo
      </button>

      <Navegacao />

      <div className="estrutura__coluna">
        <Cabecalho
          horarioCotacao={carteira.horarioCotacao}
          atualizando={carteira.carregando}
          temAtivos={temAtivos}
          aoAtualizar={() => carteira.atualizarCotacoes({ ignorarCache: true })}
          aoExportar={carteira.exportarCarteira}
          tema={tema}
          aoAlternarTema={aoAlternarTema}
          ocultarValores={ocultarValores}
          aoAlternarPrivacidade={aoAlternarPrivacidade}
        />

        {carteira.falhaGeral && (
          <BannerErro
            mensagem={carteira.mensagemErroGeral}
            aoTentarDeNovo={() => carteira.atualizarCotacoes({ ignorarCache: true })}
          />
        )}

        {carteira.temExemplo && <AvisoExemplo aoLimpar={carteira.limparExemplo} />}

        {/* tabIndex -1: permite receber foco pelo "Pular para o conteúdo", sem entrar na ordem do Tab */}
        <main id="conteudo" className="estrutura__conteudo" tabIndex={-1}>
          <Outlet />
        </main>

        <footer className="rodape">
          <p>
            Cotações da <a href="https://brapi.dev">brapi</a>, com atraso de cerca de 30 minutos.
            {carteira.ultimaBusca && (
              <>
                {' '}
                Elas se atualizam sozinhas a cada {INTERVALO_ATUALIZACAO_MS / 60000} min (com pausa enquanto a aba
                está em segundo plano); última busca às {formatarHorario(carteira.ultimaBusca)}.
              </>
            )}
          </p>
          <p>VAULT, trabalho de Desenvolvimento Web II do Grupo 5.</p>
        </footer>
      </div>

      <Aviso aviso={carteira.aviso} aoFechar={carteira.fecharAviso} />
    </div>
  )
}

export default Layout
