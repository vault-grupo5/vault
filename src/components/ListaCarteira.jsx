import { Wallet } from 'lucide-react'
import LinhaAtivo from './LinhaAtivo.jsx'
import { OPCOES_ORDENACAO } from '../utils/ordenacao.js'
import './ListaCarteira.css'

// Tabela com todos os ativos da carteira.
// No computador é uma tabela normal; no celular cada linha vira um cartão (ver ListaCarteira.css).
//
// Props:
// - posicoes: ativos com os cálculos feitos, JÁ na ordem em que devem aparecer
// - ordem / aoMudarOrdem(criterio): critério de ordenação escolhido e a função que o troca
// - carregando: true enquanto as cotações chegam
// - erros: { PETR4: 'mensagem' } com as cotações que falharam
// - aoEditar, aoRemover: funções do App
// - aoAbrirHistorico(ticker): chamado ao clicar num ativo
// - aoCarregarExemplo: carrega a carteira de exemplo (botão da carteira vazia)
function ListaCarteira({
  posicoes,
  ordem,
  aoMudarOrdem,
  carregando,
  erros,
  aoEditar,
  aoRemover,
  aoAbrirHistorico,
  aoCarregarExemplo,
}) {
  // Estado de carteira vazia: em vez de uma tabela sem nada, um convite para começar
  if (posicoes.length === 0) {
    return (
      <div className="vazio">
        <div className="vazio__icone" aria-hidden="true">
          <Wallet size={30} />
        </div>
        <p className="vazio__titulo">Sua carteira está vazia</p>
        <p className="vazio__texto">Cadastre seu primeiro ativo para acompanhar o valor e o lucro em tempo real.</p>
        {/* Leva o foco direto ao campo do ticker. É botão (e não link "#campo-ticker")
            porque com o HashRouter o # do endereço é usado para as páginas. */}
        <button
          type="button"
          className="botao botao--fantasma"
          onClick={() => document.getElementById('campo-ticker')?.focus()}
        >
          Adicionar ativo
        </button>
        <button type="button" className="botao botao--fantasma" onClick={aoCarregarExemplo}>
          Ver carteira de exemplo
        </button>
      </div>
    )
  }

  const rotuloDaOrdem = OPCOES_ORDENACAO.find((o) => o.valor === ordem)?.rotulo

  return (
    <div className="lista">
      {/* Barra de ferramentas da lista: ordenar (só faz sentido com 2+ ativos).
          Exportar CSV fica na barra do topo, junto com as outras ações gerais. */}
      {posicoes.length > 1 && (
        <div className="lista__barra">
          <label className="lista__ordenar">
            <span className="campo__rotulo">Ordenar por</span>
            <select className="seletor" value={ordem} onChange={(evento) => aoMudarOrdem(evento.target.value)}>
              {OPCOES_ORDENACAO.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Aviso para leitores de tela quando a ordem muda (a tabela muda sem o foco sair do seletor) */}
      <p className="sr-only" role="status">
        Lista ordenada por: {rotuloDaOrdem}.
      </p>

      <div className="tabela-rolagem">
        <table className="tabela">
          <caption className="sr-only">Ativos da carteira com preço atual e lucro</caption>
          <thead>
            <tr>
              <th scope="col">Ativo</th>
              <th scope="col">Qtd.</th>
              <th scope="col">Preço médio</th>
              <th scope="col">Preço atual</th>
              <th scope="col">Valor atual</th>
              <th scope="col">Lucro / prejuízo</th>
              <th scope="col">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* key={id}: o React usa a chave para saber qual linha é qual ao atualizar (e ao reordenar) */}
            {posicoes.map((posicao) => (
              <LinhaAtivo
                key={posicao.id}
                posicao={posicao}
                carregando={carregando}
                erro={erros[posicao.ticker]}
                aoEditar={aoEditar}
                aoRemover={aoRemover}
                aoAbrirHistorico={aoAbrirHistorico}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ListaCarteira
