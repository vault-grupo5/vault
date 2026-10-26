import { useMemo } from 'react'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { Info } from 'lucide-react'
import { useMoeda } from '../hooks/useMoeda.js'
import { formatarPorcentagem } from '../utils/formatacao.js'
import { lerCor } from '../utils/cores.js'
import { animacaoDosGraficos, estiloDoBalao } from '../utils/graficos.js'
import './Analises.css'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip)

// Rentabilidade de cada ativo desde a compra (preço atual comparado ao preço médio),
// em barras horizontais: do que mais rendeu (no topo) ao que mais perdeu (embaixo).
// Verde = lucro, vermelho = prejuízo. Para não depender só da cor (daltonismo), o sentido
// também aparece na direção da barra (direita/esquerda do zero) e no sinal do rótulo (+/−).
//
// Props:
// - posicoes: ativos com os cálculos (calcularPosicoes). Não faz requisição nenhuma:
//   usa as cotações que o app já tem.
function GraficoRentabilidade({ posicoes }) {
  const { moedaComSinal } = useMoeda()

  // Só entram ativos com cotação (sem preço atual não dá para saber a rentabilidade)
  const ordenadas = useMemo(
    () => posicoes.filter((p) => p.temCotacao).sort((a, b) => b.lucroPercentual - a.lucroPercentual),
    [posicoes],
  )
  const semCotacao = posicoes.filter((p) => !p.temCotacao).map((p) => p.ticker)

  if (ordenadas.length === 0) {
    return <p className="analise__vazio">As barras aparecem quando as cotações dos ativos carregarem.</p>
  }

  const valores = ordenadas.map((p) => p.lucroPercentual)
  const corGanho = lerCor('--cor-ganho')
  const corPerda = lerCor('--cor-perda')
  const corTexto = lerCor('--cor-texto')
  const corSecundaria = lerCor('--cor-texto-secundario')
  const corGrade = lerCor('--cor-borda')

  const dados = {
    labels: ordenadas.map((p) => p.ticker),
    datasets: [
      {
        label: 'Rentabilidade',
        data: valores,
        backgroundColor: valores.map((v) => (v >= 0 ? corGanho : corPerda)),
        borderRadius: 4, // pontas arredondadas
        borderSkipped: false,
        barThickness: 18, // barras finas, com espaço entre elas
      },
    ],
  }

  // Plugin (extensão do Chart.js) que escreve o valor na ponta de cada barra.
  // Com poucos ativos, ler o número direto na barra é mais rápido do que passar o mouse.
  const rotulosNasBarras = {
    id: 'rotulosNasBarras',
    afterDatasetsDraw(grafico) {
      const { ctx } = grafico
      ctx.save()
      ctx.font = '600 12px "Manrope Variable", system-ui, sans-serif'
      ctx.fillStyle = corTexto // o texto usa a cor de texto, não a cor da barra
      ctx.textBaseline = 'middle'
      grafico.getDatasetMeta(0).data.forEach((barra, indice) => {
        const valor = valores[indice]
        const positivo = valor >= 0
        // positivo: texto à direita da ponta; negativo: à esquerda
        ctx.textAlign = positivo ? 'left' : 'right'
        ctx.fillText(formatarPorcentagem(valor), barra.x + (positivo ? 6 : -6), barra.y)
      })
      ctx.restore()
    },
  }

  const opcoes = {
    indexAxis: 'y', // barras deitadas: o nome do ativo fica à esquerda, fácil de ler
    responsive: true,
    maintainAspectRatio: false,
    animation: animacaoDosGraficos(),
    plugins: {
      legend: { display: false }, // uma série só; as cores são explicadas no texto abaixo
      tooltip: {
        ...estiloDoBalao(),
        callbacks: {
          label: (item) => {
            const posicao = ordenadas[item.dataIndex]
            return ` ${formatarPorcentagem(posicao.lucroPercentual)} (${moedaComSinal(posicao.lucro)})`
          },
        },
      },
    },
    scales: {
      x: {
        grace: '25%', // folga nas pontas para caber o rótulo da barra
        // A linha do zero fica mais forte: é a referência entre lucro e prejuízo
        grid: { color: (contexto) => (contexto.tick.value === 0 ? corSecundaria : corGrade) },
        border: { display: false },
        ticks: { color: corSecundaria, callback: (valor) => formatarPorcentagem(valor) },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: corTexto, font: { weight: 600 } },
      },
    },
  }

  const descricao =
    'Gráfico de barras com a rentabilidade de cada ativo desde a compra: ' +
    ordenadas.map((p) => `${p.ticker} ${formatarPorcentagem(p.lucroPercentual)}`).join(', ')

  return (
    <div className="analise">
      {/* A altura cresce com o número de ativos (36 px por barra), para as barras não ficarem espremidas */}
      <div className="analise__barras" style={{ height: `${Math.max(160, ordenadas.length * 36 + 40)}px` }}>
        <Bar data={dados} options={opcoes} plugins={[rotulosNasBarras]} role="img" aria-label={descricao} />
      </div>

      <p className="analise__nota">
        <Info size={16} aria-hidden="true" />
        <span>
          Lucro ou prejuízo de cada ativo desde a compra: preço atual comparado ao seu preço médio. Barras em verde
          (para a direita) rendem; em vermelho (para a esquerda) estão no prejuízo.
          {semCotacao.length > 0 && ` Sem cotação agora, ficaram de fora: ${semCotacao.join(', ')}.`}
        </span>
      </p>

      <details className="analise__tabela">
        <summary>Ver dados em tabela</summary>
        <div className="analise__tabela-rolagem">
          <table>
            <caption className="sr-only">Rentabilidade por ativo, do maior para o menor</caption>
            <thead>
              <tr>
                <th scope="col">Ativo</th>
                <th scope="col">Rentabilidade</th>
                <th scope="col">Lucro / prejuízo</th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((p) => (
                <tr key={p.id}>
                  <td>{p.ticker}</td>
                  <td>{formatarPorcentagem(p.lucroPercentual)}</td>
                  <td>{moedaComSinal(p.lucro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

export default GraficoRentabilidade
