import { CircleAlert } from 'lucide-react'

// Faixa de erro mostrada no topo quando NENHUMA cotação pôde ser carregada
// (ex: sem internet ou limite da API). Tem um botão para tentar de novo.
// role="alert": o leitor de tela lê a mensagem assim que ela aparece.
function BannerErro({ mensagem, aoTentarDeNovo }) {
  return (
    <div className="banner-erro" role="alert">
      <CircleAlert className="banner-erro__icone" size={22} aria-hidden="true" />
      <p className="banner-erro__texto">
        <strong>Não foi possível buscar as cotações.</strong> {mensagem}
      </p>
      <button type="button" className="botao botao--fantasma" onClick={aoTentarDeNovo}>
        Tentar de novo
      </button>
    </div>
  )
}

export default BannerErro
