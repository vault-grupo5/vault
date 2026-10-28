# Guia de estudo — Miguel

**Arquivos:** `src/components/GraficoRosca.jsx` (+ `GraficoRosca.css`; antes era `GraficoPizza.jsx`) e `src/styles/variaveis.css` (as cores do site).

## O que o código faz

**`GraficoRosca.jsx`** mostra a **distribuição da carteira** na Visão geral, num gráfico de rosca (uma pizza com um furo no meio):
- no furo aparece o **total** da carteira e quantos ativos (ou setores) são;
- um seletor alterna entre **"Por ativo"** e **"Por setor"** (o setor vem da brapi e só é buscado quando se escolhe essa opção);
- a **legenda** ao lado mostra cada fatia com a cor, o nome, a % e o valor; passar o mouse ou o foco do teclado num item destaca a fatia;
- com mais de 6 grupos, os 5 maiores ficam e o resto vira uma fatia cinza "Outros (n)".

**`variaveis.css`** guarda todas as cores e medidas do site em variáveis CSS (`--cor-fundo`, `--cor-destaque`...). O tema escuro é o padrão; o tema claro só redefine essas variáveis quando o `<html>` tem `data-tema="claro"`. As 6 cores dos gráficos (`--cor-grafico-1` a `--cor-grafico-6`) também ficam aqui.

## Conceitos usados

- **Chart.js e react-chartjs-2**: o gráfico é o componente `<Doughnut>`; registramos só as partes usadas (`ArcElement`, `Tooltip`) para o site ficar mais leve.
- **Estado com valor inicial vindo de função**: `useState(lerVisao)` lê do `localStorage` a última escolha "por ativo/por setor" só uma vez.
- **`useMemo`**: as fatias só são recalculadas quando a carteira, a visão ou os setores mudam.
- **Hook personalizado `useSetores`**: busca o setor de cada ativo (um de cada vez, com cache de 30 dias).
- **Variáveis CSS e temas**: `var(--cor-...)` no CSS; o canvas do gráfico não entende `var()`, então as cores são lidas com `getComputedStyle` (função `lerCor`).
- **Acessibilidade**: `fieldset` + rádios para o seletor (funciona com as setas), `aria-label` descrevendo o gráfico para leitor de tela, legenda em texto (não depende só da cor).
- **Cores para daltonismo**: a paleta e a ordem de desenho das fatias foram testadas com um validador de cores nos dois temas.
- **Carregamento sob demanda (`React.lazy`)**: o gráfico (e o Chart.js) só é baixado quando há ativos.

## Trecho importante, linha a linha

Montagem das fatias e das cores (`GraficoRosca.jsx`):

```js
const fatiasBase = useMemo(() => {
  if (visao === 'ativo') return montarFatias(agruparPorAtivo(posicoes))
  if (setores.carregando) return []
  return montarFatias(agruparPorSetor(posicoes, (ticker) => nomeDoSetor(setores.setores[ticker])))
}, [posicoes, visao, setores.carregando, setores.setores])

const fatias = fatiasBase.map((f) => ({
  ...f,
  cor: lerCor(f.indiceCor ? `--cor-grafico-${f.indiceCor}` : '--cor-grafico-outros'),
}))
const total = posicoes.reduce((soma, p) => soma + p.valorAtual, 0)
const desenho = ordenarParaDesenho(fatias)
```

- `useMemo(() => {...}, [deps])` — guarda o resultado e só refaz a conta quando algo da lista de dependências muda.
- `if (visao === 'ativo')` — um grupo por ativo (`agruparPorAtivo`), e `montarFatias` calcula a % de cada um, ordena do maior para o menor e junta o excesso em "Outros".
- `if (setores.carregando) return []` — na visão por setor, enquanto os setores chegam, a tela mostra "Buscando o setor dos ativos: 2 de 6…".
- `agruparPorSetor(..., (ticker) => nomeDoSetor(...))` — soma os ativos do mesmo setor; `nomeDoSetor` traduz o setor que a brapi manda em inglês ("Finance" → "Financeiro").
- `lerCor(...)` — lê a cor de verdade da variável CSS. É feito **a cada desenho**: quando o tema troca, as fatias já saem com as cores do tema novo.
- `f.indiceCor` — a cor segue a **ordem de cadastro** do ativo, não o tamanho: se um ativo passar outro em valor, cada um continua com a sua cor. "Outros" não tem índice e fica cinza.
- `posicoes.reduce(...)` — soma o valor atual de todos os ativos para o total do centro.
- `ordenarParaDesenho(fatias)` — ordem em que as fatias são desenhadas na rosca, para que cores parecidas para quem tem daltonismo nunca fiquem lado a lado. A legenda continua do maior para o menor.

## Perguntas que o professor pode fazer

1. **Por que a cor de cada fatia não muda quando os valores mudam?**
   A cor está ligada ao ativo (ordem de cadastro), e não à posição por tamanho. Se fosse pelo tamanho, bastaria um ativo passar outro em valor para as cores trocarem de dono, e a pessoa se confundiria.

2. **Por que as fatias não são desenhadas do maior para o menor?**
   Numa rosca cada fatia encosta nas vizinhas, inclusive a última na primeira. Testamos todas as combinações com um validador de cores: algumas cores lado a lado (rosa e verde, amarelo e laranja) ficam quase iguais para daltônicos. Desenhando na ordem das cores, só encostam pares que passaram no teste; com 4 fatias usamos a ordem 1-2-4-3, porque o azul encostaria no roxo.

3. **Como funciona o tema claro sem repetir todo o CSS?**
   Todo o site usa `var(--cor-...)`. O `variaveis.css` define as cores do tema escuro em `:root`, e em `:root[data-tema='claro']` define só os valores novos. Trocar o atributo `data-tema` no `<html>` muda todas as cores de uma vez.

4. **Se o CSS já tem as cores, por que o gráfico precisa de `lerCor`?**
   O Chart.js desenha num `<canvas>`, que recebe cores prontas (ex: `#8b5cf6`) e não entende `var(--cor-grafico-1)`. `lerCor` usa `getComputedStyle` para ler o valor atual da variável; assim as cores continuam definidas num lugar só.

5. **Como alguém que usa leitor de tela entende o gráfico?**
   O `<canvas>` recebe um `aria-label` com a descrição completa ("Distribuição da carteira por ativo, total R$ ...: PETR4 36,36%, ..."). A legenda é uma lista em texto com nome, % e valor, e o seletor "Por ativo / Por setor" é um grupo de rádios com nome, que funciona pelo teclado.

## Testes relacionados
`src/utils/alocacao.test.js` (8 testes): agrupamento por setor, % das fatias, cor pela ordem da carteira, "Outros" acima de 6 grupos e a ordem de desenho (inclusive o caso de 4 fatias).
