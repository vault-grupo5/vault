import { useEffect } from 'react'

// Muda o título da aba do navegador para a página aberta, ex: "Meus ativos — VAULT".
// Ajuda quem tem várias abas abertas e é lido pelos leitores de tela ao trocar de página.
export function useTituloDaPagina(titulo) {
  useEffect(() => {
    document.title = `${titulo} — VAULT`
  }, [titulo])
}
