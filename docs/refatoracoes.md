# Refatorações — Prato Cheio

Quatro refatorações aplicadas em `src/doacoes.js` e `src/app.js`. Os testes de integração existentes cobrem os fluxos da aplicação com PostgreSQL; como dependem de `DATABASE_URL`, foram acrescentados testes unitários isolados com repositório e domínio simulados para proteger as regras alteradas sem exigir um banco local.

As oportunidades foram identificadas e as mudanças elaboradas com apoio de IA; a implementação foi conferida contra as regras existentes e protegida pelos testes descritos abaixo.

## 1. Validação da validade — Extrair função

- **Cheiro atacado:** `criarDoacao` misturava validação dos campos, interpretação do formato da data, validação do calendário e cálculo do dia atual no fuso de São Paulo.
- **O que mudou:** a validação da validade foi isolada em `validarValidade`; o cálculo do dia local ficou em `hojeEmSaoPaulo`. A regra continua aceitando somente datas reais no formato `AAAA-MM-DD` que sejam hoje ou futuras em São Paulo.
- **Testes:** `tests/doacoes-refatoracoes.test.js` cobre data de calendário inválida e o caso em que UTC já mudou de dia, mas ainda é o mesmo dia em São Paulo.

## 2. Validação da janela na publicação — Extrair função

- **Cheiro atacado:** `criarDoacao` também concentrava validações independentes da janela de coleta, tornando a função extensa e misturando regras diferentes.
- **O que mudou:** a validação de limites informados e da ordem início/fim foi isolada em `validarJanelaColeta`. A persistência só ocorre depois que todas as validações passam.
- **Testes:** `tests/doacoes-refatoracoes.test.js` cobre limite inválido e janela invertida, verificando que nenhum dos casos chama o repositório.

## 3. Validação da janela no aceite — Extrair função

- **Cheiro atacado:** a operação `aceitar` acumulava a regra temporal junto com as verificações de estado e a atualização do repositório.
- **O que mudou:** a regra foi isolada em `validarJanelaAceite`. Cada limite continua opcional e inclusivo, sem alterar a regra de negócio.
- **Testes:** `tests/doacoes-refatoracoes.test.js` verifica início e fim opcionais no limite inclusivo e recusa um aceite antes do início sem atualizar a doação.

## 4. Tratamento de erros das rotas — Eliminar duplicação

- **Cheiro atacado:** as rotas repetiam blocos `try/catch` e a construção da resposta JSON de erro.
- **O que mudou:** `tratarErros` centraliza o tratamento assíncrono e mantém o status 400 padrão. A rota de retirada fornece a política específica que preserva erros 404; as respostas normais e o 404 de doação inexistente permanecem inalterados.
- **Testes:** `tests/app-refatoracoes.test.js` verifica resposta normal, resposta 400 com mensagem de negócio e preservação do 404.

## Evidência dos testes

- `node_modules\.bin\vitest run --reporter=verbose tests\doacoes-refatoracoes.test.js tests\app-refatoracoes.test.js` — **9 testes passaram** em 2 arquivos.
- `npm test` — **não foi possível executar a suíte completa neste ambiente**: falhou durante a coleta dos testes existentes porque `DATABASE_URL` não está definida. A suíte de integração requer o PostgreSQL exclusivo de testes descrito no [README](../README.md#banco-exclusivo-de-testes); os testes focados acima não precisam de banco.
