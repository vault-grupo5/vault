import { useMemo, useRef } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { calcularDistribuicao } from '../utils/calculos.js'
import { formatarMoeda, formatarPorcentagem } from '../utils/formatacao.js'
import { lerCor } from '../utils/cores.js'
import './GraficoPizza.css'

// O Chart.js é dividido em partes; registramos só as que usamos
// (ArcElement = as fatias, Tooltip = o balão ao passar o mouse). Deixa o site mais leve.
ChartJS.register(ArcElement, Tooltip)

// Participação de cada fatia é sempre positiva, então tiramos o sinal de '+': 82,50%
const formatarParticipacao = (valor) => formatarPorcentagem(valor).replace('+', '')

const MAXIMO_DE_FATIAS = 6 // temos 6 cores; a partir do 7º ativo, os menores viram "Outros"

// Monta as fatias: [{ ticker, valor, percentual, variavelCor }]
// variavelCor é o NOME da variável CSS da cor (ex: '--cor-grafico-2'). A cor em si é lida só na hora
// de desenhar (veja GraficoPizza abaixo), para acompanhar o tema claro/escuro.
// - posicoes chega na ordem da carteira (ordem de cadastro)
// - a COR segue essa ordem, e não o tamanho: se um ativo passar outro em valor,
//   as fatias trocam de lugar mas cada ativo continua com a sua cor
function montarFatias(posicoes) {
  const distribuicao = calcularDistribuicao(posicoes) // já vem do maior para o menor

  let principais = distribuicao
  let outros = null
  if (distribuicao.length > MAXIMO_DE_FATIAS) {
    // Ficam os 5 maiores; o resto é somado numa fatia "Outros"
    principais = distribuicao.slice(0, MAXIMO_DE_FATIAS - 1)
    const resto = distribuicao.slice(MAXIMO_DE_FATIAS - 1)
    outros = {
      ticker: `Outros (${resto.length})`,
      valor: resto.reduce((soma, f) => soma + f.valor, 0),
      percentual: resto.reduce((soma, f) => soma + f.percentual, 0),
      variavelCor: '--cor-grafico-outros',
    }
  }

  // Índice de cor de cada ticker = posição dele na carteira, entre os que aparecem
  const tickersPrincipais = new Set(principais.map((f) => f.ticker))
  const ordemDaCarteira = posicoes.map((p) => p.ticker).filter((t) => tickersPrincipais.has(t))

  const fatias = principais.map((f) => ({
    ...f,
    variavelCor: `--cor-grafico-${ordemDaCarteira.indexOf(f.ticker) + 1}`,
  }))
  return outros ? [...fatias, outros] : fatias
}

// Gráfico de pizza com a distribuição da carteira + legenda com os valores.
// - posicoes: ativos com os cálculos feitos (de calcularPosicoes)
function GraficoPizza({ posicoes }) {
  const refGrafico = useRef(null)
  // A distribuição só é recalculada quando a carteira muda...
  const fatiasBase = useMemo(() => montarFatias(posicoes), [posicoes])
  // ...mas as cores são lidas do CSS A CADA renderização (é barato: são poucas). Assim, quando o tema
  // troca, o App renderiza de novo e as fatias já saem com as cores do tema novo.
  const fatias = fatiasBase.map((fatia) => ({ ...fatia, cor: lerCor(fatia.variavelCor) }))

  if (fatias.length === 0) {
    return <p className="grafico__vazio">O gráfico aparece quando você adicionar ativos.</p>
  }

  // Dados no formato que o Chart.js espera
  const dados = {
    labels: fatias.map((f) => f.ticker),
    datasets: [
      {
        data: fatias.map((f) => f.valor),
        backgroundColor: fatias.map((f) => f.cor),
        // Borda da cor do cartão: cria um "respiro" de 2px entre as fatias
        borderColor: lerCor('--cor-cartao'),
        borderWidth: 2,
        hoverOffset: 8, // a fatia "salta" um pouco ao passar o mouse
      },
    ],
  }

  // Quem pediu "reduzir movimento" no sistema não vê a animação do gráfico
  const reduzirMovimento =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const opcoes = {
    responsive: true,
    maintainAspectRatio: true,
    animation: reduzirMovimento ? false : { duration: 600 },
    plugins: {
      legend: { display: false }, // usamos nossa própria legenda em HTML (abaixo)
      tooltip: {
        backgroundColor: lerCor('--cor-fundo'),
        borderColor: lerCor('--cor-borda-forte'),
        borderWidth: 1,
        titleColor: lerCor('--cor-texto'),
        bodyColor: lerCor('--cor-texto-secundario'),
        padding: 12,
        cornerRadius: 10,
        boxPadding: 6,
        callbacks: {
          // Texto do balão: "R$ 3.312,00 · 82,50%"
          label: (contexto) => {
            const fatia = fatias[contexto.dataIndex]
            return ` ${formatarMoeda(fatia.valor)} · ${formatarParticipacao(fatia.percentual)}`
          },
        },
      },
    },
  }

  // Passar o mouse (ou o foco do teclado) num item da legenda destaca a fatia no gráfico
  function destacarFatia(indice) {
    const grafico = refGrafico.current
    if (!grafico) return
    const ativos = indice === null ? [] : [{ datasetIndex: 0, index: indice }]
    grafico.setActiveElements(ativos)
    grafico.tooltip.setActiveElements(ativos, { x: 0, y: 0 })
    grafico.update()
  }

  // Texto alternativo para leitores de tela (o canvas em si é só uma imagem)
  const descricao = `Distribuição da carteira: ${fatias
    .map((f) => `${f.ticker} ${formatarParticipacao(f.percentual)}`)
    .join(', ')}`

  return (
    <div className="grafico">
      <div className="grafico__pizza">
        <Pie ref={refGrafico} data={dados} options={opcoes} role="img" aria-label={descricao} />
      </div>

      {/* Legenda: identifica cada cor e mostra os números (não depende só da cor) */}
      <ul className="grafico__legenda">
        {fatias.map((fatia, indice) => (
          <li
            key={fatia.ticker}
            className="legenda__item"
            tabIndex={0}
            onMouseEnter={() => destacarFatia(indice)}
            onMouseLeave={() => destacarFatia(null)}
            onFocus={() => destacarFatia(indice)}
            onBlur={() => destacarFatia(null)}
          >
            <span className="legenda__cor" style={{ background: fatia.cor }} aria-hidden="true" />
            <span className="legenda__ticker">{fatia.ticker}</span>
            <span className="legenda__percentual">{formatarParticipacao(fatia.percentual)}</span>
            <span className="legenda__valor">{formatarMoeda(fatia.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default GraficoPizza
