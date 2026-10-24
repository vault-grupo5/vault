// Ordenação da lista de ativos.
// A função de ordenar é "pura": recebe a lista e devolve uma lista nova, sem alterar a original.
// (Isso importa: o gráfico de pizza usa a lista na ORDEM DE CADASTRO para dar a cor de cada ativo,
// então a ordem da lista na tela não pode mexer na lista original.)

const CHAVE_ORDENACAO = 'vault:ordenacao'

// As opções que aparecem no seletor da tela: valor (guardado) e rótulo (mostrado)
export const OPCOES_ORDENACAO = [
  { valor: 'cadastro', rotulo: 'Ordem de cadastro' },
  { valor: 'lucro', rotulo: 'Maior lucro' },
  { valor: 'valor', rotulo: 'Maior valor atual' },
  { valor: 'nome', rotulo: 'Nome (A–Z)' },
]

// Collator = comparador de textos que entende acentos e maiúsculas do português.
// Com sensitivity 'base', "Ações" e "acoes" contam como iguais na hora de ordenar.
const comparadorDeTexto = new Intl.Collator('pt-BR', { sensitivity: 'base' })

// Nome usado na ordenação: o da empresa, se já chegou da API; senão o próprio ticker
const nomeDe = (posicao) => posicao.cotacao?.nome ?? posicao.ticker

// Devolve uma cópia da lista ordenada pelo critério escolhido.
export function ordenarPosicoes(posicoes, criterio) {
  // [...posicoes] copia a lista: o .sort() altera o array em que é chamado
  const copia = [...posicoes]

  switch (criterio) {
    case 'lucro':
      // Ativos sem cotação ficam no fim: o lucro deles é 0 só porque falta o preço, não porque seja de fato 0
      return copia.sort((a, b) => {
        if (a.temCotacao !== b.temCotacao) return a.temCotacao ? -1 : 1
        return b.lucro - a.lucro
      })
    case 'valor':
      return copia.sort((a, b) => b.valorAtual - a.valorAtual)
    case 'nome':
      return copia.sort((a, b) => comparadorDeTexto.compare(nomeDe(a), nomeDe(b)))
    default:
      return copia // 'cadastro': já está na ordem em que foi cadastrado
  }
}

// ---------- Guardar a escolha no navegador ----------

// Lê a ordenação salva. Se não houver (ou for inválida), usa a ordem de cadastro.
export function carregarOrdenacao() {
  try {
    const salva = localStorage.getItem(CHAVE_ORDENACAO)
    return OPCOES_ORDENACAO.some((o) => o.valor === salva) ? salva : 'cadastro'
  } catch {
    return 'cadastro'
  }
}

export function salvarOrdenacao(criterio) {
  try {
    localStorage.setItem(CHAVE_ORDENACAO, criterio)
  } catch {
    // Se o navegador bloquear o localStorage, a escolha só vale até fechar a página
  }
}
