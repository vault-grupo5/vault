import { useEffect, useMemo, useRef, useState } from 'react'
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
import { X } from 'lucide-react'
import LogoAtivo from './LogoAtivo.jsx'
import Pilula from './Pilula.jsx'
import { buscarHistorico } from '../services/brapi.js'
import { prefereMenosMovimento } from '../hooks/useNumeroAnimado.js'
import { lerCor } from '../utils/cores.js'
import { formatarMoeda, formatarPorcentagem } from '../utils/formatacao.js'
import './PainelHistorico.css'

// Registramos só as partes do Chart.js que o gráfico de linha usa:
// escalas (eixos), linha, pontos, preenchimento sob a linha e tooltip.
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip)

const formatarDiaMes = (ms) => new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
const formatarDataCompleta = (ms) =>
  new Date(ms).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })

// Painel (janela modal) com o gráfico dos últimos 3 meses de um ativo.
//
// Usamos o elemento <dialog> do HTML, que já resolve sozinho várias coisas de acessibilidade:
// - tecla Esc fecha;
// - o foco do teclado fica preso dentro do painel (Tab não "foge" para a página de trás);
// - o resto da página fica inerte para leitores de tela;
// - ao fechar, o foco volta para o botão que abriu o painel.
//
// Props:
// - posicao: o ativo com os cálculos (ticker, precoMedio, cotacao...)
// - aoFechar: chamado quando o painel é fechado (por qualquer caminho)
function PainelHistorico({ posicao, aoFechar }) {
  const { ticker, precoMedio, cotacao } = posicao
  const refDialogo = useRef(null)
  const [estado, setEstado] = useState({ status: 'carregando', historico: [], erro: '' })
  const [tentativa, setTentativa] = useState(0) // aumenta ao clicar em "Tentar de novo"

  // Abre como modal assim que o componente aparece na tela
  useEffect(() => {
    const dialogo = refDialogo.current
    if (dialogo && !dialogo.open) dialogo.showModal()
  }, [])

  // Busca o histórico (usa o cache de 1 hora do brapi.js)
  useEffect(() => {
    let cancelado = false // evita atualizar a tela se o painel já fechou

    buscarHistorico(ticker)
      .then((historico) => {
        if (!cancelado) setEstado({ status: 'pronto', historico, erro: '' })
      })
      .catch((erro) => {
        if (!cancelado) setEstado({ status: 'erro', historico: [], erro: erro.message })
      })

    return () => {
      cancelado = true
    }
  }, [ticker, tentativa])

  function tentarDeNovo() {
    setEstado({ status: 'carregando', historico: [], erro: '' })
    setTentativa((n) => n + 1)
  }

  function fechar() {
    refDialogo.current?.close() // dispara o evento "close", que chama aoFechar
  }

  // Clique no fundo escurecido (::backdrop) conta como clique no próprio <dialog>
  function aoClicarNoDialogo(evento) {
    if (evento.target === evento.currentTarget) fechar()
  }

  // ---------- Números do período ----------
  const resumo = useMemo(() => {
    const { historico } = estado
    if (historico.length === 0) return null
    const precos = historico.map((p) => p.fechamento)
    const primeiro = precos[0]
    const ultimo = precos.at(-1)
    return {
      primeiro,
      ultimo,
      variacao: ((ultimo - primeiro) / primeiro) * 100,
      minimo: Math.min(...precos),
      maximo: Math.max(...precos),
      inicio: historico[0].data,
      fim: historico.at(-1).data,
    }
  }, [estado])

  return (
    <dialog
      ref={refDialogo}
      className="painel"
      aria-labelledby="painel-titulo"
      onClose={aoFechar}
      onClick={aoClicarNoDialogo}
    >
      <div className="painel__conteudo">
        <header className="painel__cabecalho">
          <LogoAtivo ticker={ticker} logo={cotacao?.logo} />
          <div className="painel__titulos">
            <h2 className="painel__titulo" id="painel-titulo">
              {ticker}
            </h2>
            <p className="painel__subtitulo">{cotacao?.nome ?? 'Evolução do preço'} · últimos 3 meses</p>
          </div>
          <button type="button" className="botao botao--fantasma botao--icone" onClick={fechar} aria-label="Fechar painel">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {estado.status === 'carregando' && (
          <div className="painel__carregando" role="status" aria-live="polite">
            <div className="esqueleto painel__esqueleto" />
            <p className="painel__aviso">Carregando histórico de {ticker}…</p>
          </div>
        )}

        {estado.status === 'erro' && (
          <div className="painel__erro" role="alert">
            <p>
              <strong>Não foi possível carregar o histórico.</strong> {estado.erro}
            </p>
            <button type="button" className="botao botao--fantasma" onClick={tentarDeNovo}>
              Tentar de novo
            </button>
          </div>
        )}

        {estado.status === 'pronto' && resumo && (
          <>
            <dl className="painel__numeros">
              <div className="indicador">
                <dt className="indicador__rotulo">Preço atual</dt>
                <dd className="indicador__valor">{formatarMoeda(cotacao?.preco ?? resumo.ultimo)}</dd>
              </div>
              <div className="indicador">
                <dt className="indicador__rotulo">Variação em 3 meses</dt>
                <dd className="indicador__valor">
                  <Pilula valor={resumo.variacao}>{formatarPorcentagem(resumo.variacao)}</Pilula>
                </dd>
              </div>
              <div className="indicador">
                <dt className="indicador__rotulo">Mínima</dt>
                <dd className="indicador__valor">{formatarMoeda(resumo.minimo)}</dd>
              </div>
              <div className="indicador">
                <dt className="indicador__rotulo">Máxima</dt>
                <dd className="indicador__valor">{formatarMoeda(resumo.maximo)}</dd>
              </div>
            </dl>

            <GraficoLinha ticker={ticker} historico={estado.historico} precoMedio={precoMedio} resumo={resumo} />

            {/* Alternativa em texto ao gráfico, para quem usa leitor de tela ou prefere números */}
            <details className="painel__tabela">
              <summary>Ver dados em tabela</summary>
              <div className="painel__tabela-rolagem">
                <table>
                  <caption className="sr-only">Preço de fechamento de {ticker} por dia</caption>
                  <thead>
                    <tr>
                      <th scope="col">Data</th>
                      <th scope="col">Fechamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Do dia mais recente para o mais antigo */}
                    {[...estado.historico].reverse().map((ponto) => (
                      <tr key={ponto.data}>
                        <td>{formatarDataCompleta(ponto.data)}</td>
                        <td>{formatarMoeda(ponto.fechamento)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </div>
    </dialog>
  )
}

// O gráfico em si. Fica separado para o PainelHistorico ficar mais fácil de ler.
function GraficoLinha({ ticker, historico, precoMedio, resumo }) {
  const corLinha = lerCor('--cor-grafico-1')
  const corReferencia = lerCor('--cor-texto-secundario')
  const corGrade = lerCor('--cor-borda')

  const dados = {
    labels: historico.map((p) => formatarDiaMes(p.data)),
    datasets: [
      {
        label: 'Fechamento',
        data: historico.map((p) => p.fechamento),
        borderColor: corLinha,
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 0, // sem bolinhas na linha toda...
        pointHoverRadius: 5, // ...só ao passar o mouse
        pointHoverBackgroundColor: corLinha,
        pointHoverBorderColor: lerCor('--cor-cartao'),
        pointHoverBorderWidth: 2,
        fill: true,
        // Degradê sob a linha: precisa do tamanho da área do gráfico, por isso é uma função
        backgroundColor: ({ chart }) => {
          const { ctx, chartArea } = chart
          if (!chartArea) return 'transparent' // primeira passada, antes de medir
          const degrade = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          degrade.addColorStop(0, `${corLinha}55`) // 55 = ~33% de opacidade
          degrade.addColorStop(1, `${corLinha}00`) // 00 = transparente
          return degrade
        },
      },
      {
        // Linha de referência: quanto a pessoa pagou em média. Mostra se o preço está acima ou abaixo.
        label: 'Seu preço médio',
        data: historico.map(() => precoMedio),
        borderColor: corReferencia,
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
      },
    ],
  }

  const opcoes = {
    responsive: true,
    maintainAspectRatio: false, // a altura é definida pelo CSS (.painel__grafico)
    animation: prefereMenosMovimento() ? false : { duration: 600 },
    // O tooltip aparece para o dia mais perto do mouse, sem precisar acertar a linha
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false }, // usamos a legenda em HTML, logo abaixo
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
          // Título do balão: data completa do dia
          title: (itens) => formatarDataCompleta(historico[itens[0].dataIndex].data),
          label: (item) => ` ${item.dataset.label}: ${formatarMoeda(item.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: corGrade },
        ticks: { color: corReferencia, maxTicksLimit: 6, maxRotation: 0 },
      },
      y: {
        grace: '5%', // folga em cima e embaixo para a linha não encostar nas bordas
        grid: { color: corGrade },
        border: { display: false },
        ticks: { color: corReferencia, callback: (valor) => formatarMoeda(valor).replace(/\s/g, ' ') },
      },
    },
  }

  const descricao =
    `Gráfico de linha do preço de ${ticker} entre ${formatarDiaMes(resumo.inicio)} e ${formatarDiaMes(resumo.fim)}: ` +
    `de ${formatarMoeda(resumo.primeiro)} a ${formatarMoeda(resumo.ultimo)} (${formatarPorcentagem(resumo.variacao)}). ` +
    `Seu preço médio é ${formatarMoeda(precoMedio)}.`

  return (
    <figure className="painel__figura">
      <div className="painel__grafico">
        <Line data={dados} options={opcoes} role="img" aria-label={descricao} />
      </div>

      {/* Legenda: duas séries, então identificamos cada uma (sem depender só da cor) */}
      <figcaption className="painel__legenda">
        <span className="painel__legenda-item">
          <span className="painel__traco painel__traco--linha" style={{ background: corLinha }} aria-hidden="true" />
          Fechamento diário
        </span>
        <span className="painel__legenda-item">
          <span className="painel__traco painel__traco--tracejado" style={{ borderColor: corReferencia }} aria-hidden="true" />
          Seu preço médio ({formatarMoeda(precoMedio)})
        </span>
      </figcaption>
    </figure>
  )
}

export default PainelHistorico
