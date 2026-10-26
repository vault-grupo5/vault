import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Info } from 'lucide-react'
import Pilula from './Pilula.jsx'
import { useMoeda } from '../hooks/useMoeda.js'
import { variacaoDoPeriodo } from '../utils/evolucao.js'
import { formatarPorcentagem } from '../utils/formatacao.js'
import { lerCor } from '../utils/cores.js'
import {
  animacaoDosGraficos,
  degradeSobAlinha,
  estiloDoBalao,
  estiloDosEixos,
  formatarDataCompleta,
  formatarDiaMes,
} from '../utils/graficos.js'
import './Analises.css'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip)

// Gráfico da evolução do patrimônio nos últimos 3 meses (página Análises).
//
// Props:
// - pontos: [{ data, valor }] de calcularEvolucao (utils/evolucao.js)
// - semHistorico: tickers que ficaram fora da soma por falta de histórico
function GraficoEvolucao({ pontos, semHistorico }) {
  const { moeda } = useMoeda()
  const variacao = useMemo(() => variacaoDoPeriodo(pontos), [pontos])

  if (pontos.length < 2) {
    return <p className="analise__vazio">Ainda não há histórico suficiente para desenhar a evolução.</p>
  }

  const primeiro = pontos[0]
  const ultimo = pontos.at(-1)
  const corLinha = lerCor('--cor-grafico-1')

  const dados = {
    labels: pontos.map((p) => formatarDiaMes(p.data)),
    datasets: [
      {
        label: 'Patrimônio',
        data: pontos.map((p) => p.valor),
        borderColor: corLinha,
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: corLinha,
        pointHoverBorderColor: lerCor('--cor-cartao'),
        pointHoverBorderWidth: 2,
        fill: true,
        backgroundColor: degradeSobAlinha(corLinha),
      },
    ],
  }

  const eixos = estiloDosEixos()
  // Valores do eixo Y em reais (no modo privacidade viram "R$ •••••")
  eixos.y.ticks.callback = (valor) => moeda(valor).replace(/,\d{2}$/, '')

  const opcoes = {
    responsive: true,
    maintainAspectRatio: false, // a altura vem do CSS
    animation: animacaoDosGraficos(),
    interaction: { mode: 'index', intersect: false }, // o balão aparece para o dia mais perto do mouse
    plugins: {
      legend: { display: false }, // série única: o título do cartão já diz o que é
      tooltip: {
        ...estiloDoBalao(),
        callbacks: {
          title: (itens) => formatarDataCompleta(pontos[itens[0].dataIndex].data),
          label: (item) => ` Patrimônio: ${moeda(item.parsed.y)}`,
        },
      },
    },
    scales: eixos,
  }

  const descricao =
    `Gráfico de linha do patrimônio entre ${formatarDiaMes(primeiro.data)} e ${formatarDiaMes(ultimo.data)}: ` +
    `de ${moeda(primeiro.valor)} a ${moeda(ultimo.valor)} (${formatarPorcentagem(variacao)}).`

  return (
    <div className="analise">
      <dl className="analise__numeros">
        <div className="indicador">
          <dt className="indicador__rotulo">Em {formatarDiaMes(primeiro.data)}</dt>
          <dd className="indicador__valor">{moeda(primeiro.valor)}</dd>
        </div>
        <div className="indicador">
          <dt className="indicador__rotulo">Último fechamento ({formatarDiaMes(ultimo.data)})</dt>
          <dd className="indicador__valor">{moeda(ultimo.valor)}</dd>
        </div>
        <div className="indicador">
          <dt className="indicador__rotulo">Variação no período</dt>
          <dd className="indicador__valor">
            <Pilula valor={variacao}>{formatarPorcentagem(variacao)}</Pilula>
          </dd>
        </div>
      </dl>

      <div className="analise__grafico">
        <Line data={dados} options={opcoes} role="img" aria-label={descricao} />
      </div>

      {/* Aviso obrigatório: a conta usa a quantidade de HOJE em todos os dias */}
      <p className="analise__nota">
        <Info size={16} aria-hidden="true" />
        <span>
          O cálculo considera a <strong>quantidade atual</strong> de cada ativo em todos os dias, multiplicada pelo preço
          de fechamento daquele dia. Compras e vendas feitas nesses 3 meses não entram na conta.
          {semHistorico.length > 0 && ` Sem histórico na brapi, ficaram de fora: ${semHistorico.join(', ')}.`}
        </span>
      </p>

      {/* Alternativa em texto ao gráfico */}
      <details className="analise__tabela">
        <summary>Ver dados em tabela</summary>
        <div className="analise__tabela-rolagem">
          <table>
            <caption className="sr-only">Patrimônio por dia</caption>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Patrimônio</th>
              </tr>
            </thead>
            <tbody>
              {[...pontos].reverse().map((p) => (
                <tr key={p.data}>
                  <td>{formatarDataCompleta(p.data)}</td>
                  <td>{moeda(p.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

export default GraficoEvolucao
