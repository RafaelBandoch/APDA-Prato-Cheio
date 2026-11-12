# Relatório de Code Review — Revisão por Pares

- **Grupo Avaliador:** No Bug (Rafael Bandoch, João Pedro Alves de Lima, João Vitor Paranhos, Gabriel Lengert Guedes, Anttonio Osório Molinaro Maccagnini)
- **Grupo Avaliado:** 202ErrorClub
- **Repositório/Projeto Revisado:** [daniela-luisa/Projeto-Prato-Cheio](https://github.com/daniela-luisa/Projeto-Prato-Cheio)
- **Escopo:** rotas, regras de negócio, repositório e testes automatizados disponíveis no repositório.

---

## 1. Checklist de Avaliação

| Critério | Status | Comentários e Observações |
| :--- | :---: | :--- |
| **Legibilidade e Nomes** | Atendido | Os nomes em português, como `listarDisponiveis`, `criarDoacao` e `buscarPorId`, comunicam bem suas responsabilidades. Há pequenas inconsistências de formatação, mas elas não impedem a leitura. |
| **Separação de Responsabilidades** | Atendido | As rotas ficam em `src/app.js`, as regras de negócio em `src/doacoes.js` e o acesso a dados em `src/repositorio.js`; a conexão e o schema ficam em `src/db.js`. |
| **Tratamento de Erros** | Parcial | As rotas retornam mensagens de erro em JSON, mas os blocos de tratamento repetem-se e classificam qualquer exceção como HTTP 400. Falhas internas do banco e recursos inexistentes também deveriam ser diferenciados de erros de entrada. |
| **Cobertura de Testes** | Atendido | A suíte cobre publicação, listagem, aceite, cancelamento e concorrência. Validação executada: `npm test` — 4 arquivos e 24 testes aprovados. |
| **Boas Práticas (Code Smells)** | Parcial | Não foram observados métodos excessivamente longos nem duplicação relevante nas regras. A repetição dos blocos `try/catch` nas rotas e pequenas inconsistências de estilo são oportunidades de melhoria. |

---

## 2. Pontos Fortes Identificados

- A divisão entre rotas, regras de negócio e persistência torna o fluxo da aplicação fácil de acompanhar.
- As consultas usam parâmetros SQL, evitando concatenar diretamente valores recebidos nas instruções.
- A atualização condicional de status em `aceitar` e `cancelar` protege as transições contra aceite ou cancelamento duplicado.
- Os testes cobrem cenários importantes, inclusive a disputa concorrente entre aceite e cancelamento.
- A suíte foi executada com sucesso: **24 testes aprovados**.

---

## 3. Sugestões de Melhoria e Justificativas (Propostas)

### Sugestão 1: Diferenciar erros de entrada, recurso inexistente e falhas internas

- **Onde:** `src/app.js`, nos blocos `try/catch` das rotas da API.
- **O que foi observado:** todas as exceções capturadas são respondidas com status 400. Assim, um erro inesperado no banco também seria apresentado como erro enviado pelo cliente; além disso, uma doação inexistente não é distinguida de uma entrada inválida.
- **Por que foi proposto:** mapear erros de validação para 400, recursos inexistentes para 404 e falhas inesperadas para 500 informa corretamente o cliente e facilita diagnosticar problemas operacionais. Um middleware de erro compartilhado também evita repetir o mesmo tratamento em cada rota.

### Sugestão 2: Rejeitar campos obrigatórios preenchidos apenas com espaços

- **Onde:** `src/doacoes.js`, na validação inicial de `criarDoacao`.
- **O que foi observado:** a verificação de obrigatoriedade usa a veracidade dos valores; strings como `"   "` são consideradas preenchidas e podem ser persistidas como tipo ou quantidade.
- **Por que foi proposto:** remover espaços nas extremidades e rejeitar valores que fiquem vazios após essa normalização impede registros sem informação útil e torna o critério de campos obrigatórios mais confiável. A validação da quantidade deve continuar aceitando os formatos com unidade usados pelo projeto, como `"10 porções"`.

---

## 4. Conclusão da Revisão

O projeto apresenta uma estrutura clara, responsabilidades bem distribuídas e testes automatizados que cobrem fluxos relevantes do produto. Os testes executados passaram integralmente. As melhorias propostas são pontuais: tornar as respostas de erro mais precisas e impedir que campos obrigatórios compostos apenas por espaços sejam aceitos. Parabéns ao grupo 202ErrorClub pelo trabalho e pela cobertura de cenários importantes, especialmente os casos de concorrência.
