# Documento de Análise — Prato Cheio

*Trabalho 1 · máximo 4 páginas · entrega na Aula 5*

## Problema central

## Incertezas

## Stakeholders
| Stakeholder | Interesse | Influência | O que espera |
|---|---|---|---|
| **Doadores (Restaurantes/Mercados)** | Alto | Alta | Escoar excedentes sem burocracia, reduzir custos com descarte e garantir segurança jurídica (isenção de responsabilidade se seguir as normas). |
| **ONGs (Instituições parceiras)** | Alto | Alta | Receber alimentos de qualidade de forma previsível e gratuita para atender seus beneficiários. |
| **Vigilância Sanitária (Regulador)** | Baixo | Alta | Garantir que o transporte, embalagem e armazenamento sigam estritamente as normas de segurança alimentar vigentes. |
| **Patrocinadores da Plataforma** | Alto | Alta | Métricas claras de impacto social (kg de comida salva, número de pessoas atendidas) e ROI social. |
| **Entregadores / Voluntários logísticos** | Médio | Média | Rotas otimizadas, informações claras de coleta/entrega e facilidade na comunicação com as pontas. |
| **Beneficiários Finais** | Alto | Baixa | Receber refeições seguras, nutritivas e com dignidade (não acessam a plataforma diretamente). |

## Conflitos de prioridade (Resolução)
**Falas contraditórias:**
- *Doador:* "Preciso que a doação seja retirada em até 1 hora, pois minha cozinha é pequena e preciso liberar espaço rapidamente após o serviço."
- *ONG:* "Só posso receber doações a partir das 15h, que é quando tenho voluntários no local para fazer a triagem e guardar a comida."

**O Conflito:** Velocidade de liberação de espaço físico (necessidade do Doador) *versus* Janela de recebimento (necessidade operacional da ONG).
**Critério para decisão:** A segurança sanitária e do alimento é o critério inegociável. Para resolver o conflito, a plataforma pode exigir que o Doador defina uma "Janela de Coleta". Apenas ONGs que puderem se comprometer a retirar e armazenar o alimento *dentro dessa janela e dentro do tempo de validade à temperatura ambiente* poderão aceitar a doação.

## Objetivos de impacto (Negócio x Usuário)
1. Reduzir em 30% o desperdício mensal de alimentos dos doadores parceiros (Objetivo de Negócio/Sustentabilidade).
2. Aumentar em 50% o volume de refeições fornecidas pelas ONGs cadastradas (Necessidade do Usuário/Social).
3. Conectar a intenção de doação ao aceite da ONG em menos de 15 minutos (Objetivo de Produto/Eficiência).

## Regras de negócio
1. **Validade e Expiração de Oferta:** Toda doação perecível publicada na plataforma deve ter um prazo de validade predefinido para transporte. Se a doação não for aceita por nenhuma ONG até 2 horas antes desse prazo, ela deve ser expirada, ocultada da listagem e notificada ao doador.
2. **Exclusividade de Aceite:** No momento em que uma ONG aceita uma doação disponível, o sistema deve removê-la imediatamente da lista pública e travar o status, impossibilitando que uma segunda ONG a aceite concorrentemente.
3. **Credenciamento Sanitário:** Apenas ONGs com documentação de vigilância sanitária aprovada e com status "Ativo" no sistema podem visualizar e aceitar doações, garantindo que o transporte e manuseio final sejam adequados e legais.

## Histórias de usuário
| # | História (Como… quero… para…) | INVEST: o que falha |
|---|---|---|
| HU01 | Como doador, quero publicar uma doação de alimentos, para disponibilizá-la para ONGs. | — (Atende ao INVEST) |
| HU02 | Como ONG, quero visualizar as doações disponíveis, para encontrar alimentos que possam ser aproveitados. | — (Atende ao INVEST) |
| HU03 | Como ONG, quero aceitar uma doação, para reservar os alimentos para minha organização. | — (Atende ao INVEST) |
| HU04 | Como usuário, quero gerenciar todo o processo de doação, desde o cadastro até a entrega, incluindo notificações, histórico e avaliações, para controlar tudo em um único lugar. | **S, T:** Grande demais e difícil de testar como uma única história. |
| HU05 | Como doador, quero publicar uma doação informando todos os dados necessários, validando automaticamente a validade, verificando a quantidade, calculando a distância até as ONGs, notificando as organizações próximas e registrando o histórico, para garantir que a doação seja distribuída corretamente. | **N, S:** Mistura muitas decisões e funcionalidades em uma única história. |

