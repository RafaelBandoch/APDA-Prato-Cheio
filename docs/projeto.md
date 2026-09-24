# Documento de Projeto — Prato Cheio

*Trabalho 2 · máximo 4 páginas (fora diagramas) · entrega na Aula 10*

## Decisões de projeto
| # | Decisão | Alternativas | Requisito/risco da Análise que a motiva |
|---|---|---|---|
| 1 | Como resolver o conflito entre urgência do doador e disponibilidade da ONG na retirada | **A)** Doador define uma *Janela de Coleta*; o aceite só é válido se a ONG se comprometer a retirar dentro dessa janela e da validade à temperatura ambiente. **B)** Matching automático: o sistema cruza agendas das ONGs com o horário do doador e só oferece a doação a quem “encaixa”. | Conflito de prioridade Doador×ONG (Análise); critério de aceite HU03 (janela de coleta); segurança sanitária como critério inegociável. |
| 2 | Como garantir exclusividade quando duas ONGs tentam aceitar a mesma doação ao mesmo tempo | **A)** Aceite atômico no banco (`UPDATE … WHERE status = 'disponivel'`): só uma transação vence; a outra recebe erro. **B)** Reserva temporária (soft lock): a primeira ONG “segura” a doação por N minutos; se não confirmar, libera para outras. | Regra de negócio 2 — Exclusividade de Aceite; critério HU03 (trava o status e remove da listagem). |
| 3 | O que fazer se a ONG aceita mas não retira na janela combinada | **A)** Liberação automática: após um prazo máximo sem confirmação de retirada, a doação volta à listagem e a falha entra no histórico da ONG. **B)** Cancelamento só pelo doador: a doação fica “presa” até o doador liberar manualmente; a plataforma apenas registra reclamação. | Risco 1 da Análise (alimento vence “reservado”); mitigação já proposta na unidade de Análise. |

## Tabela de trade-offs (uma decisão em detalhe)

**Decisão escolhida:** #1 — Janela de Coleta vs. matching automático de agendas.

| Critério | Alternativa A — Janela de Coleta definida pelo doador | Alternativa B — Matching automático por agenda |
|---|---|---|
| Segurança sanitária | Alta: o aceite amarra a retirada à validade e à janela explícita do doador. | Média/alta: depende da qualidade dos dados de agenda; erro de cadastro pode gerar retirada fora do prazo. |
| Simplicidade de implementação (U2/U3) | Alta: campos de início/fim na doação + validação no aceite. | Baixa: exige cadastro de disponibilidade por ONG, algoritmo de matching e manutenção contínua. |
| Autonomia do doador | Alta: ele controla quando precisa liberar o espaço. | Baixa: o sistema decide quem vê a oferta. |
| Cobertura de ONGs | Média: ONGs fora da janela não podem aceitar (pode sobrar comida se poucas encaixarem). | Potencialmente maior: só quem encaixa vê — mas ONGs flexíveis podem ficar de fora se a agenda estiver desatualizada. |
| Risco operacional | Baixo no curto prazo; risco residual se a ONG aceitar e não retirar (tratado na decisão #3). | Alto: agenda desatualizada gera matches inválidos e frustração nas duas pontas. |
| Alinhamento ao walking skeleton atual | Alto: estende o fluxo publicar → listar → aceitar sem novo módulo de agenda. | Baixo: muda o modelo de oferta antes do núcleo estabilizar. |

**Escolha:** Alternativa A (Janela de Coleta). Atende o conflito da Análise com menos complexidade e preserva o critério sanitário no momento do aceite.

## Justificativa das decisões

| Decisão | Escolha | Justificativa (rastreio à Análise) |
|---|---|---|
| 1 — Conflito de retirada | **Janela de Coleta (A)** | A Análise já fixou que a segurança sanitária é inegociável e propôs a janela como resolução do conflito Doador×ONG. O critério HU03 exige que o aceite só confirme se a retirada estiver na janela e na validade à temperatura ambiente. |
| 2 — Exclusividade de aceite | **Aceite atômico (A)** | A Regra de negócio 2 e o critério HU03 exigem trava imediata e remoção da listagem. O `UPDATE` condicional no repositório implementa isso sem fila intermediária, alinhado ao walking skeleton. |
| 3 — Não-retirada após aceite | **Liberação automática (A)** | É a mitigação registrada no Risco 1 da Análise: sem liberação, o alimento vence reservado e o objetivo de impacto (reduzir desperdício / alimentar beneficiários) falha. |

## Diagramas
(contexto + dados ou componentes — em `docs/` ou como imagem)

## ADRs
Ver `docs/adr/`. Cada decisão acima pode virar um ADR copiado de `0000-modelo-adr.md` quando for detalhada na implementação.

## Requisitos não-funcionais
| Requisito | Como afeta o design |
|---|---|
| Aceite exclusivo sob concorrência | O caminho feliz e o caso de corrida precisam ser cobertos por teste; a regra vive no repositório/transação, não só na UI. |
| Expiração de oferta (Regra 1) | Doações perecíveis saem da listagem 2h antes da validade; exige job ou verificação na listagem + notificação ao doador. |
| Credenciamento sanitário “Ativo” (Regra 3 + Risco 2) | Listagem e aceite filtrados por status; validade do credenciamento com transição automática para “Pendente”. |
| Tempo até o aceite < 15 min (Objetivo 3) | Por enquanto listagem passiva (hipótese da Análise); se o piloto falhar, o design prevê notificação ativa (push/SMS) sem mudar o núcleo publicar/aceitar. |
| Migração SQLite → PostgreSQL (disciplina, U3) | Isolar SQL em `src/db.js` / repositório; decisão de hospedagem do Postgres em ADR próprio. |

## Critérios de validação do projeto
- As três decisões acima aparecem rastreadas a item concreto de `docs/analise.md` (conflito, regra ou risco).
- A tabela de trade-offs usa critérios mensuráveis/discutíveis (segurança, complexidade, autonomia, risco).
- O walking skeleton (publicar → listar → aceitar) permanece o núcleo; decisões #1 e #3 estendem esse fluxo sem substituí-lo.
- Testes cobrem exclusividade de aceite (decisão #2) e, quando implementadas, rejeição de aceite fora da janela (decisão #1) e reabertura após não-retirada (decisão #3).

## Uso de IA
Rascunho inicial da estrutura de decisões e da tabela de trade-offs gerado com apoio de IA a partir de `docs/analise.md` e do estado do código; o grupo revisou o alinhamento com regras, riscos e critérios de aceite antes de considerar o texto entregável.
