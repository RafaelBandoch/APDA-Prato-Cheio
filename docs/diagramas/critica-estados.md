# Crítica — Diagrama de Estados da Doação

**Autor da crítica:** Rafael Bandoch  
**Diagrama criticado:** `docs/diagramas/estados-doacao.md` (Gabriel Lengert)

---

## Problema 1

**O que a IA representou incorretamente:**  
A IA não incluiu o estado `expirada` nem a transição automática provocada pela Regra 1
(`validade <= agora + 2h` sem aceite). O diagrama mostrava apenas dois estados:
`disponivel` e `aceita`, como se uma doação ou fosse aceita ou ficasse disponível para sempre.

**Justificativa:**  
A Regra de Negócio 1 (`docs/analise.md`) é explícita: doações perecíveis não aceitas
até 2 horas antes da validade devem ser expiradas e ocultadas da listagem. Omitir esse
estado torna o diagrama inconsistente com a implementação real em `src/repositorio.js`
(`expirarVencidas()`) e com o critério de aceite da HU01.

**Correção aplicada:**  
Adicionamos o estado `expirada` com a transição `disponivel --> expirada` disparada
pela função `expirarVencidas()`. Também adicionamos a transição de retorno
`aceita --> disponivel` para representar o Risco 1 (`docs/analise.md`): ONG aceita
mas não retira na janela, e a doação volta à listagem automaticamente.

---

## Problema 2

**O que a IA representou incorretamente:**  
A IA não representou a transição de retorno de `aceita` para `disponivel`
(liberação automática quando a ONG não retira no prazo — Risco 1 do projeto).

**Justificativa:**  
Sem essa transição, o diagrama sugere que uma doação aceita sempre termina entregue,
o que não é verdade. O Risco 1 de `docs/analise.md` prevê explicitamente que o sistema
deve liberar a doação de volta à listagem se a ONG não confirmar a retirada, registrando
a falha no histórico da ONG.

**Correção aplicada:**  
Incluímos a seta `aceita --> disponivel` com o rótulo `ONG não retira na janela (Risco 1)`.
