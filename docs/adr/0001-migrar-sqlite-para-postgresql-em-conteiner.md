# ADR 0001: Migrar de SQLite para PostgreSQL em contêiner Docker

- **Data:** 2026-10-08
- **Status:** substituído pelo [ADR 0003](0003-postgresql-gerenciado-para-escala-multicidade.md). O PostgreSQL continua valendo; o que mudou foi a hospedagem. Mantido como histórico.

## Contexto

O projeto usa SQLite embutido no Node (`node:sqlite`). Para o piloto de um bairro (3 doadores e 5 ONGs), isso traz limites:

- O SQLite trava o arquivo inteiro a cada escrita e não permite separar o banco da aplicação.
- Falha com `disk I/O error` em pastas sincronizadas e o módulo ainda é experimental.
- Hospedagens gratuitas costumam ter disco efêmero, o que apagaria as doações a cada reinício.
- A Unidade 3 exige PostgreSQL acessível por `DATABASE_URL`, com CI verde.

Restrições: 5 integrantes com sistemas diferentes, sem orçamento, e testes rodando com `npm test` local e no GitHub Actions.

## Alternativas consideradas

1. **Manter SQLite**. Prós: nada a instalar nem a mudar. Contras: não cumpre a Unidade 3 e mantém os problemas de ambiente.
2. **PostgreSQL instalado em cada máquina**. Prós: sem camada extra. Contras: versões diferentes entre integrantes e o CI precisaria de outra solução.
3. **PostgreSQL em contêiner Docker** (`postgres:16`). Prós: mesma versão no desenvolvimento, no CI e no servidor do piloto; sem depender de internet ou conta externa. Contras: exige Docker; backup do piloto fica com o grupo.
4. **PostgreSQL gerenciado gratuito (Neon, Supabase, Render)**. Prós: nada a instalar; backup com o provedor. Contras: testes dependeriam de internet e credenciais; limites do plano gratuito; exagero para o piloto.



## Decisão

Usar **PostgreSQL 16 em contêiner Docker** no desenvolvimento, no CI e no servidor único do piloto. Fixa a versão em um só lugar, evita diferenças entre máquinas e não deixa os testes dependentes de serviço externo. A troca fica contida em `src/db.js`, que já expõe `query()` devolvendo `{ rows }`.

## Consequências

- Positivas: mesmo banco em todos os ambientes; fim do `disk I/O error`; requisito da Unidade 3 atendido; o aceite atômico (`UPDATE ... WHERE status = 'disponivel' RETURNING *`) continua garantindo a Regra 2.
- Negativas / o que abrimos mão: Docker vira pré-requisito; testes mais lentos que SQLite em memória; refatorar `src/db.js` (`?` para `$1`, `AUTOINCREMENT` para `IDENTITY`, `datetime('now')` para `now()`, driver `pg`); servidor único é ponto único de falha.
- Riscos e o que fazer se der errado: integrante sem Docker usa um banco gerenciado gratuito só para desenvolvimento; `pg_dump` diário no piloto; os testes de `tests/doacoes.test.js` devem passar antes e depois da migração.

## Rastreabilidade

- Regra de negócio 2 e critério de aceite da HU03 (exclusividade de aceite).
- Requisito "Migração SQLite para PostgreSQL" de `docs/projeto.md`.
- Escala do piloto definida em `docs/analise.md`.

