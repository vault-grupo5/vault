import { useState } from 'react'
import { Pencil, Trash2, TriangleAlert } from 'lucide-react'
import Dinheiro from './Dinheiro.jsx'
import Pilula from './Pilula.jsx'
import LogoAtivo from './LogoAtivo.jsx'
import { ehExemplo } from '../utils/carteiraExemplo.js'
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
// - aoAbrirHistorico(ticker): abre o painel com o gráfico de evolução do preço
function LinhaAtivo({ posicao, carregando, erro, aoEditar, aoRemover, aoAbrirHistorico }) {
  const [modo, setModo] = useState('ver')
  const [rascunho, setRascunho] = useState({ quantidade: '', precoMedio: '' })
  const [erroEdicao, setErroEdicao] = useState('')

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

  // Clicar na linha (com o mouse) abre o histórico. Ignoramos cliques em botões e campos
  // (editar, remover, salvar...) para não abrir o painel por engano.
  // Quem usa o teclado abre pelo botão do ativo, que é focável com Tab.
  function aoClicarNaLinha(evento) {
    if (modo !== 'ver' || evento.target.closest('button, input, a, form')) return
    aoAbrirHistorico(ticker)
  }

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
        <TriangleAlert size={14} aria-hidden="true" /> Sem cotação
        {erro && <span className="sr-only">: {erro}</span>}
      </span>
    )
  }

  const emEdicao = modo === 'editar'

  return (
    <tr
      className={`linha ${modo === 'ver' ? 'linha--clicavel' : ''} ${piscar ? `linha--piscar-${piscar}` : ''}`}
      onClick={aoClicarNaLinha}
      onKeyDown={aoApertarTecla}
      // Quando a animação CSS termina, tiramos a classe para poder piscar de novo depois
      // (o "if" ignora animações de elementos de dentro da linha, como o esqueleto)
      onAnimationEnd={(evento) => {
        if (evento.target === evento.currentTarget) setPiscar(null)
      }}
    >
      {/* Coluna do ativo: logo, ticker e nome da empresa */}
      <th scope="row" className="linha__ativo">
        {/* É um botão de verdade (e não só um clique na linha) para funcionar com Tab e Enter */}
        <button
          type="button"
          className="ativo ativo--botao"
          onClick={() => aoAbrirHistorico(ticker)}
          aria-label={`Ver evolução de ${ticker} nos últimos 3 meses`}
        >
          <LogoAtivo ticker={ticker} logo={cotacao?.logo} />
          <span className="ativo__textos">
            <span className="ativo__ticker">
              {ticker}
              {/* Ativo da carteira de demonstração (ver utils/carteiraExemplo.js) */}
              {ehExemplo(posicao) && <span className="etiqueta">Exemplo</span>}
            </span>
            <span className="ativo__nome">{cotacao?.nome ?? '—'}</span>
          </span>
        </button>
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
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="botao botao--fantasma botao--icone botao--perigo"
              onClick={() => setModo('remover')}
              aria-label={`Remover ${ticker}`}
              title="Remover"
            >
              <Trash2 size={16} aria-hidden="true" />
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
