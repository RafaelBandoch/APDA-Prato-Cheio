# ADR 0002: Usar PostgreSQL como banco de dados

- **Data:** 2026-10-08
- **Status:** aceito

## Contexto

Registro original: *"Decidimos utilizar PostgreSQL porque é um banco melhor."* Não diz melhor em quê nem comparado com o quê.

O projeto precisa de um banco servidor no lugar do SQLite (ADR 0001), e a escolha afeta código que já existe:

- `src/repositorio.js` aceita a doação com `UPDATE ... WHERE id = ? AND status = 'disponivel' RETURNING *`. Uma única instrução trava a linha e devolve o resultado, garantindo a Regra 2 (só uma ONG aceita).
- A listagem mostra só doações `disponivel`, enquanto o histórico de aceitas cresce.
- A Regra 1 (expirar 2h antes da validade) e a janela de coleta (HU03) dependem de datas precisas.
- A disciplina exige banco relacional.

## Alternativas consideradas

1. **MySQL 8**. Prós: muito difundido; garante exclusividade com `SELECT ... FOR UPDATE`. Contras: não tem `RETURNING`, então o aceite viraria duas instruções em transação; não tem índice parcial.
2. **MongoDB**. Prós: `findOneAndUpdate` também é atômico. Contras: não é relacional; doação, ONG e credenciamento são entidades relacionadas; todo o acesso a dados seria reescrito.
3. **PostgreSQL**. Prós: `RETURNING` em `INSERT` e `UPDATE`, então as consultas atuais mudam só no marcador (`?` para `$1`); trava por linha; índice parcial; `timestamptz`; PostGIS para distância (HU05). Contras: exige servidor e, com muitos acessos, pool de conexões.

## Decisão

Usar **PostgreSQL**, porque mantém o aceite atômico em uma única instrução, que já está implementado e testado. Com MySQL ele seria reescrito em duas etapas; com MongoDB, todo o acesso a dados mudaria e o requisito relacional não seria cumprido.

## Consequências

- Positivas: `src/repositorio.js` quase não muda; índice parcial na listagem de disponíveis; datas com fuso horário para as Regras 1 e HU03; PostGIS disponível para a HU05.
- Negativas / o que abrimos mão: precisa de servidor (ADR 0001); o driver `pg` devolve datas como `Date`, mudando o formato de `validade` no JSON; pool de conexões passa a ser necessário com mais acessos.
- Riscos e o que fazer se der errado: testar o formato de `validade` na resposta da API antes da troca; usar `pg.Pool` desde a refatoração.

## Rastreabilidade

- Regra de negócio 2, critério de aceite da HU03 e decisão #2 de `docs/projeto.md` (aceite atômico).
- Regra de negócio 1 e janela de coleta da HU03.
- HU05 de `docs/analise.md` (distância até as ONGs).

