// Nomes dos setores em português.
// A brapi manda o setor em inglês, numa lista fixa de 20 setores (conferida na API:
// "availableSectors" da rota /quote/list). Aqui só TRADUZIMOS esses nomes; o setor de
// cada ativo vem da API, não é inventado.

const SETORES_EM_PORTUGUES = {
  Finance: 'Financeiro',
  Utilities: 'Utilidade pública',
  'Energy Minerals': 'Petróleo e gás',
  'Non-Energy Minerals': 'Mineração e siderurgia',
  'Retail Trade': 'Varejo',
  'Producer Manufacturing': 'Bens industriais',
  'Process Industries': 'Química, papel e agro',
  'Consumer Non-Durables': 'Consumo não durável',
  'Consumer Durables': 'Consumo durável',
  'Consumer Services': 'Serviços ao consumidor',
  'Commercial Services': 'Serviços comerciais',
  'Distribution Services': 'Distribuição',
  Transportation: 'Transporte e logística',
  'Health Services': 'Serviços de saúde',
  'Health Technology': 'Saúde e farmacêuticas',
  'Technology Services': 'Serviços de tecnologia',
  'Electronic Technology': 'Tecnologia e eletrônicos',
  Communications: 'Telecomunicações',
  'Industrial Services': 'Serviços industriais',
  Miscellaneous: 'Diversos',
}

export const SEM_CLASSIFICACAO = 'Sem classificação'

// Transforma o { setor, tipo } da brapi no nome que aparece no gráfico.
// FIIs/ETFs e BDRs ganham um grupo próprio: o "setor" deles na brapi não diz muito
// (um FII de galpões aparece como "Finance", um ETF como "Miscellaneous").
export function nomeDoSetor(info) {
  if (!info) return SEM_CLASSIFICACAO
  if (info.tipo === 'fund') return 'Fundos (FIIs e ETFs)'
  if (info.tipo === 'bdr') return 'BDRs (empresas estrangeiras)'
  return SETORES_EM_PORTUGUES[info.setor] ?? SEM_CLASSIFICACAO
}
