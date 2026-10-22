## Problema encontrado no diagrama de sequência gerado pela IA
**Problema:** No fluxo de aceite (`POST /api/doacoes/:id/aceitar`), o diagrama vai direto de `aceitar(id, ong)` para `buscarPorId(id)` e decide o aceite só pelo status gravado no banco, sem chamar `expirarVencidas()` antes.

**Justificativa:** No Prato Cheio a expiração não tem agendador: `expirarVencidas()` só roda quando alguém consulta as doações ou chama `POST /api/doacoes/expirar`. Se a validade já venceu e ninguém consultou nada, a doação continua gravada como `disponivel`. Seguindo o diagrama, uma ONG consegue aceitar um alimento vencido, o que viola a Regra 1 de `docs/analise.md` e a segurança sanitária, definida na Análise como critério inegociável.

**Correção aplicada:** No código, `aceitar()` em `src/doacoes.js` passou a chamar `expirarVencidas()` antes de `buscarPorId(id)` e a recusar doações com status `expirada` (PR #13). **Pendente:** atualizar `docs/diagramas/sequencia-aceite.svg` com a mensagem `doacoes.js → repositorio.js: expirarVencidas()` antes da busca e o guarda `[status = expirada]`.
