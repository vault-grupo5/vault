import { useMoeda } from '../hooks/useMoeda.js'
import { TriangleAlert } from 'lucide-react'
import Dinheiro from './Dinheiro.jsx'
import Pilula from './Pilula.jsx'
import { formatarPorcentagem } from '../utils/formatacao.js'
import { useNumeroAnimado } from '../hooks/useNumeroAnimado.js'
import './ResumoCarteira.css'

// Cartão de resumo: valor total da carteira em destaque,
// mais total investido, lucro/prejuízo geral e variação do dia.
//
// Props:
// - resumo: objeto de calcularResumo() (utils/calculos.js)
// - carregando: true enquanto as cotações chegam pela primeira vez
function ResumoCarteira({ resumo, carregando }) {
  // moeda(v) já respeita o modo privacidade (mostra "R$ •••••" quando ligado)
  const { moeda, moedaComSinal } = useMoeda()
  // O total "corre" até o valor novo quando muda (ver hooks/useNumeroAnimado.js)
  const totalAnimado = useNumeroAnimado(resumo.valorAtual)
  const vazia = resumo.quantidadeAtivos === 0
  // Só mostramos o esqueleto se ainda não temos NENHUMA cotação
  const esperandoCotacoes = carregando && resumo.semCotacao === resumo.quantidadeAtivos && !vazia

  return (
    <div className="resumo">
      <div className="resumo__principal">
        <p className="resumo__rotulo" id="rotulo-total">
          Patrimônio total
        </p>

        {esperandoCotacoes ? (
          <span className="esqueleto resumo__esqueleto" aria-label="Carregando valor total" />
        ) : (
          <p className="resumo__total" aria-labelledby="rotulo-total">
            <Dinheiro valor={totalAnimado} />
          </p>
        )}

        {!vazia && !esperandoCotacoes && (
          <div className="resumo__pilulas">
            <Pilula valor={resumo.lucro}>
              {moedaComSinal(resumo.lucro)} ({formatarPorcentagem(resumo.lucroPercentual)})
            </Pilula>
            <span className="resumo__desde">desde a compra</span>
          </div>
        )}

        {vazia && <p className="resumo__dica">Adicione ativos para ver o valor da sua carteira.</p>}

        {/* Aviso quando o total é aproximado porque falta cotação de algum ativo */}
        {resumo.semCotacao > 0 && !carregando && !vazia && (
          <p className="resumo__aviso">
            <TriangleAlert size={14} aria-hidden="true" /> {resumo.semCotacao} ativo(s) sem cotação: usando o preço médio no
            total.
          </p>
        )}
      </div>

      {/* Lista de definições (dl): par "rótulo → valor", semântica certa para números de resumo */}
      <dl className="resumo__indicadores">
        <div className="indicador">
          <dt className="indicador__rotulo">Total investido</dt>
          <dd className="indicador__valor">{moeda(resumo.valorInvestido)}</dd>
        </div>

        <div className="indicador">
          <dt className="indicador__rotulo">Lucro / prejuízo</dt>
          <dd className={`indicador__valor texto--${tipoTexto(resumo.lucro)}`}>
            {moedaComSinal(resumo.lucro)}
          </dd>
        </div>

        <div className="indicador">
          <dt className="indicador__rotulo">Hoje</dt>
          <dd className="indicador__valor indicador__valor--hoje">
            <span className={`texto--${tipoTexto(resumo.variacaoDia)}`}>
              {moedaComSinal(resumo.variacaoDia)}
            </span>
            <Pilula valor={resumo.variacaoDiaPercentual}>{formatarPorcentagem(resumo.variacaoDiaPercentual)}</Pilula>
          </dd>
        </div>

        <div className="indicador">
          <dt className="indicador__rotulo">Ativos</dt>
          <dd className="indicador__valor">{resumo.quantidadeAtivos}</dd>
        </div>
      </dl>
    </div>
  )
}

// Classe de cor do texto: verde para ganho, vermelho para perda
function tipoTexto(valor) {
  if (valor > 0) return 'ganho'
  if (valor < 0) return 'perda'
  return 'neutro'
}

export default ResumoCarteira
