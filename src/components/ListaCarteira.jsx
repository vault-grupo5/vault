import LinhaAtivo from './LinhaAtivo.jsx'
import './ListaCarteira.css'

// Tabela com todos os ativos da carteira.
// No computador é uma tabela normal; no celular cada linha vira um cartão (ver ListaCarteira.css).
//
// Props:
// - posicoes: ativos com os cálculos feitos
// - carregando: true enquanto as cotações chegam
// - erros: { PETR4: 'mensagem' } com as cotações que falharam
// - aoEditar, aoRemover: funções do App
function ListaCarteira({ posicoes, carregando, erros, aoEditar, aoRemover }) {
  // Estado de carteira vazia: em vez de uma tabela sem nada, um convite para começar
  if (posicoes.length === 0) {
    return (
      <div className="vazio">
        <div className="vazio__icone" aria-hidden="true">
          ◔
        </div>
        <p className="vazio__titulo">Sua carteira está vazia</p>
        <p className="vazio__texto">Cadastre seu primeiro ativo para acompanhar o valor e o lucro em tempo real.</p>
        {/* Link interno: leva o foco direto ao campo do ticker */}
        <a className="botao botao--fantasma" href="#campo-ticker">
          Adicionar ativo
        </a>
      </div>
    )
  }

  return (
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
          {/* key={id}: o React usa a chave para saber qual linha é qual ao atualizar */}
          {posicoes.map((posicao) => (
            <LinhaAtivo
              key={posicao.id}
              posicao={posicao}
              carregando={carregando}
              erro={erros[posicao.ticker]}
              aoEditar={aoEditar}
              aoRemover={aoRemover}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ListaCarteira
