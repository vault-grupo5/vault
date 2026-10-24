import { useId, useState } from 'react'
import { useSugestoes } from '../hooks/useSugestoes.js'
import './CampoTicker.css'

// Campo de texto do ticker com lista de sugestões ("autocomplete").
//
// Segue o padrão de acessibilidade "combobox" (WAI-ARIA):
// - o <input> tem role="combobox" e avisa se a lista está aberta (aria-expanded);
// - a lista tem role="listbox" e cada item role="option";
// - aria-activedescendant diz ao leitor de tela qual item está destacado, SEM tirar
//   o foco do campo (a pessoa continua digitando enquanto navega pela lista).
//
// Teclado: ↓ ↑ navegam, Enter escolhe, Esc fecha, Tab sai do campo.
//
// Props:
// - id: id do <input> (o <label> do formulário aponta para ele)
// - valor / aoMudar(texto): texto digitado (controlado pelo formulário)
// - aoEscolher(sugestao): chamado quando a pessoa escolhe uma sugestão
// - tickersExistentes: tickers que já estão na carteira (ganham uma etiqueta)
// - inputRef: referência ao <input> (para o formulário poder focar nele)
// - ...resto: aria-invalid, aria-describedby etc., repassados ao <input>
function CampoTicker({ id, valor, aoMudar, aoEscolher, tickersExistentes, inputRef, ...resto }) {
  const idLista = useId()
  const { sugestoes, buscando } = useSugestoes(valor)

  const [aberta, setAberta] = useState(false) // a pessoa quer ver a lista?
  const [indiceAtivo, setIndiceAtivo] = useState(-1) // -1 = nenhuma opção destacada

  const termo = valor.trim()
  const temOpcoes = sugestoes.length > 0
  const mostrarLista = aberta && termo.length > 0
  const mostrarOpcoes = mostrarLista && temOpcoes
  const idOpcao = (indice) => `${idLista}-opcao-${indice}`

  function aoDigitar(evento) {
    aoMudar(evento.target.value)
    setAberta(true)
    setIndiceAtivo(-1) // a lista mudou: começa sem destaque
  }

  function escolher(sugestao) {
    setAberta(false)
    setIndiceAtivo(-1)
    aoEscolher(sugestao)
  }

  function aoApertarTecla(evento) {
    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault() // impede o cursor de pular para o fim do texto
        if (!mostrarOpcoes) {
          setAberta(true)
          break
        }
        setIndiceAtivo((i) => (i + 1) % sugestoes.length) // depois da última, volta à primeira
        break
      case 'ArrowUp':
        evento.preventDefault()
        if (mostrarOpcoes) setIndiceAtivo((i) => (i <= 0 ? sugestoes.length - 1 : i - 1))
        break
      case 'Enter':
        // Só "rouba" o Enter se há uma opção destacada; senão o formulário é enviado normalmente
        if (mostrarOpcoes && indiceAtivo >= 0) {
          evento.preventDefault()
          escolher(sugestoes[indiceAtivo])
        }
        break
      case 'Escape':
        if (mostrarLista) {
          evento.preventDefault()
          setAberta(false)
          setIndiceAtivo(-1)
        }
        break
      default:
    }
  }

  // Mensagem para leitores de tela (fica invisível na tela)
  let anuncio = ''
  if (mostrarLista) {
    if (temOpcoes) anuncio = `${sugestoes.length} sugestões disponíveis. Use as setas para cima e para baixo.`
    else if (buscando) anuncio = 'Buscando sugestões.'
    else anuncio = 'Nenhuma ação encontrada.'
  }

  return (
    <div className="campo-ticker">
      <input
        {...resto}
        ref={inputRef}
        id={id}
        name="ticker"
        className="campo__entrada campo__entrada--ticker"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={mostrarOpcoes}
        aria-controls={idLista}
        aria-activedescendant={mostrarOpcoes && indiceAtivo >= 0 ? idOpcao(indiceAtivo) : undefined}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck="false"
        value={valor}
        onChange={aoDigitar}
        onKeyDown={aoApertarTecla}
        onFocus={() => setAberta(true)}
        // Ao sair do campo a lista fecha. Os cliques nas opções usam onMouseDown
        // (que acontece ANTES do blur), por isso a escolha não se perde.
        onBlur={() => setAberta(false)}
      />

      <ul id={idLista} className="sugestoes" role="listbox" aria-label="Sugestões de ações" hidden={!mostrarOpcoes}>
        {sugestoes.map((sugestao, indice) => {
          const naCarteira = tickersExistentes.includes(sugestao.ticker)
          return (
            <li
              key={sugestao.ticker}
              id={idOpcao(indice)}
              role="option"
              aria-selected={indice === indiceAtivo}
              className={`sugestao ${indice === indiceAtivo ? 'sugestao--ativa' : ''}`}
              onMouseDown={(evento) => {
                evento.preventDefault() // mantém o foco no campo
                escolher(sugestao)
              }}
              onMouseEnter={() => setIndiceAtivo(indice)}
            >
              <span className="sugestao__ticker">{sugestao.ticker}</span>
              <span className="sugestao__nome">{sugestao.nome}</span>
              {naCarteira && <span className="sugestao__etiqueta">na carteira</span>}
            </li>
          )
        })}
      </ul>

      {/* Sem opções: avisamos que está buscando ou que não achou nada */}
      {mostrarLista && !temOpcoes && (
        <p className="sugestoes sugestoes--aviso">{buscando ? 'Buscando…' : 'Nenhuma ação encontrada.'}</p>
      )}

      {/* Mostra um "Buscando…" discreto ao fim da lista enquanto a API completa as opções */}
      {mostrarOpcoes && buscando && <span className="campo-ticker__buscando" aria-hidden="true" />}

      <div className="sr-only" role="status" aria-live="polite">
        {anuncio}
      </div>
    </div>
  )
}

export default CampoTicker
