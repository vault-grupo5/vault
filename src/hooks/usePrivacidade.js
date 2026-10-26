import { useState } from 'react'

const CHAVE_PRIVACIDADE = 'vault:privacidade'

function lerEscolha() {
  try {
    return localStorage.getItem(CHAVE_PRIVACIDADE) === 'ligado'
  } catch {
    return false
  }
}

// Liga/desliga o modo privacidade e guarda a escolha no navegador.
// Devolve { ocultar, alternar }. O valor é distribuído para a página pelo
// PrivacidadeContexto (ver hooks/useMoeda.js).
export function usePrivacidade() {
  const [ocultar, setOcultar] = useState(lerEscolha)

  function alternar() {
    const novo = !ocultar
    setOcultar(novo)
    try {
      localStorage.setItem(CHAVE_PRIVACIDADE, novo ? 'ligado' : 'desligado')
    } catch {
      // Sem localStorage, a escolha só vale até fechar a página
    }
  }

  return { ocultar, alternar }
}
