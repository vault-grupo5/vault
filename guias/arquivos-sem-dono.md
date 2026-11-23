# Arquivos sem dono — para o grupo dividir

A divisão inicial do grupo (no `CLAUDE.md` e no README) cobre 9 arquivos. Os arquivos abaixo foram criados depois (ou não tinham dono) e precisam de alguém para estudar e explicar no vídeo.

A coluna **"Ligado a"** só mostra com qual parte já dividida o arquivo conversa, para ajudar na escolha. **A decisão de quem fica com cada um é do grupo.**

## Entrada do site e páginas

| Arquivo | O que faz | Ligado a |
|---|---|---|
| `index.html` | Página base: título, descrição, favicon e um script que aplica o tema claro/escuro antes da página aparecer (evita "piscar" o tema errado). | tema |
| `src/main.jsx` | Liga o React à página e importa a fonte Manrope e o CSS global. | — |
| `src/App.jsx` | Cria o estado da carteira, do tema e da privacidade, e define as 3 páginas com o `HashRouter` (rotas depois do `#`, por causa do GitHub Pages). Meus ativos e Análises carregam sob demanda. | todos |
| `src/paginas/VisaoGeral.jsx` | Página inicial: resumo + gráfico de rosca, ou o cartão "Comece pela sua carteira". | Vitor, Miguel |
| `src/paginas/MeusAtivos.jsx` | Página com o formulário, a lista e o painel de histórico. | Gabriel, Lucas |
| `src/paginas/Analises.jsx` | Página com evolução do patrimônio, comparação com o Ibovespa e rentabilidade por ativo; busca os históricos. | — |
| `src/paginas/Paginas.css` | Grade das páginas e o cartão "começar". | — |
| `src/index.css` | Estilos globais: cartões, botões, campos, pílulas, esqueleto de carregamento, "reduzir movimento". | Miguel (cores) |

## Componentes (`src/components/`)

| Arquivo | O que faz | Ligado a |
|---|---|---|
| `Layout.jsx` (+ .css) | Moldura de todas as páginas (menu, topo, avisos, conteúdo, rodapé). Leva o foco ao título ao trocar de página e tem o "Pular para o conteúdo". | — |
| `Navegacao.jsx` (+ .css) | O menu: lateral no computador, barra embaixo no celular; marca a página atual. | — |
| `Cabecalho.jsx` (+ .css) | Barra do topo: indicador "ao vivo", Atualizar, privacidade, Exportar CSV e tema. | Hugo (cotações) |
| `CampoTicker.jsx` (+ .css) | Campo do código com sugestões de ações (setas, Enter, Esc; acessível para leitor de tela). | Gabriel |
| `PainelHistorico.jsx` (+ .css) | Janela (`<dialog>`) com o gráfico de 3 meses de um ativo, linha do preço médio e tabela. | Lucas (abre pela lista) |
| `GraficoEvolucao.jsx` | Gráfico da evolução do patrimônio em 3 meses. | — |
| `GraficoComparacao.jsx` | Gráfico da carteira × Ibovespa, em %. | — |
| `GraficoRentabilidade.jsx` | Barras com a rentabilidade de cada ativo. | Vitor (lucro %) |
| `Analises.css` | Estilos em comum dos 3 gráficos de Análises. | — |
| `AvisoExemplo.jsx` (+ .css) | Faixa roxa "Esta é uma carteira de exemplo" com o botão "Limpar exemplo". | — |
| `BannerErro.jsx` (+ .css) | Faixa vermelha quando nenhuma cotação carrega, com "Tentar de novo". | Hugo |
| `Aviso.jsx` (+ .css) | Aviso flutuante ("PETR4 adicionado à carteira"), que some sozinho. | — |
| `Carregando.jsx` | Bloco cinza enquanto uma página ou gráfico é baixado. | — |
| `Logo.jsx` (+ .css) | Logo do VAULT (porta de cofre) em SVG, nas cores do tema. | Miguel (identidade) |
| `LogoAtivo.jsx` (+ .css) | Logo da empresa vinda da brapi ou, se não houver, as iniciais. | Lucas |
| `Dinheiro.jsx` | Valor em R$ com os centavos mais apagados; respeita o modo privacidade. | Vitor |
| `Pilula.jsx` | "Pílula" verde/vermelha de ganho/perda com ícone de tendência. | Vitor |

