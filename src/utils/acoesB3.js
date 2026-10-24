// Lista local de ativos muito negociados na B3, usada nas sugestões do formulário.
//
// Para que serve:
// 1. Sugestões INSTANTÂNEAS enquanto a pessoa digita (sem esperar a internet).
// 2. Não gastar requisições da API: só consultamos a brapi quando a lista local
//    não tem sugestões suficientes (ver hooks/useSugestoes.js).
// 3. Reserva: se a API falhar ou estiver sem token, as sugestões continuam funcionando.
//
// Os nomes são os "nomes de pregão" resumidos. Os dados de verdade (nome completo, preço)
// vêm da brapi depois que o ativo é cadastrado. Os mais negociados vêm primeiro.

const ACOES = [
  ['PETR4', 'Petrobras PN'],
  ['VALE3', 'Vale ON'],
  ['ITUB4', 'Itaú Unibanco PN'],
  ['BBDC4', 'Bradesco PN'],
  ['BBAS3', 'Banco do Brasil ON'],
  ['PETR3', 'Petrobras ON'],
  ['ABEV3', 'Ambev ON'],
  ['WEGE3', 'WEG ON'],
  ['B3SA3', 'B3 ON'],
  ['MGLU3', 'Magazine Luiza ON'],
  ['ITSA4', 'Itaúsa PN'],
  ['RENT3', 'Localiza ON'],
  ['SUZB3', 'Suzano ON'],
  ['ELET3', 'Eletrobras ON'],
  ['GGBR4', 'Gerdau PN'],
  ['JBSS3', 'JBS ON'],
  ['RADL3', 'RaiaDrogasil ON'],
  ['PRIO3', 'PRIO ON'],
  ['LREN3', 'Lojas Renner ON'],
  ['RAIL3', 'Rumo ON'],
  ['CSAN3', 'Cosan ON'],
  ['HAPV3', 'Hapvida ON'],
  ['EQTL3', 'Equatorial ON'],
  ['BBSE3', 'BB Seguridade ON'],
  ['SBSP3', 'Sabesp ON'],
  ['CMIG4', 'Cemig PN'],
  ['CPLE6', 'Copel PNB'],
  ['VIVT3', 'Vivo ON'],
  ['TIMS3', 'TIM ON'],
  ['KLBN11', 'Klabin UNIT'],
  ['UGPA3', 'Ultrapar ON'],
  ['BRFS3', 'BRF ON'],
  ['MRFG3', 'Marfrig ON'],
  ['CCRO3', 'CCR ON'],
  ['CYRE3', 'Cyrela ON'],
  ['MRVE3', 'MRV ON'],
  ['EMBR3', 'Embraer ON'],
  ['CSNA3', 'CSN ON'],
  ['USIM5', 'Usiminas PNA'],
  ['AZUL4', 'Azul PN'],
  ['COGN3', 'Cogna ON'],
  ['TAEE11', 'Taesa UNIT'],
  ['ENGI11', 'Energisa UNIT'],
  ['BPAC11', 'BTG Pactual UNIT'],
  ['SANB11', 'Santander Brasil UNIT'],
  ['BBDC3', 'Bradesco ON'],
  ['CMIN3', 'CSN Mineração ON'],
  ['VBBR3', 'Vibra Energia ON'],
  ['ASAI3', 'Assaí ON'],
  ['CRFB3', 'Carrefour Brasil ON'],
  ['YDUQ3', 'Yduqs ON'],
  ['BOVA11', 'iShares Ibovespa (ETF)'],
  ['IVVB11', 'iShares S&P 500 (ETF)'],
  ['HGLG11', 'CSHG Logística (FII)'],
  ['XPLG11', 'XP Log (FII)'],
  ['KNRI11', 'Kinea Renda Imobiliária (FII)'],
  ['MXRF11', 'Maxi Renda (FII)'],
  ['VISC11', 'Vinci Shopping Centers (FII)'],
  ['XPML11', 'XP Malls (FII)'],
].map(([ticker, nome]) => ({ ticker, nome, logo: null }))

// Tira acentos e deixa em maiúsculas, para "itaú" encontrar "ITAU"
function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
}

// Procura na lista local. Devolve até "limite" sugestões, as melhores primeiro:
//   1º) o código COMEÇA com o que foi digitado   (digitou "PET" → PETR4, PETR3)
//   2º) o código CONTÉM o texto                   (digitou "TR4" → PETR4)
//   3º) o nome contém o texto                     (digitou "magazine" → MGLU3)
// Dentro de cada grupo, a ordem da lista (mais negociados primeiro) é mantida.
export function filtrarAcoesLocais(termo, limite = 6) {
  const busca = normalizar(termo.trim())
  if (!busca) return []

  const pontuadas = []
  for (const acao of ACOES) {
    let pontos = 0
    if (acao.ticker.startsWith(busca)) pontos = 3
    else if (acao.ticker.includes(busca)) pontos = 2
    else if (normalizar(acao.nome).includes(busca)) pontos = 1
    if (pontos > 0) pontuadas.push({ acao, pontos })
  }

  // O sort do JavaScript é estável: quem empata em pontos mantém a ordem original
  return pontuadas
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, limite)
    .map((p) => p.acao)
}
