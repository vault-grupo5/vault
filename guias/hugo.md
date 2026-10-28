# Guia de estudo — Hugo

**Arquivos:** `src/services/brapi.js` (conversa com a API) e `src/utils/ativo.js` (formato do ativo).

## O que o código faz

**`ativo.js`** define o formato de um ativo, usado pelo site inteiro: `{ id, ticker, quantidade, precoMedio }`. A função `criarAtivo` monta esse objeto: gera um `id` único, deixa o ticker em maiúsculas e sem espaços e garante que quantidade e preço sejam números.

**`brapi.js`** é a única parte do site que fala com a brapi. Ele:
- **busca a cotação** de um ativo (`buscarCotacao`) ou de vários (`buscarCotacoes`) e devolve um objeto simples, em português: `{ ticker, nome, preco, variacaoDia, atualizadoEm, logo }`;
- **busca o histórico de 3 meses** (`buscarHistorico`), a **lista de sugestões** (`buscarSugestoes`) e o **setor** de um ativo (`buscarSetor`);
- **guarda as respostas num cache** no `localStorage` (10 min para cotação, 1 h para histórico, 24 h para sugestões, 30 dias para setor), para não gastar requisições à toa;
- **faz uma requisição por vez** (fila), porque o plano grátis da brapi recusa requisições ao mesmo tempo (erro 429);
- **traduz os erros** em mensagens que a pessoa entende ("Ticker XPTO3 não encontrado.", "Sem conexão com a API...").

## Conceitos usados

- **`fetch`**: função do navegador que faz uma requisição HTTP e devolve uma *Promise* com a resposta.
- **Promise e `async`/`await`**: uma Promise é um "valor que vai chegar depois". `await` espera ela terminar sem travar a página; só pode ser usado dentro de funções `async`.
- **`try`/`catch`/`throw`**: tratamento de erros. Lançamos (`throw`) um `Error` com mensagem amigável, e quem chamou decide o que mostrar.
- **Cache com `localStorage`**: o navegador guarda texto por site. Salvamos o JSON da resposta e o horário (`salvoEm`); se ainda estiver dentro do prazo, usamos o que já temos.
- **Variáveis de ambiente do Vite**: `import.meta.env.VITE_BRAPI_TOKEN` é trocado pelo valor do token na hora do build.
- **`URL` e `searchParams`**: montam o endereço com segurança (ex: `?token=...&range=3mo`).
- **`encodeURIComponent`**: protege caracteres especiais no endereço (o Ibovespa é `^BVSP`, e o `^` vira `%5E`).
- **`crypto.randomUUID()`** (em `ativo.js`): gera um identificador único para cada ativo.

## Trecho importante, linha a linha

A fila de requisições e a função que faz cada pedido (`brapi.js`):

```js
let fila = Promise.resolve()

function enfileirar(tarefa) {
  const resultado = fila.then(tarefa)
  fila = resultado.catch(() => {})
  return resultado
}
```

- `let fila = Promise.resolve()` — a fila começa como uma Promise que já terminou ("não há nada esperando").
- `fila.then(tarefa)` — a nova tarefa só começa **depois** que a última da fila terminar. É isso que garante "uma requisição por vez".
- `fila = resultado.catch(() => {})` — a próxima tarefa vai esperar por esta. O `catch` vazio faz a fila continuar andando mesmo se esta tarefa der erro.
- `return resultado` — quem pediu recebe o resultado (ou o erro) da própria tarefa.

```js
function pedirJson(url, codigo, signal) {
  return enfileirar(async () => {
    if (signal?.aborted) throw new DOMException('Busca cancelada', 'AbortError')

    let resposta
    try {
      resposta = await fetch(url, { signal })
      if (resposta.status === 429) {
        await esperar(ESPERA_ANTES_DE_REPETIR_MS)
        resposta = await fetch(url, { signal })
      }
    } catch (erro) {
      if (erro.name === 'AbortError') throw erro
      throw new Error('Sem conexão com a API. Verifique sua internet.')
    }

    const dados = await resposta.json().catch(() => ({}))
    if (!resposta.ok) {
      const erro = new Error(mensagemDeErro(resposta.status, codigo, dados))
      erro.status = resposta.status
      throw erro
    }
    return dados
  })
}
```

- `enfileirar(async () => { ... })` — todo pedido entra na fila.
- `if (signal?.aborted) ...` — se a busca foi cancelada enquanto esperava (a pessoa continuou digitando no campo de sugestões), nem chega a ser enviada: economiza requisição.
- `await fetch(url, { signal })` — faz a requisição de verdade.
- `if (resposta.status === 429)` — 429 é "muitas requisições". Esperamos 2 s (`esperar`) e tentamos **uma** vez de novo.
- `catch (erro)` — `fetch` só dá erro quando não há conexão (ou quando foi cancelado). Trocamos pela mensagem amigável.
- `resposta.json().catch(() => ({}))` — lê o corpo da resposta como JSON; se não for JSON, usa um objeto vazio para não quebrar.
- `if (!resposta.ok)` — `ok` é falso para códigos de erro (400, 401, 404...). Montamos a mensagem com `mensagemDeErro` e guardamos o código em `erro.status`.
- `return dados` — deu certo: devolve o JSON para a função que pediu (ex: `buscarCotacao`).

## Perguntas que o professor pode fazer

1. **Por que usar cache se a brapi já é rápida?**
   Porque o plano grátis tem limite de 15.000 requisições por mês e as cotações só mudam a cada ~30 min. Com o cache, reabrir o site ou trocar de página não gasta requisição. Cada tipo de dado tem um prazo diferente, de acordo com quanto ele muda.

2. **O que acontece se a pessoa estiver sem internet?**
   O `fetch` lança um erro, o `catch` troca pela mensagem "Sem conexão com a API. Verifique sua internet.", e a tela mostra essa mensagem com um botão "Tentar de novo". As cotações que já estavam no cache continuam sendo usadas.

3. **Por que as requisições vão uma de cada vez, e não todas juntas (mais rápido)?**
   Testamos e conferimos na documentação: o plano grátis aceita só uma requisição simultânea. Pedindo várias juntas, algumas voltavam com erro 429 mesmo havendo cota. A fila resolve isso para todos os tipos de busca do site.

4. **O token da brapi está seguro?**
   Ele não fica no repositório (está no `.env.local`, ignorado pelo git, e num *secret* do GitHub no deploy). Mas, como o site é estático, o valor vai dentro do JavaScript publicado e quem inspecionar o código consegue ver. Sem um servidor próprio não há como esconder; é uma limitação documentada no README.

5. **Por que `buscarCotacao` devolve um objeto novo em vez da resposta da brapi?**
   A resposta da API é grande e em inglês (`regularMarketPrice`, `logourl`...). Transformando num objeto pequeno em português (`preco`, `logo`...), o resto do site não depende do formato da brapi: se a API mudar, só este arquivo precisa ser ajustado.

## Testes relacionados
O `brapi.js` não tem teste automatizado próprio (ele depende da internet). Foi testado no navegador: cache (reabrir não gera requisição), erro com a API bloqueada e fila sem 429.
