import { useState } from 'react'
import './LogoAtivo.css'

// Logo da empresa (vem da brapi). Se não existir ou não carregar,
// mostramos um quadrado roxo com as duas primeiras letras do ticker.
// Usado na lista de ativos e no painel de histórico.
function LogoAtivo({ ticker, logo }) {
  const [quebrado, setQuebrado] = useState(false)

  if (logo && !quebrado) {
    return <img className="ativo__logo" src={logo} alt="" loading="lazy" onError={() => setQuebrado(true)} />
  }

  return (
    <span className="ativo__logo ativo__logo--iniciais" aria-hidden="true">
      {ticker.slice(0, 2)}
    </span>
  )
}

export default LogoAtivo
