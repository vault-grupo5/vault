import { FlaskConical } from 'lucide-react'
import './AvisoExemplo.css'

// Faixa fixa no topo de todas as páginas enquanto houver ativos da carteira de exemplo.
// Deixa claro que os números não são de uma carteira real e oferece o botão para limpar.
// - aoLimpar: remove só os ativos de exemplo (os reais continuam)
function AvisoExemplo({ aoLimpar }) {
  return (
    <section className="aviso-exemplo" aria-label="Carteira de exemplo">
      <FlaskConical className="aviso-exemplo__icone" size={20} aria-hidden="true" />
      <p className="aviso-exemplo__texto">
        <strong>Esta é uma carteira de exemplo.</strong> As quantidades e os preços médios são fictícios; as cotações
        são reais, da brapi.
      </p>
      <button type="button" className="botao botao--fantasma" onClick={aoLimpar}>
        Limpar exemplo
      </button>
    </section>
  )
}

export default AvisoExemplo
