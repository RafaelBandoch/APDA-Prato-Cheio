## Problema encontrado no diagrama de estados gerado pela IA

Comparado com `src/doacoes.js`, `src/repositorio.js` e `docs/analise.md`. A versão da IA está em `docs/diagramas/estados-doacao.md`; a versão final desse arquivo já incorpora as correções abaixo.

**Problema:** A IA tratou a janela de coleta como um prazo de retirada depois do aceite (`Aceita → Disponivel` quando a janela termina) e deixou `Disponivel → Aceita` sem condição.

**Justificativa:** No Prato Cheio a janela é definida pelo doador para resolver o conflito entre doador e ONG (`docs/analise.md`, conflitos de prioridade). O critério da HU03 confirma o aceite só dentro dessa janela. Em `aceitar()`, de `src/doacoes.js`, um aceite fora da janela é recusado com "aceite fora da janela de coleta definida pelo doador". A janela condiciona a transição para `aceita`. Ela não é um temporizador sobre uma doação já aceita.

**Correção aplicada:** Na versão final, `disponivel → aceita` ficou com a condição `[dentro da janela de coleta, se definida]`.

**Problema:** A expiração foi desenhada como um temporizador ou processo agendado que dispara quando faltam 2 horas para a validade.

**Justificativa:** A `validade` é só uma data (`AAAA-MM-DD`), sem hora. O grupo interpretou "2 horas antes" como 22h, horário de São Paulo, no dia da validade. Não há agendador. `expirarVencidas()`, em `src/repositorio.js`, roda quando uma doação é consultada (`GET /api/doacoes`, `GET /api/doacoes/todas` e `GET /api/doacoes/:id`) e em `POST /api/doacoes/expirar`.

**Correção aplicada:** O rótulo de `disponivel → expirada` passou a descrever a regra das 22h de São Paulo e o momento em que ela é aplicada: ao consultar doações ou pela rota `/expirar`.

**Problema:** A IA incluiu o estado `Coletada` e a volta `Aceita → Disponivel` como se já fizessem parte do sistema.

**Justificativa:** O código só grava `disponivel`, `aceita` e `expirada`. Não existe rota nem função para confirmar a retirada nem para devolver uma doação aceita à listagem. Essas transições vêm do Risco 1 de `docs/analise.md` e ainda não foram implementadas. Sem janela definida, a própria resposta da IA não tem regra para essa volta.

**Correção aplicada:** As duas transições permaneceram na versão final, marcadas como previstas e não implementadas, para o diagrama não afirmar um comportamento que o sistema ainda não tem.

**Problema:** No diagrama da IA, `Aceita` só sai desse estado pela coleta ou pela volta a `Disponivel`. Não há transição para quando a validade passa com a doação ainda reservada.

**Justificativa:** É o Risco 1: o alimento vence reservado e não chega a ninguém. `expirarVencidas()` só altera linhas com status `disponivel`, então uma doação aceita e não retirada permanece `aceita`.

**Correção aplicada:** A versão final registra essa limitação na nota do estado `aceita`. Sair desse estado depende da confirmação de retirada, que continua prevista e não implementada.
