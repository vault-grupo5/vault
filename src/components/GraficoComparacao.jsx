import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Info } from 'lucide-react'
import Pilula from './Pilula.jsx'
import { formatarPorcentagem } from '../utils/formatacao.js'
import { lerCor } from '../utils/cores.js'
import {
  animacaoDosGraficos,
  estiloDoBalao,
  estiloDosEixos,
  formatarDataCompleta,
  formatarDiaMes,
} from '../utils/graficos.js'
import './Analises.css'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip)

// "+2,15 p.p." (pontos percentuais: a diferença entre duas porcentagens)
const formatarPontosPercentuais = (valor) => formatarPorcentagem(valor).replace('%', ' p.p.')

// Rentabilidade da carteira × Ibovespa no mesmo período (página Análises).
// As duas linhas começam em 0% e mostram quanto cada uma subiu ou caiu desde o primeiro dia.
// Como as duas séries estão na MESMA unidade (%), usamos um eixo só.
//
// Props:
// - comparacao: resultado de compararComIndice (utils/evolucao.js)
function GraficoComparacao({ comparacao }) {
  const { pontos, carteira, indice, diferenca } = comparacao
  const corCarteira = lerCor('--cor-grafico-1') // roxo
  const corIndice = lerCor('--cor-grafico-3') // laranja (par validado para daltonismo nos dois temas)

  const dados = {
    labels: pontos.map((p) => formatarDiaMes(p.data)),
    datasets: [
      {
        label: 'Sua carteira',
        data: pontos.map((p) => p.carteira),
        borderColor: corCarteira,
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: corCarteira,
      },
      {
        label: 'Ibovespa',
        data: pontos.map((p) => p.indice),
        borderColor: corIndice,
        borderWidth: 2,
        borderDash: [6, 4], // tracejado: diferencia as linhas mesmo sem enxergar a cor
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: corIndice,
      },
    ],
  }

  const eixos = estiloDosEixos()
  eixos.y.ticks.callback = (valor) => formatarPorcentagem(valor)

  const opcoes = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animacaoDosGraficos(),
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false }, // legenda em HTML, abaixo do gráfico
      tooltip: {
        ...estiloDoBalao(),
        callbacks: {
          title: (itens) => formatarDataCompleta(pontos[itens[0].dataIndex].data),
          label: (item) => ` ${item.dataset.label}: ${formatarPorcentagem(item.parsed.y)}`,
        },
      },
    },
    scales: eixos,
  }

  const acima = diferenca >= 0
  const descricao =
    `Gráfico de linhas comparando a rentabilidade desde ${formatarDiaMes(pontos[0].data)}: ` +
    `sua carteira ${formatarPorcentagem(carteira)} e o Ibovespa ${formatarPorcentagem(indice)}.`

  return (
    <div className="analise">
      <dl className="analise__numeros">
        <div className="indicador">
          <dt className="indicador__rotulo">Sua carteira</dt>
          <dd className="indicador__valor">
            <Pilula valor={carteira}>{formatarPorcentagem(carteira)}</Pilula>
          </dd>
        </div>
        <div className="indicador">
          <dt className="indicador__rotulo">Ibovespa</dt>
          <dd className="indicador__valor">
            <Pilula valor={indice}>{formatarPorcentagem(indice)}</Pilula>
          </dd>
        </div>
        <div className="indicador">
          <dt className="indicador__rotulo">Diferença</dt>
          <dd className={`indicador__valor texto--${acima ? 'ganho' : 'perda'}`}>
            {formatarPontosPercentuais(diferenca)} {acima ? 'acima' : 'abaixo'} do Ibovespa
          </dd>
        </div>
      </dl>

      <figure className="analise__figura">
        <div className="analise__grafico">
          <Line data={dados} options={opcoes} role="img" aria-label={descricao} />
        </div>
        {/* Duas séries: a legenda identifica cada uma pela cor E pelo traço (contínuo × tracejado) */}
        <figcaption className="analise__legenda">
          <span className="analise__legenda-item">
            <span className="analise__traco" style={{ borderColor: corCarteira }} aria-hidden="true" />
            Sua carteira
          </span>
          <span className="analise__legenda-item">
            <span className="analise__traco analise__traco--tracejado" style={{ borderColor: corIndice }} aria-hidden="true" />
            Ibovespa
          </span>
        </figcaption>
      </figure>

      <p className="analise__nota">
        <Info size={16} aria-hidden="true" />
        <span>
          Rentabilidade só pela variação de preço, com a quantidade atual de cada ativo (dividendos e proventos não
          entram). O Ibovespa vem da brapi pelo símbolo ^BVSP.
        </span>
      </p>

      <details className="analise__tabela">
        <summary>Ver dados em tabela</summary>
        <div className="analise__tabela-rolagem">
          <table>
            <caption className="sr-only">Rentabilidade acumulada por dia: carteira e Ibovespa</caption>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Sua carteira</th>
                <th scope="col">Ibovespa</th>
              </tr>
            </thead>
            <tbody>
              {[...pontos].reverse().map((p) => (
                <tr key={p.data}>
                  <td>{formatarDataCompleta(p.data)}</td>
                  <td>{formatarPorcentagem(p.carteira)}</td>
                  <td>{formatarPorcentagem(p.indice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

export default GraficoComparacao
