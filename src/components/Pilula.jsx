import { tipoVariacao } from '../utils/formatacao.js'

// "Pílula" arredondada verde (ganho) ou vermelha (perda).
// - valor: número usado para decidir a cor (positivo, negativo ou zero)
// - children: o texto que aparece dentro (ex: "+2,35%")
function Pilula({ valor, children }) {
  const tipo = tipoVariacao(valor)
  // A seta reforça o sentido para quem não diferencia bem verde e vermelho
  const seta = tipo === 'ganho' ? '▲' : tipo === 'perda' ? '▼' : ''

  return (
    <span className={`pilula pilula--${tipo}`}>
      {seta && <span aria-hidden="true">{seta}</span>}
      {children}
    </span>
  )
}

export default Pilula
