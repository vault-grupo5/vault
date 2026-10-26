import { useMemo, useRef, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useMoeda } from '../hooks/useMoeda.js'
import { useSetores } from '../hooks/useSetores.js'
import { agruparPorAtivo, agruparPorSetor, montarFatias, ordenarParaDesenho } from '../utils/alocacao.js'
import { nomeDoSetor } from '../utils/setores.js'
import { formatarPorcentagem } from '../utils/formatacao.js'
import { lerCor } from '../utils/cores.js'
import { animacaoDosGraficos, estiloDoBalao } from '../utils/graficos.js'
import './GraficoRosca.css'

// O Chart.js é dividido em partes; registramos só as que usamos
// (ArcElement = as fatias, Tooltip = o balão ao passar o mouse). Deixa o site mais leve.
ChartJS.register(ArcElement, Tooltip)

// Participação de cada fatia é sempre positiva, então tiramos o sinal de '+': 38,11%
const formatarParticipacao = (valor) => formatarPorcentagem(valor).replace('+', '')

const VISOES = [
  { valor: 'ativo', rotulo: 'Por ativo' },
  { valor: 'setor', rotulo: 'Por setor' },
]
const CHAVE_VISAO = 'vault:alocacao'

function lerVisao() {
  try {
    return localStorage.getItem(CHAVE_VISAO) === 'setor' ? 'setor' : 'ativo'
  } catch {
    return 'ativo'
  }
}

