import { separarCentavos } from '../utils/formatacao.js'
import { useMoeda, VALOR_OCULTO } from '../hooks/useMoeda.js'

// Mostra um valor em reais com os centavos "apagados" (cor mais fraca).
// Ex: R$ 12.345,67 → "R$ 12.345" em destaque e ",67" mais clarinho.
// Isso ajuda o olho a ler primeiro o que importa: a parte inteira.
// No modo privacidade mostra "R$ •••••" (e o leitor de tela ouve "valor oculto").
function Dinheiro({ valor, className = '' }) {
  const { ocultar } = useMoeda()

  if (ocultar) {
    return (
      <span className={`dinheiro ${className}`}>
        {/* Os pontinhos são só visuais; o leitor de tela lê "valor oculto" */}
        <span aria-hidden="true">{VALOR_OCULTO}</span>
        <span className="sr-only">valor oculto</span>
      </span>
    )
  }

  const { inteiro, centavos } = separarCentavos(valor)

  return (
    <span className={`dinheiro ${className}`}>
      {inteiro}
      <span className="dinheiro__centavos">{centavos}</span>
    </span>
  )
}

export default Dinheiro
