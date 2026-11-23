# VAULT — Value And Upside Live Tracker

## Nome da aplicação, tema e integrantes

- **Aplicação:** VAULT (Value And Upside Live Tracker)
- **Tema:** carteira de investimentos com cotações por API
- **Disciplina:** Desenvolvimento Web II (DW2) — Grupo 5
- **Integrantes:** Hugo, Gabriel, Lucas, Vitor e Miguel

## Objetivo, problema e público-alvo

**Objetivo.** Permitir que a pessoa cadastre os ativos da B3 que tem (ações, FIIs, ETFs, BDRs) e acompanhe, num só lugar, quanto a carteira vale hoje, quanto ela lucrou ou perdeu desde a compra e como se comportou nos últimos 3 meses.

**Problema.** Quem investe em mais de um ativo costuma controlar a carteira em planilhas, digitando cotações à mão. Isso dá trabalho, fica desatualizado e não mostra com facilidade a distribuição da carteira, o desempenho de cada ativo nem a comparação com o mercado (Ibovespa).

**Público-alvo.** Pessoas físicas que investem na bolsa brasileira e querem uma visão simples da própria carteira, sem criar conta e sem enviar seus dados para um servidor.

## Tecnologias

| Tipo | O que foi usado |
|---|---|
| Linguagens | JavaScript (sem TypeScript), HTML, CSS |
| Framework / biblioteca de interface | React 19 |
| Ferramenta de build | Vite 8 (com `base: '/vault/'` para o GitHub Pages) |
| Rotas | React Router 7 (`HashRouter`) |
| Gráficos | Chart.js 4 + react-chartjs-2 5 |
| Ícones | lucide-react |
| Fonte | Manrope, instalada pelo npm (`@fontsource-variable/manrope`) |
| API de dados | [brapi](https://brapi.dev) (cotações, histórico, lista de ativos e setores da B3) |
| Testes | Vitest 5 |
| Qualidade | Oxlint (lint), Lighthouse (auditoria de desempenho e acessibilidade) |
| Publicação | GitHub Pages, com deploy automático pelo GitHub Actions |
| Gerenciador de pacotes | npm |

## Recursos principais

- **Visão geral:** patrimônio total (com animação e centavos em destaque mais fraco), total investido, lucro/prejuízo em R$ e %, variação do dia e um gráfico de rosca com a distribuição da carteira por ativo ou por setor, com o total no centro.
- **Meus ativos:** cadastro com sugestões de ações enquanto se digita, lista com preço atual, valor e lucro de cada ativo, edição, remoção (com botão "Desfazer" por alguns segundos), ordenação e um painel com o gráfico dos últimos 3 meses de cada ativo, junto com máxima e mínima de 52 semanas, volume e valor de mercado.
- **Análises:** evolução do patrimônio nos últimos 3 meses, rentabilidade da carteira comparada ao Ibovespa e rentabilidade de cada ativo em barras.
- **Carteira de exemplo** para conhecer o site sem cadastrar nada.
- **Modo privacidade**, que esconde os valores em R$.
- **Tema claro e escuro.**
- **Exportação da carteira em CSV**, pronta para abrir no Excel, e **importação** do mesmo formato (valida o arquivo e pede confirmação antes de substituir a carteira).
- **Atualização automática** das cotações a cada 10 minutos.

## Requisitos funcionais

1. Cadastrar ativo (código, quantidade e preço médio, dentro dos limites acima). Antes de salvar, o código é conferido na brapi.
2. Editar a quantidade e o preço médio de um ativo, e remover um ativo (a remoção pede confirmação na própria linha e, depois de removido, o aviso oferece "Desfazer" por 7 segundos, devolvendo o ativo à mesma posição da lista).
3. Buscar a cotação atual de cada ativo na brapi, com um botão "Atualizar" para forçar uma nova busca.
4. Calcular e mostrar o valor total e o lucro/prejuízo, por ativo e da carteira toda, em R$ e em %, além da variação do dia.
5. Mostrar a distribuição da carteira num gráfico de rosca, por ativo ou por setor (setor informado pela brapi), com o total no centro.
6. Salvar a carteira no navegador (localStorage), para ela continuar lá ao fechar e abrir o site.
7. Ao clicar num ativo, abrir um painel com o gráfico do preço nos últimos 3 meses, a linha do preço médio e uma tabela com os mesmos dados.
8. Sugerir ações enquanto se digita o código ou o nome da empresa (lista local das mais negociadas + busca na brapi).
9. Ordenar a lista de ativos por ordem de cadastro, maior lucro, maior valor atual ou nome; a escolha fica salva.
10. Atualizar as cotações automaticamente a cada 10 minutos, pausando enquanto a aba está em segundo plano.
11. Exportar a carteira em CSV (separador `;`, vírgula decimal, com linha de total), na mesma ordem da lista.
12. Alternar entre tema claro e escuro; sem escolha da pessoa, segue a preferência do sistema.
13. Navegar entre três páginas: Visão geral, Meus ativos e Análises (menu lateral no computador, barra inferior no celular).
14. Carregar uma carteira de exemplo, com aviso visível de que é fictícia e botão para limpá-la (só os ativos de exemplo são removidos).
15. Ligar o modo privacidade, que mostra "R$ •••••" no lugar dos valores em reais e mantém as porcentagens; a escolha fica salva.
16. Mostrar a evolução do patrimônio nos últimos 3 meses (histórico de cada ativo × a quantidade atual, com esse aviso na tela).
17. Comparar a rentabilidade da carteira com a do Ibovespa no mesmo período, em %, com a diferença em pontos percentuais.
18. Mostrar a rentabilidade de cada ativo em barras horizontais, do que mais rendeu ao que mais perdeu, em verde e vermelho.
19. Ver, no painel de histórico do ativo, a máxima e a mínima de 52 semanas, o volume e o valor de mercado (dados que já vêm na cotação da brapi, sem requisição extra; "—" quando a API não informa).
20. Importar a carteira de um CSV no mesmo formato do exportado: o arquivo é validado (cabeçalho, ticker no formato da B3, quantidade inteira, preço médio, tickers repetidos), erros aparecem numa janela com a linha de cada problema, e uma carteira já cadastrada só é substituída depois de confirmação. Os tickers não são consultados na brapi na importação; um ticker que não existir aparece "sem cotação" na lista.

## Requisitos não funcionais

### Usabilidade
- Estados de carregamento (blocos cinza e progresso como "Carregando os históricos: 3 de 7").
- Mensagens de erro em linguagem simples, com botão "Tentar de novo" quando nenhuma cotação carrega.
- Telas vazias que indicam o próximo passo ("Cadastrar ativo", "Ver carteira de exemplo").
- Avisos rápidos ao cadastrar, editar, remover (com "Desfazer") e exportar.

### Responsividade
- Funciona no celular e no computador. No celular a navegação vira uma barra inferior, os botões do topo viram ícones e a tabela de ativos vira cartões.
- Testado em 390 px e 1280 px de largura, sem rolagem lateral.

### Desempenho
- Cache das respostas da brapi no navegador: cotações por 10 min, histórico por 1 h, sugestões por 24 h, setores por 30 dias.
- Fila de requisições: o plano grátis da brapi aceita uma requisição por vez, então o site faz uma de cada vez.
- Páginas e gráficos carregados sob demanda: a biblioteca de gráficos só é baixada quando algum gráfico vai aparecer.
- **Lighthouse 13.5** (versão de build, rodando localmente), notas de Desempenho · Acessibilidade · Boas práticas · SEO:

| Página | Carteira | Celular (tema claro) | Celular (tema escuro) | Computador |
|---|---|---|---|---|
| Visão geral | vazia | 100 · 100 · 100 · 100 | 100 · 100 · 100 · 100 | 100 · 100 · 100 · 100 |
| Meus ativos | vazia | 100 · 100 · 100 · 100 | 100 · 100 · 100 · 100 | — |
| Análises | vazia | 100 · 100 · 100 · 100 | 100 · 100 · 100 · 100 | — |
| Visão geral | de exemplo | 99 · 100 · 100 · 100 | 99 · 100 · 100 · 100 | 100 · 100 · 100 · 100 |
| Meus ativos | de exemplo | 100 · 100 · 100 · 100 | 100 · 100 · 100 · 100 | — |
| Análises | de exemplo | 97 · 100 · 100 · 100 | 98 · 100 · 100 · 100 | — |

### Acessibilidade
- Todos os campos com rótulo; erros ligados ao campo e foco levado ao primeiro campo com erro.
- Tudo funciona pelo teclado: sugestões com setas e Enter, painel do ativo fecha com Esc e devolve o foco, botão "Pular para o conteúdo", página atual marcada no menu.
- Ao trocar de página, o foco vai para o título da página nova (o leitor de tela anuncia onde a pessoa chegou).
- Contraste das cores conferido (WCAG) nos dois temas; cores dos gráficos escolhidas e testadas para pessoas com daltonismo; ganho e perda também indicados por ícone, sinal e direção, não só pela cor.
- Valores em R$ muito longos não estouram os cartões: a fonte encolhe para caber e, a partir de R$ 1 bilhão, o valor aparece em formato compacto (ex.: "R$ 1,24 bi"), com o valor completo ao passar o mouse.
- Cada gráfico tem descrição para leitor de tela e uma tabela com os mesmos dados.
- Animações desligadas para quem ativou "reduzir movimento" no sistema.

### Segurança
- Validação de todos os campos do formulário, com limites: quantidade inteira de 1 a 10.000.000 e preço médio de R$ 0,01 a R$ 1.000.000,00 (no cadastro, na edição da lista e na importação de CSV). Sem limite, números gigantes perdem precisão no JavaScript e estouram a tela.
- Os dados da carteira ficam só no navegador da pessoa; o VAULT não tem servidor nem banco de dados.
- O CSV exportado é protegido contra "injeção de fórmula" (textos vindos da API que começam com `=`, `+`, `-` ou `@`).
- **Limitação conhecida:** como o site é estático (GitHub Pages), o token da brapi é embutido no JavaScript publicado e pode ser visto por quem inspecionar o código do site. Ele não fica no repositório (vem de um *secret* do GitHub Actions no deploy), mas não há como escondê-lo sem um servidor próprio. O risco é alguém usar a cota gratuita do token.

### Qualidade
- **80 testes automatizados** com Vitest, em 9 arquivos, cobrindo cálculos, ordenação, formatação, importação de CSV, evolução do patrimônio e comparação com o Ibovespa, distribuição da rosca, exportação em CSV e a atualização automática.
- Lint (Oxlint) sem erros nem avisos.

## Como acessar e usar

- **Site publicado:** https://vault-grupo5.github.io/vault/
- **Repositório:** https://github.com/vault-grupo5/vault

### Usando o site
1. Na **Visão geral**, clique em **"Ver carteira de exemplo"** para ver o site funcionando, ou em **"Cadastrar ativo"**.
2. Em **Meus ativos**, digite o código ou o nome da empresa (ex.: "PETR4" ou "Petrobras"), escolha uma sugestão, informe a quantidade e o preço médio e clique em **"Adicionar à carteira"**.
3. Clique num ativo da lista para ver o gráfico dos últimos 3 meses.
4. Em **Análises**, veja a evolução do patrimônio, a comparação com o Ibovespa e a rentabilidade de cada ativo.
5. Na barra do topo: atualizar cotações, modo privacidade (olho), exportar e importar CSV e trocar o tema.

### Rodando localmente
Requisitos: Node.js (versão LTS) e npm.

```bash
git clone https://github.com/vault-grupo5/vault.git
cd vault
npm install
npm run dev
```

Abra http://localhost:5173/vault/

**Token da brapi (opcional).** Sem token, só PETR4, VALE3, MGLU3 e ITUB4 têm cotação. Para usar os outros ativos, crie um token gratuito em brapi.dev e um arquivo `.env.local` na raiz do projeto (ele é ignorado pelo git):

```
VITE_BRAPI_TOKEN=seu_token_aqui
```

### Outros comandos

| Comando | O que faz |
|---|---|
| `npm test` | Roda os 80 testes automatizados (Vitest) |
| `npm run lint` | Roda o Oxlint |
| `npm run build` | Gera a versão de produção na pasta `dist/` |
| `npm run preview` | Serve a versão de produção em http://localhost:4173/vault/ |

## Participação de cada integrante

Divisão inicial dos arquivos (registrada pelo grupo no começo do trabalho), apenas como referência para o preenchimento abaixo:

| Integrante | Arquivos da divisão inicial |
|---|---|
| Hugo | `src/services/brapi.js`, `src/utils/ativo.js` |
| Gabriel | `src/components/FormularioAtivo.jsx` |
| Lucas | `src/components/ListaCarteira.jsx`, `src/utils/storage.js` |
| Vitor | `src/components/ResumoCarteira.jsx`, `src/utils/calculos.js` |
| Miguel | `src/components/GraficoRosca.jsx` (antes `GraficoPizza.jsx`), `src/styles/variaveis.css` |

### Hugo
(a preencher pelo grupo)

### Gabriel
(a preencher pelo grupo)

### Lucas
(a preencher pelo grupo)

### Vitor
(a preencher pelo grupo)

### Miguel
(a preencher pelo grupo)
