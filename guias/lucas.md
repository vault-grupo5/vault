# Guia de estudo — Lucas

**Arquivos:** `src/components/ListaCarteira.jsx` (+ `ListaCarteira.css`), `src/components/LinhaAtivo.jsx` (cada linha da lista) e `src/utils/storage.js` (salvar no navegador).

## O que o código faz

**`ListaCarteira.jsx`** mostra os ativos na página **Meus ativos**: logo, código, nome da empresa, quantidade, preço médio, preço atual, variação do dia, valor atual e lucro/prejuízo. Tem o seletor **"Ordenar por"** (só aparece com 2 ou mais ativos) e, com a carteira vazia, um convite para cadastrar ou ver a carteira de exemplo. No computador é uma tabela; quando o espaço é estreito (celular), cada linha vira um cartão.

**`LinhaAtivo.jsx`** é uma linha da lista. Ela tem 3 modos:
- **ver**: os números normais e os botões de editar e remover;
- **editar**: quantidade e preço médio viram campos (Enter salva, Esc cancela);
- **remover**: pergunta "Remover? Sim / Não" antes de apagar.

Ela também **pisca** verde ou vermelho quando o preço muda numa atualização e, ao clicar no ativo, abre o painel com o gráfico de 3 meses.

**`storage.js`** guarda a carteira no `localStorage` (`salvarCarteira`) e lê de volta ao abrir o site (`carregarCarteira`), descartando qualquer item que não tenha o formato de ativo.

## Conceitos usados

- **Props**: a lista recebe `posicoes` (os ativos já com os cálculos), `ordem`, `erros` e funções como `aoEditar` e `aoRemover`. Quem altera a carteira é o hook `useCarteira`; a lista só avisa.
- **Renderizar listas com `map` e `key`**: `posicoes.map(...)` cria uma `<LinhaAtivo>` por ativo; `key={posicao.id}` diz ao React qual linha é qual quando a lista é reordenada ou muda.
- **Estado local (`useState`)**: cada linha guarda o próprio `modo`, o `rascunho` da edição e o erro da edição.
- **Renderização condicional**: `{modo === 'editar' && (...)}` mostra partes diferentes conforme o modo.
- **`localStorage` + JSON**: o `localStorage` só guarda texto; `JSON.stringify` transforma a lista em texto e `JSON.parse` faz o caminho de volta.
- **`try`/`catch`**: no modo anônimo alguns navegadores bloqueiam o `localStorage`; o site continua funcionando, só não salva.
- **Tabela semântica e acessível**: `<table>`, `<caption>`, `<th scope="col">` e `<th scope="row">`; botões com `aria-label` ("Editar PETR4").
- **Container query (CSS)**: a tabela vira cartões conforme a largura da própria lista (`@container`), e não da tela inteira.

## Trecho importante, linha a linha

Carregar a carteira salva (`storage.js`):

```js
export function carregarCarteira() {
  try {
    const texto = localStorage.getItem(CHAVE_CARTEIRA)
    if (!texto) return []
    const dados = JSON.parse(texto)
    return Array.isArray(dados) ? dados.filter(ehAtivoValido) : []
  } catch {
    return []
  }
}
```

- `localStorage.getItem(CHAVE_CARTEIRA)` — lê o texto salvo na chave `'vault:carteira'`. Se nunca salvamos nada, vem `null`.
- `if (!texto) return []` — primeira visita: carteira vazia.
- `JSON.parse(texto)` — transforma o texto de volta em lista de objetos. Se o texto estiver corrompido, isso lança um erro (cai no `catch`).
- `Array.isArray(dados)` — garante que é uma lista mesmo.
- `.filter(ehAtivoValido)` — mantém só os itens com `id`, `ticker`, `quantidade > 0` e `precoMedio > 0`. Protege o site se alguém editar o `localStorage` à mão.
- `catch { return [] }` — qualquer problema (JSON inválido, navegador bloqueando) começa com a carteira vazia, em vez de o site quebrar.

O "piscar" ao mudar o preço (`LinhaAtivo.jsx`):

```js
const precoCotacao = cotacao?.preco ?? null
const [precoAnterior, setPrecoAnterior] = useState(precoCotacao)
const [piscar, setPiscar] = useState(null)

if (precoCotacao !== precoAnterior) {
  setPrecoAnterior(precoCotacao)
  if (precoAnterior !== null && precoCotacao !== null) {
    setPiscar(precoCotacao > precoAnterior ? 'ganho' : 'perda')
  }
}
```

- `cotacao?.preco ?? null` — o preço atual, ou `null` se a cotação ainda não chegou (`?.` evita erro quando `cotacao` não existe).
- `precoAnterior` — o último preço que a linha viu.
- `if (precoCotacao !== precoAnterior)` — durante o desenho, compara o preço novo com o anterior. É o jeito recomendado pelo React para "reagir quando uma prop muda".
- `if (precoAnterior !== null ...)` — não pisca na primeira carga, só quando o preço realmente muda.
- `setPiscar('ganho' | 'perda')` — coloca a classe CSS que faz a linha piscar verde ou vermelho; ao fim da animação, a classe é retirada.

## Perguntas que o professor pode fazer

1. **Por que cada linha precisa de `key`?**
   O React usa a `key` para saber qual linha é qual entre um desenho e outro. Com `key={posicao.id}`, ao ordenar ou remover um ativo ele move a linha certa e mantém o estado dela (por exemplo, uma linha no meio da edição).

2. **Por que usar `JSON.stringify` para salvar?**
   O `localStorage` só guarda texto. `JSON.stringify` transforma a lista de objetos em texto e `JSON.parse` transforma de volta. O formato é sempre `{ id, ticker, quantidade, precoMedio }`; o preço atual não é salvo, porque vem da brapi.

3. **Por que a remoção pergunta "Sim / Não" na própria linha, e não com `alert`?**
   Evita apagar por um clique errado, sem abrir uma janela que interrompe tudo. Dá para responder pelo teclado (o foco vai para o "Sim", e Esc cancela).

4. **Onde fica salvo o novo valor quando a pessoa edita um ativo?**
   A linha chama `aoEditar(id, { quantidade, precoMedio })`. O hook `useCarteira` cria uma lista nova com o ativo atualizado; um `useEffect` percebe que a lista mudou e chama `salvarCarteira`.

5. **Como a tabela funciona no celular?**
   Com uma *container query* no CSS: quando a própria lista fica com menos de 720 px, cada linha vira um cartão e o título de cada coluna aparece em cima do valor (lido do atributo `data-rotulo` de cada célula).

## Novidade: desfazer a remoção
Depois de confirmar a remoção na linha, o aviso "PETR4 removido da carteira" ganhou o botão **Desfazer** (fica 7 segundos). Em `useCarteira.js`, `removerAtivo` guarda o ativo e a posição dele na lista e passa ao aviso uma `acao` com a função `desfazerRemocao`; essa função coloca o ativo de volta no mesmo lugar (a cor dele nos gráficos depende da ordem de cadastro). Se a pessoa cadastrou o mesmo ticker nesse meio tempo, não duplica. Como o botão roda segundos depois, a lista atual é lida por uma `ref` (o `ativos` capturado na remoção já estaria velho).
- **Pergunta possível:** "Por que o Desfazer usa uma ref?" → a função foi criada quando o ativo foi removido e guarda o valor antigo de `ativos` (closure); a ref sempre aponta para a lista mais nova.

## Testes relacionados
A ordenação usada pelo seletor "Ordenar por" é testada em `src/utils/ordenacao.test.js`.
