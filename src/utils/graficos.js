// Peças em comum dos gráficos do Chart.js (evolução do patrimônio, comparação com o Ibovespa,
// rentabilidade por ativo). Ficam aqui para os gráficos terem a mesma cara e não repetirem código.

import { lerCor } from './cores.js'
import { prefereMenosMovimento } from '../hooks/useNumeroAnimado.js'

// 1785207600000 → "28/07"
export function formatarDiaMes(ms) {
  return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// 1785207600000 → "ter., 28 de julho de 2026"
export function formatarDataCompleta(ms) {
  return new Date(ms).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })
}

// Animação dos gráficos: desligada para quem pediu "reduzir movimento" no sistema
export function animacaoDosGraficos() {
  return prefereMenosMovimento() ? false : { duration: 600 }
}

// Estilo do balão (tooltip) igual ao do resto do site, com as cores do tema atual
export function estiloDoBalao() {
  return {
    backgroundColor: lerCor('--cor-fundo'),
    borderColor: lerCor('--cor-borda-forte'),
    borderWidth: 1,
    titleColor: lerCor('--cor-texto'),
    bodyColor: lerCor('--cor-texto-secundario'),
    padding: 12,
    cornerRadius: 10,
    boxPadding: 6,
  }
}

// Eixos discretos: sem grade no X, grade fraca no Y, rótulos na cor secundária
export function estiloDosEixos() {
  const corTexto = lerCor('--cor-texto-secundario')
  const corGrade = lerCor('--cor-borda')
  return {
    x: { grid: { display: false }, border: { color: corGrade }, ticks: { color: corTexto, maxTicksLimit: 6, maxRotation: 0 } },
    y: { grace: '5%', grid: { color: corGrade }, border: { display: false }, ticks: { color: corTexto } },
  }
}

// Degradê vertical para preencher a área abaixo de uma linha.
// O Chart.js chama esta função ao desenhar; na primeira vez ainda não sabe o tamanho do gráfico.
// cor precisa ser um hexadecimal de 6 dígitos (ex: "#8b5cf6"): somamos a opacidade no final.
export function degradeSobAlinha(cor) {
  return ({ chart }) => {
    const { ctx, chartArea } = chart
    if (!chartArea) return 'transparent'
    const degrade = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
    degrade.addColorStop(0, `${cor}55`) // 55 = ~33% de opacidade
    degrade.addColorStop(1, `${cor}00`) // 00 = transparente
    return degrade
  }
}