## Hooks (`src/hooks/`)

| Arquivo | O que faz | Ligado a |
|---|---|---|
| `useCarteira.js` | TODO o estado da carteira e as ações (adicionar, editar, remover, ordenar, exportar, exemplo, buscar cotações). | todos |
| `useAtualizacaoAutomatica.js` | Liga o agendador ao React (atualização a cada 10 min). | Hugo |
| `useBuscaPorTicker.js` | Busca um ticker por vez e informa o progresso ("3 de 6"). | Hugo |
| `useHistoricos.js` | Históricos de vários ativos (usa o anterior). | Hugo |
| `useSetores.js` | Setor de cada ativo, só quando a rosca está "por setor". | Miguel |
| `useSugestoes.js` | Sugestões do campo de código: lista local + brapi com espera de 400 ms (debounce). | Gabriel |
| `useTema.js` | Tema claro/escuro: segue o sistema, guarda a escolha. | Miguel |
| `usePrivacidade.js` | Liga/desliga o modo privacidade e guarda a escolha. | — |
| `useMoeda.js` | Contexto da privacidade + `moeda()`, que mostra "R$ •••••" quando ligado. | — |
| `useNumeroAnimado.js` | Faz o total "correr" até o valor novo. | Vitor |
| `useTituloDaPagina.js` | Muda o título da aba do navegador conforme a página. | — |

## Utilitários (`src/utils/`)

| Arquivo | O que faz | Ligado a |
|---|---|---|
| `formatacao.js` | Moeda em R$, porcentagem com sinal, horário, leitura de número digitado ("32,50"). | todos |
| `ordenacao.js` | Ordenar a lista (cadastro, lucro, valor, nome) e guardar a escolha. | Lucas |
| `exportarCsv.js` | Gera e baixa o CSV da carteira (formato do Excel em português, proteção contra fórmulas). | Lucas, Vitor |
| `agendador.js` | Regra da atualização automática: a cada 10 min, pausa com a aba escondida. | Hugo |
| `evolucao.js` | Evolução do patrimônio em 3 meses e comparação com o Ibovespa. | Vitor (cálculos) |
| `alocacao.js` | Agrupa por ativo ou setor, monta as fatias da rosca e a ordem de desenho. | Miguel |
| `setores.js` | Traduz os setores da brapi para português. | Miguel |
| `acoesB3.js` | Lista local das ações mais negociadas (sugestões instantâneas). | Gabriel |
| `carteiraExemplo.js` | Os 6 ativos da carteira de exemplo. | — |
| `cache.js` | Cache com prazo de validade no `localStorage`. | Hugo |
| `cores.js` | Lê uma cor das variáveis CSS (para os gráficos). | Miguel |
| `graficos.js` | Peças em comum dos gráficos (datas, balão, eixos, degradê). | — |

## Testes (`src/utils/*.test.js`, `npm test`)

| Arquivo | Testes | Ligado a |
|---|---|---|
| `calculos.test.js` | 10 | Vitor |
| `ordenacao.test.js` | 6 | Lucas |
| `formatacao.test.js` | 14 | — |
| `evolucao.test.js` | 12 | — |
| `alocacao.test.js` | 8 | Miguel |
| `exportarCsv.test.js` | 6 | — |
| `agendador.test.js` | 6 | — |

## Configuração e publicação

| Arquivo | O que faz |
|---|---|
| `vite.config.js` | Configuração do Vite, com `base: '/vault/'` (obrigatório para o GitHub Pages). |
| `.github/workflows/deploy.yml` | Publica o site no GitHub Pages a cada push na `main`, usando o token guardado como *secret*. |
| `public/favicon.svg` | Ícone da aba (mesmo desenho do logo). |
| `.oxlintrc.json` | Regras do lint. |
