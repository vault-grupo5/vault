import { useRef, useState } from 'react'
import { criarAtivo } from '../utils/ativo.js'
import { lerNumero } from '../utils/formatacao.js'
import { buscarCotacao } from '../services/brapi.js'
import CampoTicker from './CampoTicker.jsx'
import './FormularioAtivo.css'

// Formato de ticker da B3: 4 letras + 1 ou 2 números (+ "F" do mercado fracionário).
// Ex: PETR4, VALE3, TAEE11, BOVA11, PETR4F
const FORMATO_TICKER = /^[A-Z]{4}\d{1,2}F?$/

const VALORES_INICIAIS = { ticker: '', quantidade: '', precoMedio: '' }

// Confere os 3 campos e devolve um objeto só com os erros encontrados.
// Ex: { quantidade: 'Informe uma quantidade maior que zero.' }
function validar(valores, tickersExistentes) {
  const erros = {}
  const ticker = valores.ticker.trim().toUpperCase()
  const quantidade = lerNumero(valores.quantidade)
  const precoMedio = lerNumero(valores.precoMedio)

  if (!ticker) {
    erros.ticker = 'Informe o código do ativo.'
  } else if (!FORMATO_TICKER.test(ticker)) {
    erros.ticker = 'Código inválido. Escolha uma sugestão ou use o formato da B3, ex: PETR4.'
  } else if (tickersExistentes.includes(ticker)) {
    erros.ticker = `${ticker} já está na carteira. Use o botão editar na lista.`
  }

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    erros.quantidade = 'Informe uma quantidade inteira maior que zero.'
  }

  if (!Number.isFinite(precoMedio) || precoMedio <= 0) {
    erros.precoMedio = 'Informe um preço maior que zero (ex: 32,50).'
  }

  return erros
}

// Formulário para cadastrar um ativo novo.
// - tickersExistentes: tickers que já estão na carteira (para não repetir)
// - aoAdicionar(ativo, cotacao): chamado quando o cadastro dá certo
function FormularioAtivo({ tickersExistentes, aoAdicionar }) {
  const [valores, setValores] = useState(VALORES_INICIAIS)
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)

  // Referências aos campos, para mover o foco até o primeiro campo com erro
  const refTicker = useRef(null)
  const refQuantidade = useRef(null)
  const refPreco = useRef(null)

  // Leva o foco a um campo pelo nome dele ('ticker', 'quantidade' ou 'precoMedio')
  function focarCampo(nome) {
    const porNome = { ticker: refTicker, quantidade: refQuantidade, precoMedio: refPreco }
    porNome[nome].current?.focus()
  }

  // Um único "onChange" para os 3 campos: o atributo name diz qual campo mudou
  function aoMudar(evento) {
    const { name, value } = evento.target
    setValores((atuais) => ({ ...atuais, [name]: value }))
    // Ao corrigir o campo, o erro dele some
    if (erros[name]) setErros((atuais) => ({ ...atuais, [name]: undefined }))
  }

  // O campo do ticker (CampoTicker) entrega o texto direto, e não o evento
  function aoMudarTicker(texto) {
    setValores((atuais) => ({ ...atuais, ticker: texto }))
    if (erros.ticker) setErros((atuais) => ({ ...atuais, ticker: undefined }))
  }

  // Ao escolher uma sugestão, preenchemos o ticker e já passamos para a quantidade
  function aoEscolherSugestao(sugestao) {
    aoMudarTicker(sugestao.ticker)
    focarCampo('quantidade')
  }

  async function aoEnviar(evento) {
    evento.preventDefault() // impede o navegador de recarregar a página

    const errosEncontrados = validar(valores, tickersExistentes)
    const camposComErro = Object.keys(errosEncontrados)
    setErros(errosEncontrados)

    if (camposComErro.length > 0) {
      // Acessibilidade: leva o foco ao primeiro campo errado,
      // e o leitor de tela lê a mensagem de erro ligada a ele
      focarCampo(camposComErro[0])
      return
    }

    // Antes de salvar, confirmamos na brapi que o ticker existe
    setEnviando(true)
    const ticker = valores.ticker.trim().toUpperCase()
    try {
      const cotacao = await buscarCotacao(ticker)
      const ativo = criarAtivo(ticker, lerNumero(valores.quantidade), lerNumero(valores.precoMedio))
      aoAdicionar(ativo, cotacao)
      setValores(VALORES_INICIAIS) // limpa o formulário
      focarCampo('ticker') // pronto para cadastrar o próximo
    } catch (erro) {
      setErros({ ticker: erro.message })
      focarCampo('ticker')
    } finally {
      setEnviando(false)
    }
  }

  // Monta as props de acessibilidade de um campo:
  // aria-invalid marca o erro; aria-describedby liga o campo à mensagem
  function propsDeErro(campo) {
    return erros[campo]
      ? { 'aria-invalid': true, 'aria-describedby': `erro-${campo}` }
      : { 'aria-invalid': false }
  }

  return (
    // noValidate: desliga os balões do navegador; usamos nossas próprias mensagens
    <form className="formulario" onSubmit={aoEnviar} noValidate>
      <div className="campo">
        <label className="campo__rotulo" htmlFor="campo-ticker">
          Código do ativo
        </label>
        {/* Campo com sugestões: digite o código ou o nome da empresa (ex: PETR4 ou Petrobras) */}
        <CampoTicker
          inputRef={refTicker}
          id="campo-ticker"
          placeholder="PETR4 ou Petrobras"
          maxLength={30}
          valor={valores.ticker}
          aoMudar={aoMudarTicker}
          aoEscolher={aoEscolherSugestao}
          tickersExistentes={tickersExistentes}
          {...propsDeErro('ticker')}
        />
        {erros.ticker && (
          <p id="erro-ticker" className="campo__erro">
            {erros.ticker}
          </p>
        )}
      </div>

      <div className="formulario__linha">
        <div className="campo">
          <label className="campo__rotulo" htmlFor="campo-quantidade">
            Quantidade
          </label>
          <input
            ref={refQuantidade}
            id="campo-quantidade"
            name="quantidade"
            className="campo__entrada"
            placeholder="100"
            inputMode="numeric"
            autoComplete="off"
            value={valores.quantidade}
            onChange={aoMudar}
            {...propsDeErro('quantidade')}
          />
          {erros.quantidade && (
            <p id="erro-quantidade" className="campo__erro">
              {erros.quantidade}
            </p>
          )}
        </div>

        <div className="campo">
          <label className="campo__rotulo" htmlFor="campo-preco">
            Preço médio (R$)
          </label>
          <input
            ref={refPreco}
            id="campo-preco"
            name="precoMedio"
            className="campo__entrada"
            placeholder="32,50"
            inputMode="decimal"
            autoComplete="off"
            value={valores.precoMedio}
            onChange={aoMudar}
            {...propsDeErro('precoMedio')}
          />
          {erros.precoMedio && (
            <p id="erro-precoMedio" className="campo__erro">
              {erros.precoMedio}
            </p>
          )}
        </div>
      </div>

      <button type="submit" className="botao botao--primario formulario__botao" disabled={enviando}>
        {enviando ? 'Verificando ticker…' : '+ Adicionar à carteira'}
      </button>
    </form>
  )
}

export default FormularioAtivo
