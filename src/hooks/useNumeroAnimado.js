import { useEffect, useRef, useState } from 'react'

// Diz se a pessoa ativou "reduzir movimento" nas configurações do sistema
export function prefereMenosMovimento() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Curva de animação "ease-out": começa rápido e desacelera no fim (parece mais natural)
function suavizar(t) {
  return 1 - Math.pow(1 - t, 3)
}

// Hook que faz um número "correr" do valor antigo até o novo.
// Ex: o total vai de R$ 10.000 para R$ 10.350 em vez de pular direto.
//
// Uso: const totalNaTela = useNumeroAnimado(resumo.valorAtual)
//
// Como funciona: a cada quadro da tela (requestAnimationFrame, ~60 por segundo)
// calculamos quanto do tempo já passou e mostramos o valor proporcional.
export function useNumeroAnimado(alvo, duracaoMs = 800) {
  const [exibido, setExibido] = useState(alvo)
  // useRef guarda o último valor mostrado sem causar novo render
  const ultimoValor = useRef(alvo)

  useEffect(() => {
    if (prefereMenosMovimento()) {
      ultimoValor.current = alvo
      return
    }

    const inicio = ultimoValor.current
    const diferenca = alvo - inicio
    if (diferenca === 0) return

    const comecouEm = performance.now()
    let quadro

    function passo(agora) {
      const progresso = Math.min((agora - comecouEm) / duracaoMs, 1) // de 0 a 1
      const valor = inicio + diferenca * suavizar(progresso)
      ultimoValor.current = valor
      setExibido(valor)
      if (progresso < 1) quadro = requestAnimationFrame(passo)
    }

    quadro = requestAnimationFrame(passo)
    // Se o alvo mudar no meio da animação, cancelamos esta e a próxima
    // continua a partir de onde parou (ultimoValor)
    return () => cancelAnimationFrame(quadro)
  }, [alvo, duracaoMs])

  // Com movimento reduzido, mostramos o valor final direto
  return prefereMenosMovimento() ? alvo : exibido
}
