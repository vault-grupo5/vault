import { TrendingDown, TrendingUp } from 'lucide-react'
import { tipoVariacao } from '../utils/formatacao.js'

// "Pílula" arredondada verde (ganho) ou vermelha (perda).
// - valor: número usado para decidir a cor (positivo, negativo ou zero)
// - children: o texto que aparece dentro (ex: "+2,35%")
function Pilula({ valor, children }) {
  const tipo = tipoVariacao(valor)
  // O ícone de tendência reforça o sentido para quem não diferencia bem verde e vermelho
  const Icone = tipo === 'ganho' ? TrendingUp : tipo === 'perda' ? TrendingDown : null

  return (
    <span className={`pilula pilula--${tipo}`}>
      {Icone && <Icone size={13} strokeWidth={2.5} aria-hidden="true" />}
      {children}
    </span>
  )
}

export default Pilula
