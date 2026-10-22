# Documento de Projeto — Prato Cheio

*Trabalho 2 · máximo 4 páginas (fora diagramas) · entrega na Aula 10*

*Entrega prevista: 28/10/2026*

## Decisões de projeto

As alternativas abaixo preservam a discussão inicial. Na versão entregue, janela de coleta e aceite atômico estão implementados; a decisão #3 (liberação após não retirada) continua planejada. A janela limita o instante do aceite; o sistema ainda não registra um horário de retirada nem confirma a coleta. A validade é uma data, interpretada como limite de disponibilidade às 22h de São Paulo.

| # | Decisão | Alternativas | Requisito/risco da Análise que a motiva |
|---|---|---|---|
| 1 | Como resolver o conflito entre urgência do doador e disponibilidade da ONG na retirada | **A)** Doador define uma *Janela de Coleta*; o aceite só é válido se a ONG se comprometer a retirar dentro dessa janela e da validade à temperatura ambiente. **B)** Matching automático: o sistema cruza agendas das ONGs com o horário do doador e só oferece a doação a quem “encaixa”. | Conflito de prioridade Doador×ONG (Análise); critério de aceite HU03 (janela de coleta); segurança sanitária como critério inegociável. |
| 2 | Como garantir exclusividade quando duas ONGs tentam aceitar a mesma doação ao mesmo tempo | **A)** Aceite atômico no banco (`UPDATE … WHERE status = 'disponivel'`): só uma transação vence; a outra recebe erro. **B)** Reserva temporária (soft lock): a primeira ONG “segura” a doação por N minutos; se não confirmar, libera para outras. | Regra de negócio 2 — Exclusividade de Aceite; critério HU03 (trava o status e remove da listagem). |
| 3 | O que fazer se a ONG aceita mas não retira na janela combinada | **A)** Liberação automática: após um prazo máximo sem confirmação de retirada, a doação volta à listagem e a falha entra no histórico da ONG. **B)** Cancelamento só pelo doador: a doação fica “presa” até o doador liberar manualmente; a plataforma apenas registra reclamação. | Risco 1 da Análise (alimento vence “reservado”); mitigação já proposta na unidade de Análise. |

## Tabela de trade-offs (uma decisão em detalhe)

**Decisão escolhida:** #1 — Janela de Coleta vs. matching automático de agendas.

