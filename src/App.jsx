import { useEffect, useMemo, useState } from 'react'
import Cabecalho from './components/Cabecalho.jsx'
import { carregarCarteira, salvarCarteira } from './utils/storage.js'
import { calcularPosicoes, calcularResumo } from './utils/calculos.js'
import './App.css'

// Componente principal: guarda o estado da carteira e monta o layout.
// Os outros componentes recebem os dados e as funções por props.
function App() {
  // ---------- Estado ----------

  // Lista de ativos. Passamos uma FUNÇÃO para o useState: assim o
  // localStorage só é lido uma vez, quando o app abre (e não a cada render).
  const [ativos, setAtivos] = useState(carregarCarteira)

  // Cotações da brapi, no formato { PETR4: {...}, VALE3: {...} }
  const [cotacoes] = useState({})

  // Toda vez que a lista de ativos muda, salvamos no navegador
  useEffect(() => {
    salvarCarteira(ativos)
  }, [ativos])

  // ---------- Ações sobre a carteira ----------
  // Sempre criamos uma NOVA lista (nunca alteramos a antiga),
  // porque é assim que o React percebe que algo mudou e redesenha a tela.

  function adicionarAtivo(novoAtivo) {
    setAtivos((atuais) => [...atuais, novoAtivo])
  }

  // mudancas: só os campos que mudaram, ex { quantidade: 200 }
  function editarAtivo(id, mudancas) {
    setAtivos((atuais) => atuais.map((a) => (a.id === id ? { ...a, ...mudancas } : a)))
  }

  function removerAtivo(id) {
    setAtivos((atuais) => atuais.filter((a) => a.id !== id))
  }

  // ---------- Valores calculados ----------
  // useMemo: só recalcula quando os ativos ou as cotações mudam
  const posicoes = useMemo(() => calcularPosicoes(ativos, cotacoes), [ativos, cotacoes])
  const resumo = useMemo(() => calcularResumo(posicoes), [posicoes])

  // As funções acima serão usadas pelos componentes do marco 3
  void adicionarAtivo
  void editarAtivo
  void removerAtivo

  return (
    <div className="app">
      <Cabecalho />

      <main className="grid">
        <section className="cartao grid__resumo" aria-label="Resumo da carteira">
          <h2 className="cartao__titulo">Resumo</h2>
          <p>{resumo.quantidadeAtivos} ativo(s) na carteira</p>
        </section>

        <section className="cartao grid__formulario" aria-label="Adicionar ativo">
          <h2 className="cartao__titulo">Adicionar ativo</h2>
        </section>

        <section className="cartao grid__lista" aria-label="Ativos da carteira">
          <h2 className="cartao__titulo">Meus ativos</h2>
        </section>

        <section className="cartao grid__grafico" aria-label="Distribuição da carteira">
          <h2 className="cartao__titulo">Distribuição</h2>
        </section>
      </main>

      <footer className="rodape">
        VAULT · Grupo 5 · DW2 — cotações da <a href="https://brapi.dev">brapi</a> com atraso de ~30 min
      </footer>
    </div>
  )
}

export default App