// Gráfico de rosca com a distribuição da carteira (página Visão geral).
// - O total da carteira fica no "furo" do meio.
// - Dá para ver "por ativo" ou "por setor". O setor vem da brapi e só é buscado
//   quando a pessoa escolhe "por setor" (depois fica 30 dias no cache).
//
// Props:
// - posicoes: ativos com os cálculos feitos, na ORDEM DE CADASTRO (a cor de cada fatia depende dela)
function GraficoRosca({ posicoes }) {
  const { moeda } = useMoeda()
  const refGrafico = useRef(null)
  const [visao, setVisao] = useState(lerVisao)

  const tickers = useMemo(() => posicoes.map((p) => p.ticker), [posicoes])
  const setores = useSetores(tickers, visao === 'setor')

  function mudarVisao(nova) {
    setVisao(nova)
    try {
      localStorage.setItem(CHAVE_VISAO, nova)
    } catch {
      // sem localStorage: a escolha vale só até fechar a página
    }
  }

  // Grupos → fatias. Só recalcula quando a carteira, a visão ou os setores mudam.
  const fatiasBase = useMemo(() => {
    if (visao === 'ativo') return montarFatias(agruparPorAtivo(posicoes))
    if (setores.carregando) return []
    return montarFatias(agruparPorSetor(posicoes, (ticker) => nomeDoSetor(setores.setores[ticker])))
  }, [posicoes, visao, setores.carregando, setores.setores])

  // As cores são lidas do CSS a cada renderização (é barato). Assim, quando o tema troca,
  // as fatias já saem com as cores do tema novo.
  const fatias = fatiasBase.map((f) => ({
    ...f,
    cor: lerCor(f.indiceCor ? `--cor-grafico-${f.indiceCor}` : '--cor-grafico-outros'),
  }))
  const total = posicoes.reduce((soma, p) => soma + p.valorAtual, 0)
  // O gráfico desenha as fatias numa ordem que nunca deixa cores parecidas lado a lado (ver
  // ordenarParaDesenho em utils/alocacao.js); a LEGENDA continua do maior para o menor.
  const desenho = ordenarParaDesenho(fatias)

  // Seletor "Por ativo / Por setor": dois botões de rádio (a escolha de um exclui o outro).
  // fieldset + legend dão o nome do grupo para o leitor de tela.
  const seletor = (
    <fieldset className="visao">
      <legend className="sr-only">Ver a distribuição</legend>
      {VISOES.map((opcao) => (
        <label key={opcao.valor} className={`visao__opcao ${visao === opcao.valor ? 'visao__opcao--ativa' : ''}`}>
          <input
            type="radio"
            name="visao-distribuicao"
            value={opcao.valor}
            checked={visao === opcao.valor}
            onChange={() => mudarVisao(opcao.valor)}
          />
          {opcao.rotulo}
        </label>
      ))}
    </fieldset>
  )

  if (visao === 'setor' && setores.carregando) {
    return (
      <div className="rosca">
        {seletor}
        <div className="rosca__carregando" role="status">
          <span className="esqueleto rosca__esqueleto" />
          <p>
            Buscando o setor dos ativos: {setores.feitos} de {setores.total}…
          </p>
        </div>
      </div>
    )
  }

  if (fatias.length === 0) {
    return <p className="grafico__vazio">O gráfico aparece quando você adicionar ativos.</p>
  }

  const dados = {
    labels: desenho.map((f) => f.rotulo),
    datasets: [
      {
        data: desenho.map((f) => f.valor),
        backgroundColor: desenho.map((f) => f.cor),
        // Borda da cor do cartão: cria um "respiro" de 2px entre as fatias
        borderColor: lerCor('--cor-cartao'),
        borderWidth: 2,
        hoverOffset: 8, // a fatia "salta" um pouco ao passar o mouse
      },
    ],
  }

  const opcoes = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '64%', // tamanho do furo do meio (é o que faz a pizza virar rosca)
    animation: animacaoDosGraficos(),
    plugins: {
      legend: { display: false }, // usamos nossa própria legenda em HTML (abaixo)
      tooltip: {
        ...estiloDoBalao(),
        callbacks: {
          // Texto do balão: "R$ 3.312,00 · 38,11%"
          label: (contexto) => {
            const fatia = desenho[contexto.dataIndex]
            return ` ${moeda(fatia.valor)} · ${formatarParticipacao(fatia.percentual)}`
          },
        },
      },
    },
  }

  // Passar o mouse (ou o foco do teclado) num item da legenda destaca a fatia no gráfico.
  // A legenda e o desenho têm ordens diferentes, então procuramos a fatia pela chave.
  function destacarFatia(chave) {
    const grafico = refGrafico.current
    if (!grafico) return
    const indice = desenho.findIndex((f) => f.chave === chave)
    const ativos = indice < 0 ? [] : [{ datasetIndex: 0, index: indice }]
    grafico.setActiveElements(ativos)
    grafico.tooltip.setActiveElements(ativos, { x: 0, y: 0 })
    grafico.update()
  }

  const unidade = visao === 'ativo' ? (fatias.length === 1 ? 'ativo' : 'ativos') : fatias.length === 1 ? 'setor' : 'setores'
  // Texto alternativo para leitores de tela (o canvas em si é só uma imagem)
  const descricao =
    `Distribuição da carteira ${visao === 'ativo' ? 'por ativo' : 'por setor'}, total ${moeda(total)}: ` +
    fatias.map((f) => `${f.rotulo} ${formatarParticipacao(f.percentual)}`).join(', ')

  return (
    <div className="rosca">
      {seletor}

      <div className="grafico">
        <div className="rosca__grafico">
          <Doughnut ref={refGrafico} data={dados} options={opcoes} role="img" aria-label={descricao} />
          {/* Total no furo do meio. aria-hidden: a descrição do gráfico já diz o total */}
          <div className="rosca__centro" aria-hidden="true">
            <span className="rosca__rotulo">Total</span>
            <span className="rosca__total">{moeda(total)}</span>
            <span className="rosca__rotulo">
              {fatias.length} {unidade}
            </span>
          </div>
        </div>

        {/* Legenda: identifica cada cor e mostra os números (não depende só da cor) */}
        <ul className="grafico__legenda">
          {fatias.map((fatia) => (
            <li
              key={fatia.chave}
              className="legenda__item"
              tabIndex={0}
              onMouseEnter={() => destacarFatia(fatia.chave)}
              onMouseLeave={() => destacarFatia(null)}
              onFocus={() => destacarFatia(fatia.chave)}
              onBlur={() => destacarFatia(null)}
            >
              <span className="legenda__cor" style={{ background: fatia.cor }} aria-hidden="true" />
              <span className="legenda__textos">
                <span className="legenda__ticker">{fatia.rotulo}</span>
                {fatia.detalhe && <span className="legenda__detalhe">{fatia.detalhe}</span>}
              </span>
              <span className="legenda__percentual">{formatarParticipacao(fatia.percentual)}</span>
              <span className="legenda__valor">{moeda(fatia.valor)}</span>
            </li>
          ))}
        </ul>
      </div>

      {visao === 'setor' && (
        <p className="rosca__nota">
          Setores informados pela brapi. FIIs e ETFs ficam juntos em "Fundos"; ativos sem setor na brapi aparecem como
          "Sem classificação".
        </p>
      )}
    </div>
  )
}

export default GraficoRosca
