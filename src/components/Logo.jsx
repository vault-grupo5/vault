import './Logo.css'

// Logo do VAULT: a porta de um cofre vista de frente, com o volante do segredo no centro.
// É um SVG desenhado à mão (só formas simples), então fica nítido em qualquer tamanho
// e troca de cor junto com o tema, porque as cores vêm das variáveis CSS (ver Logo.css).
//
// O mesmo desenho, com as cores fixas, está em public/favicon.svg (ícone da aba).
//
// Props:
// - tamanho: largura/altura em px (padrão 36)
// - comNome: mostra o texto "VAULT" ao lado do desenho
function Logo({ tamanho = 36, comNome = false }) {
  return (
    <span className="logo">
      <svg className="logo__desenho" width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true">
        {/* Porta do cofre */}
        <rect className="logo__porta" x="2" y="2" width="28" height="28" rx="8" />
        {/* Moldura interna, dá a sensação de profundidade */}
        <rect className="logo__moldura" x="5" y="5" width="22" height="22" rx="5.5" />
        {/* Dobradiças no lado esquerdo */}
        <rect className="logo__detalhe" x="0.8" y="8.5" width="2.6" height="4.5" rx="1.1" />
        <rect className="logo__detalhe" x="0.8" y="19" width="2.6" height="4.5" rx="1.1" />
        {/* Volante do cofre: aro, três raios que atravessam o aro e terminam em manoplas, e o miolo */}
        <circle className="logo__traco" cx="16" cy="16" r="5" />
        <path className="logo__traco" d="M16 16V8.2M16 16l6.75 3.9M16 16l-6.75 3.9" />
        <circle className="logo__miolo" cx="16" cy="8.2" r="1.6" />
        <circle className="logo__miolo" cx="22.75" cy="19.9" r="1.6" />
        <circle className="logo__miolo" cx="9.25" cy="19.9" r="1.6" />
        <circle className="logo__miolo" cx="16" cy="16" r="2" />
      </svg>
      {comNome && <span className="logo__nome">VAULT</span>}
    </span>
  )
}

export default Logo
