## Problema encontrado no diagrama de estados gerado pela IA

Comparado com `src/doacoes.js`, `src/repositorio.js` e `docs/analise.md`. A versão original da IA e a versão revisada estão em `docs/diagramas/estados-doacao.md`. As correções abaixo descrevem mudanças no modelo e o registro de limitações; não significam que as funcionalidades previstas tenham sido implementadas.

**Problema:** A IA tratou a janela de coleta como um prazo de retirada depois do aceite (`Aceita → Disponivel` quando a janela termina) e deixou `Disponivel → Aceita` sem condição.

**Justificativa:** No Prato Cheio a janela é definida pelo doador para resolver o conflito entre doador e ONG (`docs/analise.md`, conflitos de prioridade). O critério da HU03 confirma o aceite só dentro dessa janela. Em `aceitar()`, de `src/doacoes.js`, um aceite fora da janela é recusado com "aceite fora da janela de coleta definida pelo doador". A janela condiciona a transição para `aceita`. Ela não é um temporizador sobre uma doação já aceita.

**Correção aplicada:** Na versão final, `disponivel → aceita` ficou com a condição `[dentro da janela de coleta, se definida]`.

**Problema:** A expiração foi desenhada como um temporizador ou processo agendado que dispara quando faltam 2 horas para a validade.

**Justificativa:** A `validade` é só uma data (`AAAA-MM-DD`), sem hora. O grupo interpretou "2 horas antes" como 22h, horário de São Paulo, no dia da validade. Não há agendador. `expirarVencidas()`, em `src/repositorio.js`, roda nas consultas (`GET /api/doacoes`, `GET /api/doacoes/todas` e `GET /api/doacoes/:id`), antes do aceite (`POST /api/doacoes/:id/aceitar`, conforme o PR #13) e em `POST /api/doacoes/expirar`.

**Correção aplicada ao modelo:** O rótulo de `disponivel → expirada` descreve a regra das 22h de São Paulo; a nota de `expirada` esclarece que a atualização é aplicada ao consultar ou aceitar doações e pela rota `/expirar`.

**Problema:** A IA incluiu o estado `Coletada` e a volta `Aceita → Disponivel` como se já fizessem parte do sistema.

**Justificativa:** O código só grava `disponivel`, `aceita` e `expirada`. Não existe rota nem função para confirmar a retirada nem para devolver uma doação aceita à listagem. Essas transições vêm do Risco 1 de `docs/analise.md` e ainda não foram implementadas. Sem janela definida, a própria resposta da IA não tem regra para essa volta.

**Correção aplicada ao modelo:** O estado `Coletada` foi removido da versão revisada. A confirmação de retirada passou a ser representada por `aceita → [*]`, e a reabertura por `aceita → disponivel`. As duas transições estão explicitamente marcadas como previstas e não implementadas; não correspondem a operações disponíveis no código atual.

**Problema:** O diagrama da IA sugere que a doação aceita terá seu ciclo encerrado pela coleta ou será reaberta quando não houver retirada, mas não explicita que nenhum desses caminhos está implementado. Assim, oculta a limitação de uma doação permanecer reservada mesmo depois da validade.

**Justificativa:** É a situação do Risco 1 de `docs/analise.md`: o alimento pode vencer reservado e não chegar a ninguém. `expirarVencidas()` só altera linhas com status `disponivel`, então uma doação aceita e não retirada permanece `aceita`. Isso está de acordo com o escopo da Regra 1, que exige expirar doações não aceitas; o problema é a falta de tratamento da retirada e da não retirada, não a ausência de expiração de doações aceitas.

**Correção aplicada ao modelo:** A nota de `aceita` registra que, na implementação atual, a doação não sai desse estado. A confirmação de retirada e a reabertura continuam identificadas como previstas. O modelo não adiciona uma transição automática de `aceita` para `expirada` como se fosse exigida pela Regra 1.
