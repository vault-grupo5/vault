import { separarCentavos } from '../utils/formatacao.js'

// Mostra um valor em reais com os centavos "apagados" (cor mais fraca).
// Ex: R$ 12.345,67 → "R$ 12.345" em destaque e ",67" mais clarinho.
// Isso ajuda o olho a ler primeiro o que importa: a parte inteira.
function Dinheiro({ valor, className = '' }) {
  const { inteiro, centavos } = separarCentavos(valor)

  return (
    <span className={`dinheiro ${className}`}>
      {inteiro}
      <span className="dinheiro__centavos">{centavos}</span>
    </span>
  )
}

export default Dinheiro
