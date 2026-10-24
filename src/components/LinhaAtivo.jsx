import { useState } from 'react'
import Dinheiro from './Dinheiro.jsx'
import Pilula from './Pilula.jsx'
import {
  formatarMoeda,
  formatarMoedaComSinal,
  formatarPorcentagem,
  formatarQuantidade,
  lerNumero,
} from '../utils/formatacao.js'

// Uma linha da tabela de ativos.
// A linha tem 3 "modos":
//   'ver'       → mostra os números normalmente
//   'editar'    → troca quantidade e preço médio por campos de texto
//   'remover'   → pergunta "Remover? Sim / Não" antes de apagar
//
// Props:
// - posicao: o ativo já com os cálculos (vem de calcularPosicao)
// - carregando: true enquanto as cotações estão sendo buscadas
// - erro: mensagem de erro da cotação deste ticker (se houver)
// - aoEditar(id, mudancas) e aoRemover(id): funções do App
function LinhaAtivo({ posicao, carregando, erro, aoEditar, aoRemover }) {
  const [modo, setModo] = useState('ver')
  const [rascunho, setRascunho] = useState({ quantidade: '', precoMedio: '' })
  const [erroEdicao, setErroEdicao] = useState('')
  const [logoQuebrado, setLogoQuebrado] = useState(false)

  const { cotacao, ticker } = posicao

  // ---------- Piscar ao atualizar ----------
  // Guardamos o último preço visto. Se o preço mudar, a linha pisca
  // verde (subiu) ou vermelho (caiu). Comparar durante o render, guardando o
  // valor anterior no estado, é o jeito recomendado pelo React para "reagir a uma mudança de prop".
  const precoCotacao = cotacao?.preco ?? null
  const [precoAnterior, setPrecoAnterior] = useState(precoCotacao)
  const [piscar, setPiscar] = useState(null) // 'ganho', 'perda' ou null

  if (precoCotacao !== precoAnterior) {
    setPrecoAnterior(precoCotacao)
    // Só pisca se já tínhamos um preço antes (não pisca na primeira carga)
    if (precoAnterior !== null && precoCotacao !== null) {
      setPiscar(precoCotacao > precoAnterior ? 'ganho' : 'perda')
    }
  }

  // ---------- Edição ----------

  function comecarEdicao() {
    // Preenche os campos com os valores atuais, no formato brasileiro (vírgula)
    setRascunho({
      quantidade: String(posicao.quantidade),
      precoMedio: posicao.precoMedio.toFixed(2).replace('.', ','),
    })
    setErroEdicao('')
    setModo('editar')
  }

  function salvarEdicao(evento) {
    evento.preventDefault()
    const quantidade = lerNumero(rascunho.quantidade)
    const precoMedio = lerNumero(rascunho.precoMedio)

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      setErroEdicao('Quantidade deve ser um número inteiro maior que zero.')
      return
    }
    if (!Number.isFinite(precoMedio) || precoMedio <= 0) {
      setErroEdicao('Preço médio deve ser maior que zero.')
      return
    }

    aoEditar(posicao.id, { quantidade, precoMedio })
    setModo('ver')
  }

  // Esc cancela a edição ou a remoção (atalho de teclado)
  function aoApertarTecla(evento) {
    if (evento.key === 'Escape') setModo('ver')
  }

  // ---------- Partes da linha ----------

  // Logo da empresa (vem da brapi). Se não carregar, mostramos as iniciais.
  const logo =
    cotacao?.logo && !logoQuebrado ? (
      <img className="ativo__logo" src={cotacao.logo} alt="" loading="lazy" onError={() => setLogoQuebrado(true)} />
    ) : (
      <span className="ativo__logo ativo__logo--iniciais" aria-hidden="true">
        {ticker.slice(0, 2)}
      </span>
    )

  // Preço atual: esqueleto enquanto carrega, aviso se deu erro
  let precoAtual
  if (posicao.temCotacao) {
    precoAtual = (
      <>
        <span>{formatarMoeda(posicao.precoAtual)}</span>
        <Pilula valor={cotacao.variacaoDia}>{formatarPorcentagem(cotacao.variacaoDia)}</Pilula>
      </>
    )
  } else if (carregando) {
    precoAtual = <span className="esqueleto" aria-label="Carregando cotação" />
  } else {
    precoAtual = (
      <span className="ativo__sem-cotacao" title={erro}>
        <span aria-hidden="true">⚠</span> Sem cotação
        {erro && <span className="sr-only">: {erro}</span>}
      </span>
    )
  }

  const emEdicao = modo === 'editar'

  return (
    <tr
      className={`linha ${piscar ? `linha--piscar-${piscar}` : ''}`}
      onKeyDown={aoApertarTecla}
      // Quando a animação CSS termina, tiramos a classe para poder piscar de novo depois
      // (o "if" ignora animações de elementos de dentro da linha, como o esqueleto)
      onAnimationEnd={(evento) => {
        if (evento.target === evento.currentTarget) setPiscar(null)
      }}
    >
      {/* Coluna do ativo: logo, ticker e nome da empresa */}
      <th scope="row" className="linha__ativo">
        <div className="ativo">
          {logo}
          <div className="ativo__textos">
            <span className="ativo__ticker">{ticker}</span>
            <span className="ativo__nome">{cotacao?.nome ?? '—'}</span>
          </div>
        </div>
      </th>

      {emEdicao ? (
        // Modo edição: os campos ocupam as colunas de quantidade e preço médio.
        // O atributo form="..." liga os campos ao <form> que está na coluna de ações.
        <>
          <td data-rotulo="Quantidade">
            <label className="sr-only" htmlFor={`editar-qtd-${posicao.id}`}>
              Quantidade de {ticker}
            </label>
            <input
              id={`editar-qtd-${posicao.id}`}
              form={`form-editar-${posicao.id}`}
              className="campo__entrada campo__entrada--pequeno"
              inputMode="numeric"
              value={rascunho.quantidade}
              onChange={(e) => setRascunho({ ...rascunho, quantidade: e.target.value })}
              aria-invalid={Boolean(erroEdicao)}
              aria-describedby={erroEdicao ? `erro-editar-${posicao.id}` : undefined}
              autoFocus
            />
          </td>
          <td data-rotulo="Preço médio">
            <label className="sr-only" htmlFor={`editar-preco-${posicao.id}`}>
              Preço médio de {ticker}
            </label>
            <input
              id={`editar-preco-${posicao.id}`}
              form={`form-editar-${posicao.id}`}
              className="campo__entrada campo__entrada--pequeno"
              inputMode="decimal"
              value={rascunho.precoMedio}
              onChange={(e) => setRascunho({ ...rascunho, precoMedio: e.target.value })}
              aria-invalid={Boolean(erroEdicao)}
              aria-describedby={erroEdicao ? `erro-editar-${posicao.id}` : undefined}
            />
          </td>
        </>
      ) : (
        <>
          <td data-rotulo="Quantidade">{formatarQuantidade(posicao.quantidade)}</td>
          <td data-rotulo="Preço médio">{formatarMoeda(posicao.precoMedio)}</td>
        </>
      )}

      <td data-rotulo="Preço atual">
        <div className="linha__preco">{precoAtual}</div>
      </td>

      <td data-rotulo="Valor atual" className="linha__valor">
        <Dinheiro valor={posicao.valorAtual} />
      </td>

      <td data-rotulo="Lucro / prejuízo">
        {posicao.temCotacao ? (
          <div className="linha__lucro">
            <span className={`texto--${posicao.lucro >= 0 ? 'ganho' : 'perda'}`}>
              {formatarMoedaComSinal(posicao.lucro)}
            </span>
            <Pilula valor={posicao.lucroPercentual}>{formatarPorcentagem(posicao.lucroPercentual)}</Pilula>
          </div>
        ) : (
          <span className="texto--secundario">—</span>
        )}
      </td>

      {/* Coluna de ações: muda conforme o modo */}
      <td className="linha__acoes">
        {modo === 'ver' && (
          <div className="acoes">
            <button
              type="button"
              className="botao botao--fantasma botao--icone"
              onClick={comecarEdicao}
              aria-label={`Editar ${ticker}`}
              title="Editar"
            >
              ✎
            </button>
            <button
              type="button"
              className="botao botao--fantasma botao--icone botao--perigo"
              onClick={() => setModo('remover')}
              aria-label={`Remover ${ticker}`}
              title="Remover"
            >
              ✕
            </button>
          </div>
        )}

        {emEdicao && (
          <form id={`form-editar-${posicao.id}`} className="acoes acoes--coluna" onSubmit={salvarEdicao}>
            {erroEdicao && (
              <p id={`erro-editar-${posicao.id}`} className="campo__erro" role="alert">
                {erroEdicao}
              </p>
            )}
            <div className="acoes">
              <button type="submit" className="botao botao--primario">
                Salvar
              </button>
              <button type="button" className="botao botao--fantasma" onClick={() => setModo('ver')}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {modo === 'remover' && (
          // role="group" + aria-label: o leitor de tela anuncia a pergunta junto com os botões
          <div className="acoes acoes--confirmar" role="group" aria-label={`Remover ${ticker} da carteira?`}>
            <span className="acoes__pergunta">Remover?</span>
            <button
              type="button"
              className="botao botao--perigo botao--confirmar"
              onClick={() => aoRemover(posicao.id)}
              autoFocus
            >
              Sim
            </button>
            <button type="button" className="botao botao--fantasma" onClick={() => setModo('ver')}>
              Não
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default LinhaAtivo
