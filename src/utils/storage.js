// Salva e carrega a carteira no localStorage do navegador.
// O localStorage guarda só texto, então convertemos a lista de ativos
// para JSON ao salvar e de volta para objeto ao carregar.
//
// Os dados ficam SÓ no navegador da pessoa: não existe servidor do VAULT.

const CHAVE_CARTEIRA = 'vault:carteira'

// Confere se um item carregado tem o formato de ativo esperado.
// Protege o app caso o localStorage tenha sido editado à mão ou esteja corrompido.
function ehAtivoValido(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.ticker === 'string' &&
    Number.isFinite(item.quantidade) &&
    item.quantidade > 0 &&
    Number.isFinite(item.precoMedio) &&
    item.precoMedio > 0
  )
}

// Devolve a lista de ativos salva. Se não tiver nada (ou der erro), devolve [].
export function carregarCarteira() {
  try {
    const texto = localStorage.getItem(CHAVE_CARTEIRA)
    if (!texto) return []
    const dados = JSON.parse(texto)
    // Se não for uma lista, ignoramos; se for, mantemos só os itens válidos
    return Array.isArray(dados) ? dados.filter(ehAtivoValido) : []
  } catch {
    // JSON inválido ou localStorage bloqueado (ex: modo privado): começa vazio
    return []
  }
}

// Guarda a lista de ativos. Chamado sempre que a carteira muda.
export function salvarCarteira(ativos) {
  try {
    localStorage.setItem(CHAVE_CARTEIRA, JSON.stringify(ativos))
  } catch {
    // Se o navegador bloquear, o app continua funcionando, só não guarda
  }
}
