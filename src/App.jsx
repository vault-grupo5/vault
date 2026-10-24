import Cabecalho from './components/Cabecalho.jsx'
import './App.css'

// Componente principal: monta o layout da página.
// Por enquanto (marco 1) os cartões são só espaços reservados;
// os componentes de verdade entram nos próximos marcos.
function App() {
  return (
    <div className="app">
      <Cabecalho />

      <main className="grid">
        <section className="cartao grid__resumo" aria-label="Resumo da carteira">
          <h2 className="cartao__titulo">Resumo</h2>
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
