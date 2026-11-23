# Guia de estudo — Gabriel

**Arquivo:** `src/components/FormularioAtivo.jsx` (+ `FormularioAtivo.css`).

## O que o código faz

É o formulário de cadastro, na página **Meus ativos**. A pessoa informa o **código do ativo**, a **quantidade** e o **preço médio**. Ao enviar, o formulário:
1. **valida** os três campos (formato do código da B3, quantidade inteira maior que zero, preço maior que zero, ativo ainda não cadastrado);
2. se houver erro, mostra a mensagem embaixo do campo e **leva o foco** para o primeiro campo errado;
3. se estiver tudo certo, **confere na brapi** se o código existe;
4. cria o ativo (`criarAtivo`), avisa o componente pai (`aoAdicionar`), limpa os campos e volta o foco para o código, pronto para o próximo cadastro.

O campo do código usa o componente `CampoTicker` (sugestões de ações enquanto se digita), que está na lista de arquivos sem dono.

## Conceitos usados

- **Estado (`useState`)**: `valores` guarda o que foi digitado, `erros` guarda as mensagens de erro e `enviando` indica que a conferência na brapi está em andamento (o botão mostra "Verificando ticker…").
- **Componente controlado**: o `value` de cada campo vem do estado e o `onChange` atualiza o estado. O React é a "fonte da verdade" do que está escrito.
- **Props**: o formulário recebe `tickersExistentes` (para não repetir ativo) e `aoAdicionar` (função do pai chamada quando o cadastro dá certo). Ele não altera a carteira sozinho: avisa quem é dono dela.
- **Eventos e `preventDefault()`**: sem ele, o envio do formulário recarregaria a página.
- **Expressão regular**: `/^[A-Z]{4}\d{1,2}F?$/` confere o formato da B3 (4 letras, 1 ou 2 números e um "F" opcional do mercado fracionário). Ex: PETR4, TAEE11, PETR4F.
- **`async`/`await`**: a conferência na brapi demora, então a função de envio é assíncrona.
- **`useRef`**: guarda uma referência ao elemento `<input>` para chamar `.focus()` nele.
- **Acessibilidade**: `<label htmlFor>` em cada campo, `aria-invalid` (campo com erro) e `aria-describedby` (liga o campo à mensagem de erro, que o leitor de tela lê junto). `noValidate` desliga os balões do navegador para usarmos mensagens próprias, em português.

## Trecho importante, linha a linha

A função chamada ao enviar o formulário:

```js
async function aoEnviar(evento) {
  evento.preventDefault()

  const errosEncontrados = validar(valores, tickersExistentes)
  const camposComErro = Object.keys(errosEncontrados)
  setErros(errosEncontrados)

  if (camposComErro.length > 0) {
    focarCampo(camposComErro[0])
    return
  }

  setEnviando(true)
  const ticker = valores.ticker.trim().toUpperCase()
  try {
    const cotacao = await buscarCotacao(ticker)
    const ativo = criarAtivo(ticker, lerNumero(valores.quantidade), lerNumero(valores.precoMedio))
    aoAdicionar(ativo, cotacao)
    setValores(VALORES_INICIAIS)
    focarCampo('ticker')
  } catch (erro) {
    setErros({ ticker: erro.message })
    focarCampo('ticker')
  } finally {
    setEnviando(false)
  }
}
```

- `evento.preventDefault()` — impede o navegador de recarregar a página (comportamento padrão de um `<form>`).
- `validar(...)` — função do próprio arquivo que devolve só os erros encontrados, ex: `{ quantidade: 'Informe uma quantidade inteira maior que zero.' }`.
- `Object.keys(...)` — pega os nomes dos campos com erro, na ordem do formulário.
- `setErros(...)` — guarda os erros no estado; o React redesenha e as mensagens aparecem embaixo dos campos.
- `if (camposComErro.length > 0)` — havendo erro, leva o foco ao primeiro campo errado e para (`return`). O leitor de tela lê o campo e a mensagem ligada a ele.
- `setEnviando(true)` — desabilita o botão e mostra "Verificando ticker…", para a pessoa não clicar duas vezes.
- `await buscarCotacao(ticker)` — confere na brapi se o ativo existe (e já aproveita a cotação). Se não existir, a função lança um erro.
- `criarAtivo(...)` — monta o ativo no formato padrão; `lerNumero` aceita vírgula ("32,50").
- `aoAdicionar(ativo, cotacao)` — avisa o pai (o hook `useCarteira`), que adiciona o ativo à carteira e mostra o aviso "PETR4 adicionado à carteira".
- `setValores(VALORES_INICIAIS)` e `focarCampo('ticker')` — limpa o formulário e deixa pronto para o próximo.
- `catch (erro)` — o erro da brapi (ex: "Ticker XPTO3 não encontrado.") aparece embaixo do campo do código.
- `finally` — roda sempre, com ou sem erro: reativa o botão.

## Perguntas que o professor pode fazer

1. **Por que validar no código se o `<input>` tem validação do navegador?**
   A validação do navegador mostra balões diferentes em cada navegador, nem sempre em português, e não sabe regras como "esse ativo já está na carteira" ou o formato da B3. Por isso usamos `noValidate` e mensagens próprias.

2. **O que é um componente controlado?**
   É quando o valor do campo vem do estado do React (`value={valores.quantidade}`) e cada tecla atualiza esse estado (`onChange`). Assim conseguimos validar, limpar e preencher os campos pelo código.

3. **Por que conferir o código na brapi antes de salvar?**
   Um código pode ter o formato certo (4 letras + número) e mesmo assim não existir, como "XPTO3". Conferindo antes, a carteira só recebe ativos reais, e a cotação que já veio é reaproveitada (não gasta outra requisição).

4. **Como o formulário ajuda quem usa leitor de tela?**
   Cada campo tem `<label>`; um campo com erro recebe `aria-invalid="true"` e `aria-describedby` apontando para a mensagem; e o foco vai para o primeiro campo errado, então o leitor de tela lê "Quantidade, inválido, Informe uma quantidade inteira maior que zero".

5. **Por que usar `useRef` para o foco, e não o estado?**
   O foco é uma ação no elemento da página, não um dado que aparece na tela. A ref dá acesso direto ao `<input>` para chamar `.focus()`, sem precisar redesenhar o componente.

## Novidade: limites de quantidade e preço médio
Sem limite, alguém podia digitar `99999999999999999999`: o JavaScript só guarda inteiros com exatidão até ~9 quadrilhões, então o número virava `1e20`, e valores em R$ enormes estouravam os cartões. Agora a **quantidade** vai de 1 a 10.000.000 e o **preço médio** de R$ 0,01 a R$ 1.000.000,00. As regras ficam em `utils/ativo.js` (`erroDeQuantidade` e `erroDePrecoMedio`, que devolvem o texto do erro ou `''`) e são usadas no `FormularioAtivo.jsx`, na edição da `LinhaAtivo.jsx` e na importação de CSV: uma regra só, mensagens iguais ("A quantidade máxima é 10.000.000.").
- **Pergunta possível:** "Por que não usar `max` no `<input>`?" → o formulário usa `noValidate` e mensagens próprias (acessíveis e em português), e a mesma regra precisa valer fora do formulário (edição e CSV), então ela fica numa função reaproveitável. Testes: `ativo.test.js`.

## Testes relacionados
As regras de leitura de número (`lerNumero`, que aceita "1.234,56") são testadas em `src/utils/formatacao.test.js`.
