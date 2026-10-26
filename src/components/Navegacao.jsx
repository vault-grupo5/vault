import { NavLink } from 'react-router-dom'
import { ChartLine, LayoutDashboard, Wallet } from 'lucide-react'
import Logo from './Logo.jsx'
import './Navegacao.css'

// As páginas do site. "caminho" é o que aparece depois do # no endereço (ex: .../vault/#/ativos).
const PAGINAS = [
  { caminho: '/', rotulo: 'Visão geral', Icone: LayoutDashboard },
  { caminho: '/ativos', rotulo: 'Meus ativos', Icone: Wallet },
  { caminho: '/analises', rotulo: 'Análises', Icone: ChartLine },
]

// Navegação principal. É UM elemento <nav> só: o CSS (Navegacao.css) o mostra como
// menu lateral no computador e como barra fixa embaixo no celular.
//
// O NavLink do react-router já faz duas coisas de acessibilidade sozinho:
// - coloca aria-current="page" no link da página aberta (o leitor de tela diz "página atual");
// - nos dá isActive, que usamos para destacar o link visualmente.
function Navegacao() {
  return (
    <nav className="navegacao" aria-label="Principal">
      <div className="navegacao__marca">
        <Logo tamanho={34} comNome />
      </div>

      <ul className="navegacao__lista">
        {PAGINAS.map(({ caminho, rotulo, Icone }) => (
          <li key={caminho}>
            {/* end: o link "/" só fica ativo na página inicial, não em todas */}
            <NavLink
              to={caminho}
              end
              className={({ isActive }) => `navegacao__link ${isActive ? 'navegacao__link--ativo' : ''}`}
            >
              <Icone className="navegacao__icone" size={20} aria-hidden="true" />
              <span>{rotulo}</span>
            </NavLink>
          </li>
        ))}
      </ul>

    </nav>
  )
}

export default Navegacao
