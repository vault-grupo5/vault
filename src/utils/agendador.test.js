// Testes do agendador da atualização automática (utils/agendador.js). Rodar com: npm test
// Usamos o relógio falso do Vitest (vi.useFakeTimers): dá para "pular" 10 minutos na hora.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarAgendador } from './agendador.js'

const MINUTO = 60 * 1000

// "document" de mentira: só o que o agendador usa (hidden e o evento visibilitychange)
function documentoFalso() {
  const ouvintes = new Set()
  return {
    hidden: false,
    ouvintes,
    addEventListener: (_, f) => ouvintes.add(f),
    removeEventListener: (_, f) => ouvintes.delete(f),
    esconder(valor) {
      this.hidden = valor
      ouvintes.forEach((f) => f())
    },
  }
}

describe('criarAgendador', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function montar(documento) {
    const aoAtualizar = vi.fn(async () => {})
    const agendador = criarAgendador({
      aoAtualizar,
      intervaloMs: 10 * MINUTO,
      ultimaAtualizacao: Date.now(),
      documento,
      agora: () => Date.now(), // com o relógio falso, Date.now também "pula"
    })
    return { aoAtualizar, agendador }
  }

  it('atualiza depois do intervalo (+ a margem de 1 s), e de novo no próximo', async () => {
    const { aoAtualizar, agendador } = montar(documentoFalso())
    agendador.iniciar()
    await vi.advanceTimersByTimeAsync(10 * MINUTO)
    expect(aoAtualizar).toHaveBeenCalledTimes(0) // ainda falta a margem
    await vi.advanceTimersByTimeAsync(1000)
    expect(aoAtualizar).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(10 * MINUTO + 1000)
    expect(aoAtualizar).toHaveBeenCalledTimes(2)
    agendador.parar()
  })

  it('não atualiza com a aba escondida', async () => {
    const documento = documentoFalso()
    const { aoAtualizar, agendador } = montar(documento)
    agendador.iniciar()
    documento.esconder(true)
    await vi.advanceTimersByTimeAsync(60 * MINUTO)
    expect(aoAtualizar).not.toHaveBeenCalled()
    agendador.parar()
  })

  it('ao voltar para a aba depois do intervalo, atualiza na hora', async () => {
    const documento = documentoFalso()
    const { aoAtualizar, agendador } = montar(documento)
    agendador.iniciar()
    documento.esconder(true)
    await vi.advanceTimersByTimeAsync(30 * MINUTO)
    documento.esconder(false)
    await vi.advanceTimersByTimeAsync(0)
    expect(aoAtualizar).toHaveBeenCalledTimes(1)
    agendador.parar()
  })

  it('ao voltar antes do intervalo, espera só o que falta', async () => {
    const documento = documentoFalso()
    const { aoAtualizar, agendador } = montar(documento)
    agendador.iniciar()
    documento.esconder(true)
    await vi.advanceTimersByTimeAsync(4 * MINUTO)
    documento.esconder(false)
    await vi.advanceTimersByTimeAsync(5 * MINUTO)
    expect(aoAtualizar).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1 * MINUTO + 1000)
    expect(aoAtualizar).toHaveBeenCalledTimes(1)
    agendador.parar()
  })

  it('parar desliga o timer e o ouvinte de visibilidade', async () => {
    const documento = documentoFalso()
    const { aoAtualizar, agendador } = montar(documento)
    agendador.iniciar()
    agendador.parar()
    expect(documento.ouvintes.size).toBe(0)
    await vi.advanceTimersByTimeAsync(60 * MINUTO)
    expect(aoAtualizar).not.toHaveBeenCalled()
  })

  it('um erro na atualização não escapa nem vira laço: a próxima só vem depois de um intervalo', async () => {
    const aoAtualizar = vi.fn(async () => {
      throw new Error('falhou')
    })
    const agendador = criarAgendador({
      aoAtualizar,
      intervaloMs: 10 * MINUTO,
      ultimaAtualizacao: Date.now(),
      documento: documentoFalso(),
      agora: () => Date.now(),
    })
    agendador.iniciar()
    await vi.advanceTimersByTimeAsync(10 * MINUTO + 1000)
    await vi.advanceTimersByTimeAsync(5 * MINUTO)
    expect(aoAtualizar).toHaveBeenCalledTimes(1)
    agendador.parar()
  })
})
