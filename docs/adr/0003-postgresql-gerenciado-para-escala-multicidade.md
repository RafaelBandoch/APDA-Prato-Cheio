# ADR 0003: PostgreSQL gerenciado para atender várias cidades

- **Data:** 2026-10-08
- **Status:** aceito. Substitui o [ADR 0001](0001-migrar-sqlite-para-postgresql-em-conteiner.md), mantido como histórico. O [ADR 0002](0002-postgresql-como-sgbd.md) continua valendo.

## Contexto

O ADR 0001 previa PostgreSQL em contêiner num servidor único, para um bairro. Agora o Prato Cheio atenderá ONGs e doadores de várias cidades, com acessos simultâneos e mais doações.

**PostgreSQL continua adequado.** A trava por linha evita que aceites de doações diferentes se bloqueiem, e o `UPDATE` atômico segue garantindo a Regra 2. O SQLite seria um gargalo.

**O servidor único deixa de ser adequado:**

- Uma queda para todas as cidades ao mesmo tempo, e o alimento perecível perde o prazo (Regra 1).
- `pg_dump` diário pode perder um dia de doações e do histórico usado nas métricas e no Risco 1.
- Mais acessos exigem várias instâncias da aplicação e pool de conexões.
- O grupo não tem como manter plantão de operação.

**Novos requisitos:** filtrar a listagem por cidade e tratar fusos horários diferentes no Brasil.

## Alternativas consideradas

1. **Manter o ADR 0001 com servidor maior**. Prós: sem mudanças, custo baixo. Contras: continua ponto único de falha com backup manual.
2. **PostgreSQL autogerenciado com réplica e failover**. Prós: controle total, sem fornecedor. Contras: operação complexa demais para o grupo; custo de várias máquinas.
3. **Um banco por cidade**. Prós: falha isolada por cidade. Contras: relatórios consolidados difíceis; migrações repetidas em cada banco.
4. **PostgreSQL gerenciado no Brasil (Supabase, São Paulo, plano pago)**. Prós: backup com restauração para um ponto no tempo, failover e pool de conexões com o provedor; baixa latência no país; acesso só por `DATABASE_URL`. Contras: custo mensal; dependência de fornecedor; menos controle da versão.

## Decisão

**Manter o PostgreSQL e substituir a hospedagem do ADR 0001 por PostgreSQL gerenciado.**

- Produção usa o banco gerenciado via pool de conexões do provedor.
- Desenvolvimento e CI continuam com Docker, na mesma versão major do provedor.
- A tabela `doacoes` ganha a coluna `cidade` e índice parcial para disponíveis; datas passam a `timestamptz`.
- Migrações versionadas substituem o `CREATE TABLE IF NOT EXISTS` de `src/db.js`.

As outras opções não resolvem disponibilidade e backup (1), exigem operação que o grupo não sustenta (2) ou multiplicam o trabalho sem necessidade (3). Réplicas de leitura e particionamento ficam para quando as métricas indicarem.

## Consequências

- Positivas: queda do servidor não para todas as cidades; perda de dados cai de um dia para minutos; várias instâncias sem esgotar conexões; Regra 2 mantida sem mudar regra de negócio.
- Negativas / o que abrimos mão: custo mensal; dependência de fornecedor; menos controle da versão; refatoração para `cidade`, `timestamptz` e migrações.
- Riscos e o que fazer se der errado: usar só PostgreSQL padrão para poder trocar de provedor com `pg_dump`/`pg_restore`; acompanhar o custo mensal; criar teste com dois aceites simultâneos (`Promise.all`); se a listagem ficar lenta, avaliar réplica ou particionamento em novo ADR.

## Rastreabilidade

- Regra de negócio 2 e HU03 (aceite sob concorrência).
- Regra de negócio 1 (expiração e fusos horários).
- Risco 1 e objetivos de impacto 1, 2 e 3 de `docs/analise.md` (histórico preservado e sistema disponível).
