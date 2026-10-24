// Lê uma variável CSS de styles/variaveis.css (ex: '--cor-grafico-1' → '#8b5cf6').
// Os gráficos do Chart.js são desenhados num <canvas>, que não entende "var(--cor)",
// então lemos o valor pronto aqui. Assim as cores ficam definidas num lugar só
// (o CSS) e os gráficos usam as mesmas do resto do site, inclusive no tema claro.
export function lerCor(nome) {
  if (typeof document === 'undefined') return '#888888'
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim()
}
