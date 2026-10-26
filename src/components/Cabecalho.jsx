import { Moon, RefreshCw, Sun } from 'lucide-react'
import Logo from './Logo.jsx'
import { formatarHorario } from '../utils/formatacao.js'

// Cabeçalho do site: marca VAULT, título "Minha carteira" e o indicador "ao vivo".
// - horarioCotacao: horário (ISO) da cotação mais recente, vindo da brapi
// - atualizando: true enquanto as cotações estão sendo buscadas
// - aoAtualizar: função chamada quando clica no botão "Atualizar"
// - tema ("claro" ou "escuro") e aoAlternarTema: botão que troca o tema
function Cabecalho({ horarioCotacao, atualizando = false, aoAtualizar, tema, aoAlternarTema }) {
  const temaClaro = tema === 'claro'
  const horario = formatarHorario(horarioCotacao)

  return (
    <header className="cabecalho">
      <div className="cabecalho__marca">
        <Logo tamanho={40} />
        <div>
          <p className="cabecalho__nome">VAULT</p>
          <h1 className="cabecalho__titulo">Minha carteira</h1>
        </div>
      </div>

      <div className="cabecalho__acoes">
        {/* aria-live="polite": o leitor de tela avisa quando o horário muda */}
        <p className="ao-vivo" aria-live="polite">
          <span className={`ao-vivo__ponto ${atualizando ? 'ao-vivo__ponto--atualizando' : ''}`} aria-hidden="true" />
          {atualizando ? 'Atualizando…' : horario ? `Ao vivo · cotação das ${horario}` : 'Ao vivo'}
        </p>

        {aoAtualizar && (
          <button
            type="button"
            className="botao botao--fantasma"
            onClick={aoAtualizar}
            aria-label="Atualizar cotações"
            disabled={atualizando}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {/* Em telas estreitas só o ícone aparece (o texto some, mas o aria-label mantém o nome) */}
            <span className="botao__texto">Atualizar</span>
          </button>
        )}

        {/* Botão do tema. O ícone mostra para onde a pessoa VAI: sol (ir para o claro) ou lua (ir para o escuro) */}
        <button
          type="button"
          className="botao botao--fantasma botao--icone"
          onClick={aoAlternarTema}
          aria-label={temaClaro ? 'Mudar para o tema escuro' : 'Mudar para o tema claro'}
          title={temaClaro ? 'Tema escuro' : 'Tema claro'}
        >
          {temaClaro ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
        </button>
      </div>
    </header>
  )
}

export default Cabecalho
