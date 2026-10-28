# Guia de estudo — Vitor

**Arquivos:** `src/utils/calculos.js` (as contas) e `src/components/ResumoCarteira.jsx` (+ `ResumoCarteira.css`, o cartão do resumo).

## O que o código faz

**`calculos.js`** faz as contas da carteira:
- `calcularPosicao(ativo, cotacao)`: para um ativo, calcula o valor investido (quantidade × preço médio), o valor atual (quantidade × preço atual), o lucro em R$ e o lucro em %. Sem cotação, usa o preço médio (lucro zero) e marca `temCotacao: false`;
- `calcularPosicoes(ativos, cotacoes)`: faz o mesmo para todos os ativos;
- `calcularResumo(posicoes)`: soma tudo para a carteira e calcula a variação do dia em R$ e em %;
- `calcularDistribuicao(posicoes)`: quanto cada ativo representa do total.

**`ResumoCarteira.jsx`** é o cartão no topo da **Visão geral**: o **patrimônio total** em destaque (o número "corre" até o valor novo quando muda, e os centavos ficam mais apagados), o lucro desde a compra numa pílula verde ou vermelha, e quatro indicadores: total investido, lucro/prejuízo, variação de hoje e número de ativos. Enquanto as cotações chegam pela primeira vez, mostra um bloco cinza de carregamento. Se algum ativo está sem cotação, avisa que o total é aproximado.

## Conceitos usados

- **Funções puras**: as funções de `calculos.js` só recebem dados e devolvem resultados, sem mexer em nada fora delas. Isso as torna fáceis de testar e de explicar.
- **`map`, `filter`, `reduce`** e laço `for...of` para percorrer e somar listas.
- **Encadeamento opcional (`?.`)**: `cotacao?.preco` não dá erro quando a cotação ainda não existe.
- **Props**: o `ResumoCarteira` recebe `resumo` e `carregando`; ele só mostra, não calcula.
- **`useMemo`** (no hook `useCarteira`): o resumo só é recalculado quando os ativos ou as cotações mudam.
- **Hook personalizado `useNumeroAnimado`**: anima o total com `requestAnimationFrame`, desligado para quem pediu "reduzir movimento".
- **Hook `useMoeda`**: formata em R$ e respeita o modo privacidade ("R$ •••••").
- **Lista de definição (`<dl>`, `<dt>`, `<dd>`)**: a forma semântica certa de pares "rótulo → valor".

## Trecho importante, linha a linha

O cálculo da variação do dia dentro de `calcularResumo`:

```js
for (const posicao of posicoes) {
  valorInvestido += posicao.valorInvestido
  valorAtual += posicao.valorAtual

  const percentualDia = posicao.cotacao?.variacaoDia
  if (posicao.temCotacao && typeof percentualDia === 'number') {
    variacaoDia += posicao.valorAtual - posicao.valorAtual / (1 + percentualDia / 100)
  }
}

const lucro = valorAtual - valorInvestido
const valorOntem = valorAtual - variacaoDia
```

- `for (const posicao of posicoes)` — passa por cada ativo da carteira.
- `valorInvestido += ...` e `valorAtual += ...` — vão somando os totais.
- `posicao.cotacao?.variacaoDia` — a brapi informa quanto o ativo subiu ou caiu **hoje**, em % (ex: 1.5 = +1,5%).
- `if (posicao.temCotacao && typeof ... === 'number')` — só entra na conta quem tem cotação e variação.
- `posicao.valorAtual / (1 + percentualDia / 100)` — se hoje vale V e subiu p%, ontem valia V ÷ (1 + p/100). Ex: hoje R$ 3.300 com +10% → ontem R$ 3.000.
- `valorAtual - (valor de ontem)` — a diferença é quanto ganhou (ou perdeu) hoje, em R$.
- `lucro = valorAtual - valorInvestido` — lucro desde a compra.
- `valorOntem = valorAtual - variacaoDia` — base para calcular a variação do dia em %.

## Perguntas que o professor pode fazer

1. **O que é uma função pura e por que usar aqui?**
   É uma função que, com as mesmas entradas, sempre devolve o mesmo resultado e não altera nada fora dela. As contas da carteira ficam fáceis de testar: os testes de `calculos.test.js` passam dados prontos e conferem o resultado, sem precisar de internet nem de navegador.

2. **O que acontece com um ativo que ainda não tem cotação?**
   `calcularPosicao` usa o preço médio como preço atual (lucro zero) e marca `temCotacao: false`. O resumo conta quantos estão assim e mostra o aviso "ativo(s) sem cotação: usando o preço médio no total".

3. **Como a variação do dia em R$ é calculada, se a brapi só dá a %?**
   Se hoje o ativo vale V e subiu p%, ontem valia V ÷ (1 + p/100). A diferença entre hoje e ontem é o ganho do dia. Somando todos os ativos temos o "Hoje" da carteira.

4. **Por que o total é animado e o que acontece com quem não gosta de animação?**
   A animação ajuda a perceber que o valor mudou. O hook `useNumeroAnimado` confere `prefers-reduced-motion`: se a pessoa pediu menos movimento no sistema, o número aparece direto, sem animar.

5. **Por que o lucro em % é calculado sobre o valor investido?**
   Porque a pergunta é "quanto o meu dinheiro rendeu": lucro ÷ quanto paguei. A conta é protegida: se o investido for zero, o resultado é 0 (evita divisão por zero).

## Testes relacionados
`src/utils/calculos.test.js` (10 testes): lucro e prejuízo, ativo sem cotação, soma do resumo, variação do dia, carteira vazia e distribuição.
