import { useCallback, useEffect, useState } from 'react'

const CHAVE_TEMA = 'vault:tema'
const CONSULTA_TEMA_CLARO = '(prefers-color-scheme: light)'

// Lê a escolha que a pessoa fez ao clicar no botão ('claro' ou 'escuro'). Null = nunca escolheu.
function lerEscolhaSalva() {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA)
    return salvo === 'claro' || salvo === 'escuro' ? salvo : null
  } catch {
    return null
  }
}

function salvarEscolha(tema) {
  try {
    localStorage.setItem(CHAVE_TEMA, tema)
  } catch {
    // Sem localStorage, a escolha só vale até fechar a página
  }
}

// Aplica o tema na página: atributo data-tema no <html> (o CSS troca as cores a partir dele)
// e a cor da barra do navegador no celular (<meta name="theme-color">).
//
// IMPORTANTE: isto roda ANTES de atualizarmos o estado do React. Os gráficos (canvas) leem as
// cores do CSS na hora de desenhar; se o atributo só mudasse depois do desenho (por exemplo
// num useEffect), eles ficariam com as cores do tema anterior.
function aplicarNoDocumento(tema) {
  document.documentElement.dataset.tema = tema
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--cor-fundo').trim()
}

// Descobre o tema inicial. O index.html já definiu o atributo antes da página aparecer;
// a leitura abaixo só é a "segunda opção" caso aquele script não tenha rodado.
function temaInicial() {
  const doHtml = document.documentElement.dataset.tema
  const tema =
    doHtml === 'claro' || doHtml === 'escuro'
      ? doHtml
      : (lerEscolhaSalva() ?? (window.matchMedia(CONSULTA_TEMA_CLARO).matches ? 'claro' : 'escuro'))
  // Aplicamos de novo mesmo quando o atributo já existe: o script do index.html não consegue
  // atualizar o theme-color (o CSS ainda não carregou naquele momento), mas aqui já dá.
  aplicarNoDocumento(tema)
  return tema
}

// Hook do tema claro/escuro. Devolve { tema, alternar }.
//
// Quem manda no tema, em ordem de prioridade:
//   1. a escolha da pessoa (botão do cabeçalho), guardada no navegador;
//   2. a preferência do sistema operacional (modo claro/escuro do Windows, celular...);
//   3. escuro, que é o tema padrão do VAULT.
export function useTema() {
  const [tema, setTema] = useState(temaInicial)

  // Enquanto a pessoa NÃO escolheu, acompanhamos o sistema: se ele trocar de claro para escuro
  // (ex: automático ao anoitecer), o site troca junto.
  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_TEMA_CLARO)
    function aoMudarSistema(evento) {
      if (lerEscolhaSalva() !== null) return // a escolha da pessoa vale mais
      const novo = evento.matches ? 'claro' : 'escuro'
      aplicarNoDocumento(novo)
      setTema(novo)
    }
    consulta.addEventListener('change', aoMudarSistema)
    return () => consulta.removeEventListener('change', aoMudarSistema)
  }, [])

  const alternar = useCallback(() => {
    const novo = tema === 'claro' ? 'escuro' : 'claro'
    aplicarNoDocumento(novo)
    setTema(novo)
    salvarEscolha(novo) // a partir daqui a escolha da pessoa vale mais que a do sistema
  }, [tema])

  return { tema, alternar }
}
