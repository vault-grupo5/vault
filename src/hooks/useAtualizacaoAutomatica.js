import { useEffect, useRef } from 'react'
import { criarAgendador } from '../utils/agendador.js'

// Liga o agendador (utils/agendador.js) ao ciclo de vida do React.
//
// - aoAtualizar: função que busca as cotações
// - ultimaBusca: quando as cotações foram buscadas pela última vez (ms) ou null se nunca
// - intervaloMs: de quanto em quanto tempo atualizar
//
// Sempre que "ultimaBusca" muda (a busca manual, a de um ativo novo ou a automática),
// o relógio recomeça a contar a partir dela. Assim uma atualização manual
// "adia" a automática, e nunca fazemos duas buscas coladas.
export function useAtualizacaoAutomatica({ aoAtualizar, ultimaBusca, intervaloMs }) {
  // Guardamos a função mais recente numa "ref" para o efeito não precisar reiniciar
  // o relógio toda vez que o App criar uma função nova
  const funcaoAtual = useRef(aoAtualizar)
  useEffect(() => {
    funcaoAtual.current = aoAtualizar
  }, [aoAtualizar])

  useEffect(() => {
    if (ultimaBusca === null) return // ainda não há nada para atualizar (carteira vazia)

    const agendador = criarAgendador({
      aoAtualizar: () => funcaoAtual.current(),
      intervaloMs,
      ultimaAtualizacao: ultimaBusca,
    })
    agendador.iniciar()
    return () => agendador.parar() // limpeza: desliga o timer e o ouvinte de visibilidade
  }, [ultimaBusca, intervaloMs])
}