### Quebra de Épico (HU04)
**Épico:** Como usuário, quero gerenciar todo o processo de doação, desde o cadastro até a entrega, incluindo notificações, histórico e avaliações, para controlar tudo em um único lugar.

- **HU04.1 — Publicar doação**: Como doador, quero publicar uma doação de alimentos, para disponibilizá-la para ONGs.
- **HU04.2 — Aceitar doação**: Como ONG, quero aceitar uma doação disponível, para reservar os alimentos para minha organização.
- **HU04.3 — Acompanhar doação**: Como doador ou ONG, quero acompanhar o status da doação, para saber em que etapa do processo ela está.

## Critérios de aceite
**HU01 — Publicar doação**
- Dado que sou um doador autenticado, quando publico uma doação informando alimento, quantidade e prazo de validade, então a doação passa a aparecer na listagem para as ONGs credenciadas.
- Dado que uma doação publicada não é aceita por nenhuma ONG até 2 horas antes do prazo de validade, quando esse limite é atingido, então o sistema expira a doação, oculta-a da listagem e notifica o doador.

**HU02 — Visualizar doações disponíveis**
- Dado que sou uma ONG com credenciamento sanitário aprovado e status "Ativo", quando acesso a listagem, então vejo somente doações disponíveis, não expiradas e ainda não aceitas por outra ONG.
- Dado que minha ONG está com credenciamento pendente ou reprovado, quando tento acessar a listagem, então o sistema bloqueia a visualização e informa a pendência.

**HU03 — Aceitar doação**
- Dado que uma doação está disponível, quando a ONG credenciada confirma o aceite, então o sistema trava o status da doação e a remove imediatamente da listagem pública, impedindo que outra ONG a aceite.
- Dado que o doador definiu uma janela de coleta, quando a ONG aceita a doação, então o aceite só é confirmado se o horário de retirada estiver dentro dessa janela e dentro do prazo de validade à temperatura ambiente.

## Riscos
| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|

## Hipótese e experimento

## Decisão de análise
- **Problema:**
- **Alternativas:**
- **Decisão e justificativa:**
- **Riscos e limitações:**

## Uso de IA

**a) Melhoria de História de Usuário (Doador)**
- **História gerada pela IA:** "Como usuário, quero que o sistema tenha uma plataforma completa de doações com cadastro, login, publicação, busca, notificações, chat, mapas e histórico, para facilitar todo o processo."
- **Problemas:** É muito grande, mistura várias funcionalidades e não deixa claro qual usuário está realizando cada ação.
- **Corrigida:** Como doador, quero publicar uma doação de alimentos, para disponibilizá-la para ONGs.
- **O que mudou:** Foi definido o ator (doador), uma única ação (publicar doação) e um objetivo claro. A história ficou menor, mais estimável e testável.

**b) Melhoria de História de Usuário (ONG - Visualizar)**
- **História gerada pela IA:** "Como ONG, quero ter acesso às doações para poder gerenciar tudo."
- **Problemas:** "Ter acesso" e "gerenciar tudo" são vagos.
- **Corrigida:** Como ONG, quero visualizar as doações disponíveis, para encontrar alimentos que possam ser aproveitados.
- **O que mudou:** A ação ficou específica e é possível criar critérios de aceite para verificar se a funcionalidade funciona.

**c) Melhoria de História de Usuário (ONG - Aceitar)**
- **História gerada pela IA:** "Como usuário, quero aceitar uma doação e receber notificações, atualizar meu perfil e acompanhar o pedido."
- **Problemas:** Existem várias funcionalidades diferentes na mesma história.
- **Corrigida:** Como ONG, quero aceitar uma doação disponível, para reservar os alimentos para minha organização.
- **O que mudou:** A história foi dividida, mantendo apenas uma funcionalidade e um benefício. Notificações, perfil e acompanhamento podem virar histórias separadas.
