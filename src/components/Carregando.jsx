// Aparece enquanto o código de uma página ou de um gráfico está sendo baixado
// (eles são carregados sob demanda, ver App.jsx). role="status" avisa o leitor de tela.
// - altura: altura do bloco cinza (padrão: o tamanho de um gráfico)
function Carregando({ altura = 260, texto = 'Carregando…' }) {
  return (
    <div role="status" className="carregando">
      <span className="esqueleto carregando__bloco" style={{ height: `${altura}px` }} />
      <span className="sr-only">{texto}</span>
    </div>
  )
}

export default Carregando
