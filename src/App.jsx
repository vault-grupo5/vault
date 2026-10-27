import { lazy } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import VisaoGeral from './paginas/VisaoGeral.jsx'
import { useCarteira } from './hooks/useCarteira.js'
import { useTema } from './hooks/useTema.js'
import { usePrivacidade } from './hooks/usePrivacidade.js'
import { PrivacidadeContexto } from './hooks/useMoeda.js'

// Páginas carregadas SOB DEMANDA (lazy): o código delas (e o do Chart.js, que elas usam)
// só é baixado quando a pessoa abre a página. Assim a primeira visita ao site fica mais leve.
// A Visão geral é a página inicial, então vem junto com o resto.
const MeusAtivos = lazy(() => import('./paginas/MeusAtivos.jsx'))
const Analises = lazy(() => import('./paginas/Analises.jsx'))

// Componente principal: cria o estado da carteira (uma vez só) e define as páginas.
//
// Por que HashRouter: o GitHub Pages só entrega arquivos. Num endereço como
// .../vault/ativos ele procuraria um arquivo "ativos" e daria erro 404 ao recarregar.
// Com o HashRouter a rota fica depois do # (.../vault/#/ativos): o servidor sempre
// entrega o index.html e o React decide qual página mostrar.
function App() {
  const carteira = useCarteira()
  const { tema, alternar: alternarTema } = useTema()
  const { ocultar, alternar: alternarPrivacidade } = usePrivacidade()

  const layout = (
    <Layout
      carteira={carteira}
      tema={tema}
      aoAlternarTema={alternarTema}
      ocultarValores={ocultar}
      aoAlternarPrivacidade={alternarPrivacidade}
    />
  )

  return (
    // O Provider "espalha" o modo privacidade para todos os componentes de dentro (ver hooks/useMoeda.js)
    <PrivacidadeContexto.Provider value={ocultar}>
      <HashRouter>
        <Routes>
          {/* Rota "pai": o Layout (menu, topo, rodapé) envolve todas as páginas */}
          <Route element={layout}>
            <Route index element={<VisaoGeral carteira={carteira} />} />
            <Route path="ativos" element={<MeusAtivos carteira={carteira} />} />
            <Route path="analises" element={<Analises carteira={carteira} />} />
            {/* Endereço que não existe: volta para a visão geral */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </PrivacidadeContexto.Provider>
  )
}

export default App
