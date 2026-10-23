# Análise geral dos diagramas

Revisão conjunta do [diagrama de estados](estados-doacao.md) e do [diagrama de sequência](sequencia-aceite.md),
nas versões finais, confrontadas com o código da `main` (`src/doacoes.js`, `src/repositorio.js`, `src/app.js`),
com `docs/analise.md` e com os testes em `tests/doacoes.test.js`. As críticas individuais
([estados](critica-estados.md) e [sequência](critica-sequencia.md)) olharam cada diagrama contra a versão da IA;
aqui a pergunta é outra: **as versões finais, juntas, descrevem bem o sistema e as regras que ele deveria cumprir?**

## 1. A escolha dos tipos foi adequada

Os dois diagramas se complementam sem se repetir. O de estados responde *o que pode acontecer com uma doação*;
o de sequência responde *em que ordem o sistema decide um aceite*. As duas regras mais arriscadas do Prato Cheio,
exclusividade do aceite (Regra 2) e expiração (Regra 1), aparecem nos dois, cada uma vista de um ângulo.
Um diagrama de componentes ou de classes acrescentaria pouco: a arquitetura é uma pilha linear
`app → doacoes → repositorio → db`, que o próprio diagrama de sequência já mostra.

## 2. O que as versões finais acertam

- **Fidelidade ao código.** Os estados (`disponivel`, `aceita`, `expirada`), as mensagens de erro, a ordem das
  validações em `aceitar()` e as consultas SQL batem com a `main`.
- **Separação entre implementado e previsto.** O diagrama de estados marca `aceita → disponivel` e a retirada
  confirmada como *previstas, não implementadas*, em vez de descrever um sistema que não existe.
- **O UPDATE atômico está explícito.** O ramo "Outra ONG aceitou primeiro", depois do `UPDATE ... WHERE status='disponivel'`,
  é exatamente a defesa contra corrida da Decisão #2, e é o detalhe mais fácil de se perder num diagrama.
- **Os diagramas mudaram o código.** A revisão da sequência expôs o aceite de doação vencida, corrigido no PR #13
  e coberto pelo teste "recusa aceitar depois das 22h de São Paulo sem consulta prévia".

## 3. Problemas que continuam nas versões finais

### 3.1 Aceitar não é retirar (HU03)

O critério da HU03 diz que o aceite só é confirmado se **o horário de retirada** estiver dentro da janela e dentro
da validade. Os dois diagramas, assim como o código, comparam a janela com **o horário do aceite** (`Date.now()`).
São coisas diferentes: uma ONG pode aceitar às 10h, dentro de uma janela 10h–12h, sem nunca informar quando vai
retirar. Os diagramas herdaram essa simplificação do código sem registrá-la. Ou o critério da HU03 é reescrito
para "aceite dentro da janela", ou falta um dado (horário previsto de retirada) no modelo.

### 3.2 Doação "disponível" que ninguém consegue aceitar

O diagrama de estados sugere que toda doação `disponivel` pode ir para `aceita`. Há casos em que isso não vale e
o diagrama não mostra:

