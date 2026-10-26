import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import VisaoGeral from './paginas/VisaoGeral.jsx'
import MeusAtivos from './paginas/MeusAtivos.jsx'
import Analises from './paginas/Analises.jsx'
import { useCarteira } from './hooks/useCarteira.js'
import { useTema } from './hooks/useTema.js'

// Componente principal: cria o estado da carteira (uma vez só) e define as páginas.
//
// Por que HashRouter: o GitHub Pages só entrega arquivos. Num endereço como
// .../vault/ativos ele procuraria um arquivo "ativos" e daria erro 404 ao recarregar.
// Com o HashRouter a rota fica depois do # (.../vault/#/ativos): o servidor sempre
// entrega o index.html e o React decide qual página mostrar.
function App() {
  const carteira = useCarteira()
  const { tema, alternar: alternarTema } = useTema()

  return (
    <HashRouter>
      <Routes>
        {/* Rota "pai": o Layout (menu, topo, rodapé) envolve todas as páginas */}
        <Route element={<Layout carteira={carteira} tema={tema} aoAlternarTema={alternarTema} />}>
          <Route index element={<VisaoGeral carteira={carteira} />} />
          <Route path="ativos" element={<MeusAtivos carteira={carteira} />} />
          <Route path="analises" element={<Analises carteira={carteira} />} />
          {/* Endereço que não existe: volta para a visão geral */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
