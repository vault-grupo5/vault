import { Check, Trash2, X } from 'lucide-react'
import { useEffect } from 'react'

const TEMPO_NA_TELA_MS = 3500

// Aviso flutuante ("toast") que aparece no rodapé da tela por alguns segundos.
// Ex: "PETR4 adicionado à carteira".
//
// Props:
// - aviso: { id, texto, tipo } ou null quando não há aviso
// - aoFechar: função chamada quando o tempo acaba ou a pessoa clica no X
//
// A <div role="status"> fica SEMPRE na página (mesmo vazia): leitores de tela
// só anunciam mudanças em regiões "ao vivo" que já existiam antes da mudança.
function Aviso({ aviso, aoFechar }) {
  // Fecha sozinho depois de alguns segundos.
  // aviso.id muda a cada aviso novo, reiniciando a contagem.
  useEffect(() => {
    if (!aviso) return
    const timer = setTimeout(aoFechar, TEMPO_NA_TELA_MS)
    return () => clearTimeout(timer)
  }, [aviso, aoFechar])

  return (
    <div className="aviso-regiao" role="status" aria-live="polite">
      {aviso && (
        // key={aviso.id}: um aviso novo recria o elemento e a animação de entrada roda de novo
        <div key={aviso.id} className={`aviso aviso--${aviso.tipo ?? 'sucesso'}`}>
          <span className="aviso__icone" aria-hidden="true">
            {aviso.tipo === 'remocao' ? <Trash2 size={14} /> : <Check size={14} />}
          </span>
          <span className="aviso__texto">{aviso.texto}</span>
          <button type="button" className="aviso__fechar" onClick={aoFechar} aria-label="Fechar aviso">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

export default Aviso
