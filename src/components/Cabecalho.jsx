import { formatarHorario } from '../utils/formatacao.js'

// Cabeçalho do site: marca VAULT, título "Minha carteira" e o indicador "ao vivo".
// - horarioCotacao: horário (ISO) da cotação mais recente, vindo da brapi
// - atualizando: true enquanto as cotações estão sendo buscadas
// - aoAtualizar: função chamada quando clica no botão "Atualizar"
function Cabecalho({ horarioCotacao, atualizando = false, aoAtualizar }) {
  const horario = formatarHorario(horarioCotacao)

  return (
    <header className="cabecalho">
      <div className="cabecalho__marca">
        {/* Logo simples: um cadeado estilizado desenhado em SVG */}
        <svg className="cabecalho__logo" viewBox="0 0 32 32" aria-hidden="true">
          <rect x="4" y="13" width="24" height="16" rx="5" fill="currentColor" />
          <path d="M10 13V10a6 6 0 0 1 12 0v3" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="16" cy="21" r="2.5" fill="var(--cor-fundo)" />
        </svg>
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
            disabled={atualizando}
          >
            <span aria-hidden="true">↻</span> Atualizar
          </button>
        )}
      </div>
    </header>
  )
}

export default Cabecalho
