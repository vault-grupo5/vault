import { useEffect, useRef } from 'react'
import { CircleAlert, TriangleAlert } from 'lucide-react'
import './DialogoImportacao.css'

// Quantos problemas listar de uma vez (um arquivo muito errado não vira uma parede de texto)
const MAX_PROBLEMAS_VISIVEIS = 6

// Janela (<dialog> nativo, como o PainelHistorico) da importação de CSV. Tem dois jeitos:
// - tipo "erro": o arquivo é inválido; lista o que está errado e só tem o botão "Fechar";
// - tipo "confirmar": o arquivo é válido, mas vai SUBSTITUIR a carteira atual; pede confirmação.
// Esc e clique fora fecham (= cancelar). O foco começa em "Cancelar"/"Fechar", o botão seguro.
//
// Props:
// - importacao: { tipo, arquivo, mensagens } ou { tipo, arquivo, ativos }
// - totalAtual: quantos ativos a carteira tem agora
// - aoConfirmar / aoFechar: ações dos botões
function DialogoImportacao({ importacao, totalAtual, aoConfirmar, aoFechar }) {
  const refDialogo = useRef(null)
  const refSeguro = useRef(null)
  const ehErro = importacao.tipo === 'erro'

  useEffect(() => {
    const dialogo = refDialogo.current
    if (dialogo && !dialogo.open) dialogo.showModal()
    refSeguro.current?.focus()
  }, [])

  const mensagens = ehErro ? importacao.mensagens : []
  const escondidas = mensagens.length - MAX_PROBLEMAS_VISIVEIS

  return (
    <dialog
      ref={refDialogo}
      className="dialogo-importacao"
      aria-labelledby="dialogo-importacao-titulo"
      onClose={aoFechar}
      onClick={(evento) => evento.target === evento.currentTarget && refDialogo.current?.close()}
    >
      <div className="dialogo-importacao__conteudo">
        <h2 id="dialogo-importacao-titulo" className="dialogo-importacao__titulo">
          {ehErro ? (
            <CircleAlert size={20} aria-hidden="true" className="dialogo-importacao__icone dialogo-importacao__icone--erro" />
          ) : (
            <TriangleAlert size={20} aria-hidden="true" className="dialogo-importacao__icone dialogo-importacao__icone--aviso" />
          )}
          {ehErro ? 'Não foi possível importar' : 'Substituir a carteira atual?'}
        </h2>

        <p className="dialogo-importacao__arquivo">Arquivo: {importacao.arquivo}</p>

        {ehErro ? (
          <>
            <ul className="dialogo-importacao__lista">
              {mensagens.slice(0, MAX_PROBLEMAS_VISIVEIS).map((mensagem) => (
                <li key={mensagem}>{mensagem}</li>
              ))}
            </ul>
            {escondidas > 0 && <p className="dialogo-importacao__arquivo">…e mais {escondidas} problema(s).</p>}
            <p>Corrija o arquivo e tente de novo. Nada foi alterado na sua carteira.</p>
          </>
        ) : (
          <p>
            O arquivo tem <strong>{importacao.ativos.length} ativo(s)</strong>. Importar vai <strong>apagar os {totalAtual} ativo(s)</strong> que
            estão na carteira agora e colocar estes no lugar. Essa ação não pode ser desfeita.
          </p>
        )}

        <div className="dialogo-importacao__acoes">
          <button ref={refSeguro} type="button" className="botao botao--fantasma" onClick={() => refDialogo.current?.close()}>
            {ehErro ? 'Fechar' : 'Cancelar'}
          </button>
          {!ehErro && (
            <button type="button" className="botao botao--primario" onClick={aoConfirmar}>
              Substituir carteira
            </button>
          )}
        </div>
      </div>
    </dialog>
  )
}

export default DialogoImportacao
