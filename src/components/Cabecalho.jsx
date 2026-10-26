import { Download, Eye, EyeOff, Moon, RefreshCw, Sun } from 'lucide-react'
import Logo from './Logo.jsx'
import { formatarHorario } from '../utils/formatacao.js'
import './Cabecalho.css'

// Barra do topo, igual em todas as páginas: indicador "ao vivo" e as ações gerais do site
// (atualizar cotações, privacidade, exportar CSV e trocar o tema).
// No celular mostra também o logo, porque lá não existe o menu lateral.
//
// Props:
// - horarioCotacao: horário (ISO) da cotação mais recente, vindo da brapi
// - atualizando: true enquanto as cotações estão sendo buscadas
// - temAtivos: false com a carteira vazia (aí não há o que atualizar nem exportar)
// - aoAtualizar, aoExportar: ações dos botões
// - tema ("claro" ou "escuro") e aoAlternarTema: botão que troca o tema
// - ocultarValores e aoAlternarPrivacidade: modo privacidade (esconde os valores em R$)
function Cabecalho({
  horarioCotacao,
  atualizando = false,
  temAtivos,
  aoAtualizar,
  aoExportar,
  tema,
  aoAlternarTema,
  ocultarValores,
  aoAlternarPrivacidade,
}) {
  const temaClaro = tema === 'claro'
  const horario = formatarHorario(horarioCotacao)

  return (
    <header className="topo">
      <div className="topo__marca">
        <Logo tamanho={32} comNome />
      </div>

      {/* aria-live="polite": o leitor de tela avisa quando o horário muda */}
      <p className="ao-vivo" aria-live="polite">
        <span className={`ao-vivo__ponto ${atualizando ? 'ao-vivo__ponto--atualizando' : ''}`} aria-hidden="true" />
        {atualizando ? 'Atualizando…' : horario ? `Ao vivo, cotação das ${horario}` : 'Ao vivo'}
      </p>

      <div className="topo__acoes">
        {temAtivos && (
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

        {/* Modo privacidade. aria-pressed diz ao leitor de tela se o botão está "ligado" ou "desligado";
            por isso o nome do botão é sempre o mesmo e só o estado muda. */}
        <button
          type="button"
          className={`botao botao--fantasma botao--icone ${ocultarValores ? 'botao--ligado' : ''}`}
          onClick={aoAlternarPrivacidade}
          aria-pressed={ocultarValores}
          aria-label="Ocultar valores"
          title={ocultarValores ? 'Mostrar os valores em reais' : 'Esconder os valores em reais'}
        >
          {ocultarValores ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>

        {temAtivos && (
          <button
            type="button"
            className="botao botao--fantasma"
            onClick={aoExportar}
            aria-label="Exportar carteira em CSV"
            title="Baixar a carteira em CSV (abre no Excel)"
          >
            <Download size={16} aria-hidden="true" />
            <span className="botao__texto">Exportar CSV</span>
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