- `criarDoacao()` não impede uma janela que **já terminou** no momento da publicação (o teste "aceite fora da
  janela de coleta retorna 400" publica exatamente uma doação assim). A doação entra como `disponivel`, aparece
  na listagem e todo aceite é recusado até ela expirar às 22h.
- Nada impede uma janela que termina **depois** das 22h do dia da validade; o trecho final da janela nunca é usado.
- Uma doação com validade de hoje publicada **depois das 22h** é aceita na criação e expira na próxima consulta.

Na prática, existe um estado implícito "disponível, mas fora da janela" que o diagrama esconde. A correção mais
simples é no código (validar a janela contra o horário atual e a validade na publicação); no diagrama, basta uma
nota em `disponivel`.

### 3.3 Implementado e previsto se distinguem só pelo texto

No diagrama de estados, o que existe e o que é plano se diferenciam apenas pelo sufixo "prevista, não implementada"
no rótulo. Num diagrama renderizado, as setas são idênticas. Uma `classDef` com borda tracejada, ou um segundo
diagrama só com o comportamento-alvo, deixaria a diferença visível sem precisar ler cada rótulo.

### 3.4 A notificação ao doador não aparece em nenhum diagrama

A Regra 1 e a HU01 exigem que o doador seja **notificado** quando a doação expira. Nenhum dos dois diagramas
representa isso. No código, o aviso existe só no navegador (`avisarExpiradas()` em `public/index.html`, com
`localStorage`): o doador só fica sabendo se reabrir a página no mesmo navegador em que publicou. É uma limitação
que merecia nota no estado `expirada`, como já foi feito para a limitação de `aceita`.

### 3.5 O diagrama de sequência registra respostas HTTP sem questioná-las

Todos os erros do aceite saem como **400**, inclusive "doação não encontrada" (que em `GET /api/doacoes/:id` é
**404**) e "já foi aceita por outra ONG" (um conflito, tipicamente **409**). O diagrama documenta isso fielmente,
mas a revisão não perguntou se estava certo. A inconsistência fica visível justamente porque o diagrama põe todas
as respostas lado a lado.

### 3.6 SQL nas setas: bom para conferir, ruim para durar

Escrever as consultas completas nas mensagens tornou fácil conferir o diagrama com o código, e foi assim que
apareceu o problema `?` × `$1`. O preço é que qualquer mudança de SQL desatualiza o diagrama, e isso já aconteceu
uma vez. Para a próxima iteração, vale descrever a intenção (`marca aceita se ainda disponível`) e deixar o SQL
para o código.

## 4. Problemas na documentação dos diagramas

- **Críticas duplicadas e divergentes.** `critica-estados.md` repete os quatro problemas da seção "Problemas
  identificados" de `estados-doacao.md` com outras palavras, e as duas versões já divergem: no Problema 3,
  `estados-doacao.md` só diz que as transições foram "mantidas", enquanto `critica-estados.md` diz que o estado
  `Coletada` foi "removido" e explica como a retirada passou a ser representada. O mesmo vale para a sequência. Melhor manter um só texto e fazer o outro apontar para ele.
- **`critica-sequencia.md` está desatualizado.** Ainda marca como pendente a atualização do `sequencia-aceite.svg`,
  que foi substituído pelo Markdown no PR #17, já com `expirarVencidas()` e o erro `doação expirada`.
- **Rastreabilidade da IA incompleta na sequência.** O diagrama de estados registra ferramenta, prompt e resposta
  original. O de sequência não registra nem a ferramenta nem o prompt; PlantUML é só o renderizador. A versão
  "inicial" é uma transcrição do SVG, não a saída original da IA.

## 5. Avaliação geral

Os diagramas cumprem bem o papel de **descrever** o sistema: estão corretos em relação ao código e separam com
honestidade o que existe do que é planejado. Funcionaram menos como ferramenta para **questionar** o design. As
correções foram, quase todas, no sentido de fazer o diagrama concordar com o código, e não de perguntar se o código
concordava com a `analise.md`. As exceções são justamente as mais valiosas: a ambiguidade das "2 horas antes da
validade", o aceite de doação vencida (PR #13) e a doação que fica `aceita` para sempre (Risco 1). Os pontos 3.1,
3.2 e 3.4 seguem essa mesma linha e são os que mais valem levar para a próxima iteração.

### Recomendações, por prioridade

1. Decidir o critério da HU03: aceite dentro da janela ou retirada dentro da janela (3.1).
2. Validar a janela na publicação contra o horário atual e as 22h da validade, e anotar no diagrama de estados (3.2).
3. Implementar a retirada confirmada, que destrava as duas transições previstas e resolve o Risco 1.
4. Unificar as críticas e atualizar `critica-sequencia.md` (seção 4).

## Uso de IA

Análise redigida com apoio do Claude (Anthropic), a partir da leitura das versões finais dos diagramas, do código
e dos testes da `main`. As afirmações sobre o comportamento do código foram conferidas nos arquivos citados.
