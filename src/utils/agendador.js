// Agendador da atualização automática das cotações.
// É JavaScript puro (sem React), então dá para testar sozinho e é fácil de explicar.
//
// Regras:
// 1. Roda "aoAtualizar" quando passar "intervaloMs" desde a última atualização.
// 2. Com a aba ESCONDIDA (outra aba, janela minimizada, tela bloqueada) não roda:
//    não faz sentido gastar requisições (o plano grátis tem 15.000 por mês) para
//    uma tela que ninguém está vendo.
// 3. Quando a pessoa VOLTA para a aba: se já passou o intervalo, atualiza na hora;
//    senão espera só o tempo que falta.
//
// Parâmetros:
// - aoAtualizar: função (pode ser async) que busca as cotações. Ela mesma respeita o cache.
// - intervaloMs: de quanto em quanto tempo atualizar
// - ultimaAtualizacao: quando foi a última atualização (milissegundos, como Date.now())
// - margemMs: folga extra somada ao intervalo. O cache das cotações dura exatamente 10 min;
//   sem a folga, a atualização podia disparar no mesmo instante em que o cache ainda vale
//   e não buscar nada de novo.
// - documento / agora: só existem para os testes poderem trocar o "document" e o relógio
export function criarAgendador({
  aoAtualizar,
  intervaloMs,
  ultimaAtualizacao,
  margemMs = 1000,
  documento = document,
  agora = Date.now,
}) {
  let timer = null
  let ultima = ultimaAtualizacao
  let parado = true

  // Quanto falta para a próxima atualização (nunca negativo)
  const tempoRestante = () => Math.max(0, ultima + intervaloMs + margemMs - agora())

  function cancelarTimer() {
    clearTimeout(timer)
    timer = null
  }

  // Marca o timer para daqui a "tempoRestante" ms. Com a aba escondida, não marca nada.
  function agendar() {
    cancelarTimer()
    if (parado || documento.hidden) return
    timer = setTimeout(disparar, tempoRestante())
  }

  async function disparar() {
    timer = null
    if (parado || documento.hidden) return
    try {
      await aoAtualizar()
    } finally {
      // Mesmo se der erro, contamos a tentativa: a próxima vem só depois de um intervalo inteiro
      // (senão um erro persistente viraria um laço de requisições sem parar)
      ultima = agora()
      agendar()
    }
  }

  // O navegador avisa (evento "visibilitychange") quando a aba é escondida ou volta a ser vista
  function aoMudarVisibilidade() {
    if (documento.hidden) {
      cancelarTimer() // pausa
    } else if (tempoRestante() === 0) {
      disparar() // ficou fora tempo demais: atualiza agora
    } else {
      agendar() // retoma esperando só o que faltava
    }
  }

  return {
    iniciar() {
      parado = false
      documento.addEventListener('visibilitychange', aoMudarVisibilidade)
      agendar()
    },
    parar() {
      parado = true
      cancelarTimer()
      documento.removeEventListener('visibilitychange', aoMudarVisibilidade)
    },
  }
}