| Critério | Alternativa A — Janela de Coleta definida pelo doador | Alternativa B — Matching automático por agenda |
|---|---|---|
| Segurança sanitária | O aceite é validado pela janela e pela expiração; a retirada efetiva ainda não é acompanhada. | Média/alta: depende da qualidade dos dados de agenda; erro de cadastro pode gerar retirada fora do prazo. |
| Simplicidade de implementação (U2/U3) | Alta: campos de início/fim na doação + validação no aceite. | Baixa: exige cadastro de disponibilidade por ONG, algoritmo de matching e manutenção contínua. |
| Autonomia do doador | Alta: ele controla quando precisa liberar o espaço. | Baixa: o sistema decide quem vê a oferta. |
| Cobertura de ONGs | Média: ONGs fora da janela não podem aceitar (pode sobrar comida se poucas encaixarem). | Potencialmente maior: só quem encaixa vê — mas ONGs flexíveis podem ficar de fora se a agenda estiver desatualizada. |
| Risco operacional | Baixo no curto prazo; risco residual se a ONG aceitar e não retirar (tratado na decisão #3). | Alto: agenda desatualizada gera matches inválidos e frustração nas duas pontas. |
| Alinhamento ao walking skeleton atual | Alto: estende o fluxo publicar → listar → aceitar sem novo módulo de agenda. | Baixo: muda o modelo de oferta antes do núcleo estabilizar. |

**Escolha:** Alternativa A (Janela de Coleta). Atende o conflito da Análise com menos complexidade e valida os limites de tempo no momento do aceite. Isso não substitui credenciamento sanitário nem comprova retirada.

## Justificativa das decisões

| Decisão | Escolha | Justificativa (rastreio à Análise) |
|---|---|---|
| 1 — Conflito de retirada | **Janela de Coleta (A)** | A Análise já fixou que a segurança sanitária é inegociável e propôs a janela como resolução do conflito Doador×ONG. O critério HU03 exige que o aceite só confirme se a retirada estiver na janela e na validade à temperatura ambiente. |
| 2 — Exclusividade de aceite | **Aceite atômico (A)** | A Regra de negócio 2 e o critério HU03 exigem trava imediata e remoção da listagem. O `UPDATE` condicional no repositório implementa isso sem fila intermediária, alinhado ao walking skeleton. |
| 3 — Não-retirada após aceite | **Liberação automática (A), planejada** | É a mitigação registrada no Risco 1 da Análise: sem liberação, o alimento vence reservado e o objetivo de impacto (reduzir desperdício / alimentar beneficiários) falha. |

## Diagramas

Escolhemos dois tipos de diagramas UML para responder a perguntas diferentes:

- **Estados:** quais estados uma doação assume e quais eventos ou condições permitem mudar de estado? Esse modelo ajuda a discutir expiração, exclusividade do aceite e a diferença entre comportamentos implementados e previstos.
- **Sequência:** como a ONG, a API, o domínio, o repositório e o banco interagem durante um aceite? Esse modelo ajuda a verificar a ordem das validações, os caminhos de erro e a atualização atômica que impede o aceite duplo.

### Onde encontrar as evidências

- [Diagrama de estados](diagramas/estados-doacao.md): reúne a versão original gerada pela IA, o prompt, a ferramenta utilizada (ChatGPT, GPT-5), quatro problemas com justificativas e correções, a versão final em Mermaid e a resposta à reflexão final.
- [Crítica do diagrama de estados](diagramas/critica-estados.md): detalha os problemas identificados ao confrontar o modelo com as regras de negócio e o código.
- [Diagrama de sequência](diagramas/sequencia-aceite.svg): versão publicada no PR #11. O SVG contém a fonte PlantUML embutida, permitindo recuperar e editar o modelo.
- [Crítica do diagrama de sequência](diagramas/critica-sequencia.md): registra a ausência da expiração antes do aceite no desenho e a revisão ainda necessária. A identificação da ferramenta de IA e a publicação da versão revisada desse diagrama permanecem pendentes com seu autor.

O Mermaid mantém o diagrama de estados como texto versionável e renderizado no GitHub. O PlantUML descreve as mensagens e os caminhos alternativos da sequência; o SVG permite visualizar o resultado. Fonte e imagem da mesma sequência representam o mesmo modelo, não duas versões da evolução.

### Revisão e participação

O diagrama de sequência foi adicionado por João Pedro no [PR #11](https://github.com/RafaelBandoch/APDA-Prato-Cheio/pull/11). O diagrama de estados foi adicionado por Gabriel no [PR #12](https://github.com/RafaelBandoch/APDA-Prato-Cheio/pull/12) e atualizado no [PR #15](https://github.com/RafaelBandoch/APDA-Prato-Cheio/pull/15). As críticas foram integradas pelos [PRs #13](https://github.com/RafaelBandoch/APDA-Prato-Cheio/pull/13) e [#14](https://github.com/RafaelBandoch/APDA-Prato-Cheio/pull/14). Esses PRs possuem revisão de outro integrante; a distribuição das contribuições está na [retrospectiva da iteração 2](retrospectivas/2.md).

## ADRs

- [ADR 0001 — migração SQLite para PostgreSQL](adr/0001-migrar-sqlite-para-postgresql-em-conteiner.md): contexto, alternativas de ambiente, decisão e consequências da migração.
- [ADR 0002 — escolha do SGBD](adr/0002-postgresql-como-sgbd.md): alternativas e trade-offs da escolha de PostgreSQL para preservar o aceite atômico.
- [ADR 0003 — PostgreSQL gerenciado para várias cidades](adr/0003-postgresql-gerenciado-para-escala-multicidade.md): decisão aceita, com hospedagem adotada no Supabase; as mudanças adicionais de schema e a validação dos recursos operacionais têm pendências registradas na nota de alinhamento.

Os textos iniciais e os status dos ADRs foram mantidos. As notas de alinhamento de 22/10/2026 distinguem a decisão aceita da execução de cada consequência. A adoção do Supabase atende à escolha de hospedagem gerenciada; cidade, índice parcial, migrações versionadas e validações operacionais continuam sendo acompanhados separadamente.

## Histórias de usuário

O fluxo básico publicar → listar → aceitar já existia. Nesta iteração, dois incrementos antes incompletos são o acompanhamento individual (HU04.3) e a expiração de disponíveis (critério da HU01 / Regra 1). A HU03 também foi ampliada com a janela de coleta. O escopo abaixo detalha o incremento real, sem declarar concluídos os critérios de autenticação e credenciamento presentes na análise inicial.

Os identificadores, atores e objetivos abaixo seguem as histórias de [docs/analise.md](analise.md#histórias-de-usuário). Os critérios originais permanecem em [Critérios de aceite](analise.md#critérios-de-aceite); os itens técnicos desta seção detalham os incrementos implementados, sem substituir os requisitos originais.

### HU04.3 — Acompanhar doação

Como doador ou ONG, quero acompanhar o status da doação, para saber em que etapa do processo ela está.

Incremento desta iteração: consulta individual por ID. Critérios de aceite detalhados desse incremento:

- Uma consulta `GET /api/doacoes/:id` de doação existente retorna `200` com seus dados e status.
- Após um aceite, a consulta retorna `aceita` e a ONG associada.
- Ao atingir a expiração, a consulta retorna `expirada`, mesmo sem uma listagem anterior.
- IDs inexistentes, inválidos ou superiores ao limite `INTEGER` retornam `404` com `doação não encontrada`.
- `GET /api/doacoes/todas` continua sendo a listagem de acompanhamento e não é interpretado como um ID.

Evidências em [tests/doacoes.test.js](../tests/doacoes.test.js), bloco `acompanhar doação por id`: `devolve a doação pelo id`, `mostra o status aceita depois do aceite`, `mostra o status expirada a partir das 22h de São Paulo sem passar pela listagem`, casos parametrizados de ID e `mantém /api/doacoes/todas como listagem`. Implementação em `src/app.js`, `src/doacoes.js` e `src/repositorio.js`; integrada pelo [PR #12](https://github.com/RafaelBandoch/APDA-Prato-Cheio/pull/12).

### HU01 — Publicar doação

Como doador, quero publicar uma doação de alimentos, para disponibilizá-la para ONGs.

Incremento desta iteração: expiração de ofertas disponíveis, conforme o segundo critério da HU01 e a Regra 1. Critérios de aceite detalhados desse incremento:

- Doações `disponivel` expiram às 22h de `America/Sao_Paulo` no dia da validade, ou na próxima operação que aplique a regra.
- As listagens omitem as expiradas da oferta pública e mantêm seu status no acompanhamento. Doações aceitas e com validade futura são preservadas.
- `POST /api/doacoes/expirar` retorna `{ expiradas: [...] }`, com as linhas alteradas; sem mudanças, retorna uma lista vazia.
- Um aceite antes das 22h continua possível, respeitando a janela. A partir das 22h, retorna `400` com `doação expirada`, mesmo sem consulta anterior.

Evidências em [tests/doacoes.test.js](../tests/doacoes.test.js): `expira disponíveis às 22h de São Paulo e preserva aceitas e futuras`, `devolve a lista das expiradas e uma lista vazia na segunda chamada`, `aceita no dia da validade antes das 22h de São Paulo` e `recusa aceitar depois das 22h de São Paulo sem consulta prévia`. Implementação no repositório, no domínio e nas rotas; integrada pelos [PRs #10](https://github.com/RafaelBandoch/APDA-Prato-Cheio/pull/10), [#12](https://github.com/RafaelBandoch/APDA-Prato-Cheio/pull/12) e [#13](https://github.com/RafaelBandoch/APDA-Prato-Cheio/pull/13).

A regra é aplicada sob demanda, sem agendador. O aviso visual ao doador depende do navegador que publicou a doação e de atualizar as listas. Não há login, vínculo persistido com um doador nem notificação externa; esses limites impedem considerar concluída toda a HU01 original.

### HU03 — Aceitar doação

Como ONG, quero aceitar uma doação, para reservar os alimentos para minha organização.

Incremento desta iteração: respeitar a janela de coleta informada pelo doador no aceite, incluindo a validação dos limites na publicação. Critérios de aceite detalhados desse incremento:

- A publicação preserva os horários opcionais de início e fim; rejeita datas de janela não interpretáveis e fim menor ou igual ao início, com `400`.
- O aceite antes do início ou depois do fim é recusado com `400`, inclusive se houver somente um dos limites.
- Sem limites, o aceite mantém as demais regras; dentro da janela, uma doação disponível pode ser aceita.
- Uma segunda ONG não aceita uma doação já aceita; o `UPDATE` condicional mantém a exclusividade no banco.

Evidências em [tests/doacoes.test.js](../tests/doacoes.test.js): `persiste a janela de coleta informada pelo doador`, `aceita dentro da janela de coleta`, `aceite fora da janela de coleta retorna 400`, `aceite antes do início da janela retorna 400 mesmo sem fim definido`, `recusa publicar com o fim da janela antes do início`, `recusa publicar com data inválida na janela` e `recusa aceitar uma doação que já foi aceita por outra ONG`. O teste de dois aceites é sequencial; não há teste simultâneo. Incremento integrado pelos [PRs #11](https://github.com/RafaelBandoch/APDA-Prato-Cheio/pull/11) e [#14](https://github.com/RafaelBandoch/APDA-Prato-Cheio/pull/14).

## Requisitos não funcionais

1. **Integridade dos dados sob concorrência.** Uma oferta não pode ser atribuída a duas ONGs. Por isso, o repositório usa `UPDATE ... WHERE status = 'disponivel' RETURNING *` em uma única instrução; uma tentativa sem linha alterada é recusada pelo domínio. O teste sequencial confirma a recusa do segundo aceite; a cobertura de chamadas simultâneas permanece uma melhoria de teste.
2. **Manutenibilidade.** Regras de negócio, HTTP e persistência têm responsabilidades separadas (`src/doacoes.js`, `src/app.js`, `src/repositorio.js` e `src/db.js`). Isso permite alterar o driver e o SQL sem transferir regras para a interface. A migração preservou o contrato `query()` com retorno `rows`; os testes exercitam os fluxos via API.
3. **Reprodutibilidade do ambiente de validação.** A suíte deve executar com o mesmo SGBD da aplicação e sem depender da senha de um serviço compartilhado. O CI usa Node.js 22, PostgreSQL 16 e `npm ci`; o [README](../README.md#como-rodar-sem-supabase) documenta contêineres separados para aplicação e testes. A escolha evita substituir PostgreSQL por SQLite ou por mocks para validar a persistência.

Expiração e janela de coleta são regras funcionais associadas às histórias acima. O tempo de aceite menor que 15 minutos permanece uma hipótese de produto da análise, sem medição de piloto nesta entrega.

## Validação e limites

Execute a suíte com o banco exclusivo descrito no [README](../README.md#banco-exclusivo-de-testes). Os testes cobrem as histórias, datas e fusos, dados obrigatórios, IDs inválidos e erros de aceite. Eles não comprovam a execução da interface no navegador, entrega de notificações externas ou operação do Supabase.

Permanecem planejados: autenticação, credenciamento sanitário, confirmação de retirada, liberação após não retirada e expansão multicidade. A decisão #3 não possui implementação nem teste de reabertura nesta versão. A revisão da sequência continua com seu autor, conforme a seção de diagramas.
