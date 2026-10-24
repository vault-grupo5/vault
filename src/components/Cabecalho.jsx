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
            aria-label="Atualizar cotações"
            disabled={atualizando}
          >
            <span aria-hidden="true">↻</span>
            {/* Em telas estreitas só o ícone ↻ aparece (o texto some, mas o aria-label mantém o nome) */}
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
          {temaClaro ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" fill="currentColor" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}

export default Cabecalho
