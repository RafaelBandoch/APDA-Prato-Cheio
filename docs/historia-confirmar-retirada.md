# HU04.4 — Confirmar retirada da doação

## História priorizada para o encontro de 04/11/2026

Como ONG que aceitou uma doação, quero confirmar a retirada dos alimentos, para registrar a conclusão da coleta e permitir que o doador acompanhe esse resultado.

Status: implementada e verificada localmente na branch `entrega-04/11`, publicada no [PR #20](https://github.com/RafaelBandoch/APDA-Prato-Cheio/pull/20). O acompanhamento de revisão, CI e integração fica no próprio PR.

A história dá continuidade ao épico HU04 de [análise](analise.md#quebra-de-épico-hu04) e ao acompanhamento por ID da HU04.3. Foi escolhida porque o produto já permite publicar, aceitar e acompanhar doações, mas ainda não registra a retirada efetiva.

## Escopo

- Permitir confirmar a retirada de uma doação aceita, identificando a ONG responsável pelo aceite.
- Registrar no PostgreSQL o status `retirada` e a data e hora da confirmação, definidas pelo servidor.
- Exibir o novo status e o horário registrado no acompanhamento da doação.
- Preservar os dados do aceite e impedir que uma doação retirada volte à oferta pública ou seja aceita novamente.

## Regras de negócio

- A única transição permitida nesta história é de `aceita` para `retirada`.
- A ONG informada na confirmação deve corresponder à ONG registrada no aceite.
- A confirmação só pode ocorrer antes das 22h de São Paulo no dia da validade e dentro dos limites da janela de coleta, quando informados. Os limites da janela seguem a mesma interpretação utilizada no aceite.
- Uma tentativa recusada não altera o status, a ONG ou o horário de retirada.
- A atualização deve ser atômica: duas confirmações simultâneas não podem registrar duas retiradas nem sobrescrever o primeiro horário.
- Uma confirmação repetida deve informar que a retirada já foi registrada e preservar os dados existentes.

O produto atual não possui autenticação. Comparar a ONG informada com a do aceite é uma validação de consistência, sem comprovação de identidade. Esta história não deve ser apresentada como autorização segura por usuário nem como prova física da coleta.

## Critérios de aceite

1. Dado que uma doação está aceita e dentro dos prazos permitidos, quando a ONG registrada no aceite confirma a retirada, então o status passa a `retirada` e o servidor registra a data e hora da confirmação.
2. Dado que uma doação foi retirada, quando o doador ou a ONG consulta o acompanhamento, então vê o status, a ONG e o horário de confirmação, inclusive após reiniciar a aplicação.
3. Dado que uma doação está disponível ou expirada, quando há uma tentativa de confirmar a retirada, então a operação é recusada e os dados permanecem inalterados.
4. Dado que uma doação está aceita, quando é informada uma ONG diferente da registrada no aceite, então a confirmação é recusada e os dados permanecem inalterados.
5. Dado que a janela de coleta ainda não começou, já terminou ou o limite de validade foi atingido, quando há uma tentativa de confirmação, então a operação é recusada sem registrar a retirada.
6. Dado que uma doação já foi retirada, quando há outra confirmação, então o sistema informa essa condição e preserva o horário original. Em tentativas simultâneas, somente uma realiza a transição.
7. Dado um ID inválido ou inexistente, quando há uma tentativa de confirmação, então o sistema informa que a doação não foi encontrada e não altera nenhum registro.
8. Dado que uma doação foi retirada, quando a listagem pública é consultada ou há tentativa de novo aceite, então ela permanece fora da oferta e não pode ser aceita novamente.
9. Dado que a interface mostra uma doação aceita, quando a confirmação é concluída ou recusada, então exibe o resultado e atualiza o acompanhamento sem exigir recarregar a página. O fluxo deve funcionar em desktop e mobile, com acesso por teclado.

## Fora do escopo

Autenticação, credenciamento sanitário, comprovantes ou fotos, confirmação pelo doador, notificações externas, avaliações, entrega ao destinatário final e liberação automática após não retirada não fazem parte deste incremento.

## Verificação prevista

- Testar via API a confirmação válida, os estados recusados, a ONG divergente, IDs inválidos, limites de horário e repetição.
- Testar duas confirmações simultâneas e conferir que o horário original foi preservado.
- Verificar a persistência após reiniciar a aplicação e a ausência da doação retirada na oferta pública.
- Validar na interface os estados de sucesso, erro e envio em andamento, em desktop e mobile.
- Executar a suíte com PostgreSQL exclusivo de testes, separado do banco compartilhado da equipe.

## Verificações realizadas

- Antes da implementação, os 28 novos casos falharam pela ausência da rota de retirada.
- Após a implementação, os 88 testes da suíte passaram, incluindo os 28 casos da HU04.4. Foram verificados os limites da validade e da janela, entradas inválidas, preservação dos dados em recusas, repetição, cinco confirmações simultâneas e reaplicação idempotente do schema.
- O teste de persistência fecha o pool e consulta a doação em uma nova instância da aplicação, com reconexão ao PostgreSQL.
- Uma verificação adicional encerrou e iniciou novamente o processo do servidor, confirmando que status, ONG e horário das retiradas foram preservados.
- O fluxo da interface foi executado em Chrome headless nas larguras de 1366 e 390 pixels: recusa de ONG divergente, confirmação por teclado, botão desabilitado durante o envio, atualização do acompanhamento e preservação após recarregar. Não houve erros JavaScript nem rolagem horizontal nesses cenários.
- Foi reproduzida uma confirmação em outra sessão enquanto a tela ainda mostrava `aceita`. Após a recusa, o acompanhamento foi atualizado para `retirada`, preservando a mensagem de erro e exibindo o horário original.
- A validação inicial usou Node.js 25.2.1 e PostgreSQL 18.4 temporário. Depois, os passos `npm ci` e `npm test` do workflow foram reproduzidos em uma cópia temporária com Node.js 22.23.4 e PostgreSQL 16.13 exclusivo: os 88 testes passaram. A cópia não contém `.env`; a conexão foi fornecida diretamente por `DATABASE_URL`. Essa reprodução local não comprova a execução do GitHub Actions nem a operação do Supabase.

## Evidências para a entrega

A conclusão depende da [definição de pronto do grupo](../README.md#definição-de-pronto-do-grupo): implementação com testes, documentação atualizada e PR integrado à `main` após revisão de outro integrante e CI verde.

O PR deve referenciar a HU04.4, descrever como verificar os critérios e incluir o registro de IA abaixo.

## Ambiente PostgreSQL e execução da migração

O ambiente da equipe é PostgreSQL gerenciado no Supabase, conforme o ADR 0003. A aplicação utiliza a conexão configurada por `DATABASE_URL`, mantida no `.env` local e fora do repositório.

Para o registro desta entrega, adota-se a premissa solicitada pelo responsável de que `npm run db:migrar` foi executado e concluído no Supabase, aplicando o schema da HU04.4. Essa conclusão não foi verificada diretamente nesta revisão. A execução deve criar as estruturas ausentes e adicionar `retirada_em TIMESTAMPTZ`, preservando os dados existentes.

Os testes e as migrações locais foram executados em PostgreSQL exclusivo, conforme a seção de verificações. Migrações versionadas continuam sendo uma pendência do ADR 0003; o mecanismo atual aplica alterações idempotentes por `src/db.js`.

### Próximo incremento do ADR 0003

A próxima evolução do banco será introduzir migrações versionadas. O escopo inicial é separar o schema base e a adição de `retirada_em` em arquivos ordenados, registrar as versões aplicadas e garantir que cada migração seja executada uma única vez, em transação. A validação deve abranger banco vazio, banco existente com doações e repetição do comando sem perda de dados. Esse trabalho está definido para implementação posterior e não faz parte do código entregue na HU04.4.

## Registro de uso de IA para o PR

A ferramenta OpenAI Codex foi usada para elaborar esta história, implementar API, persistência e interface e escrever os testes.

- Mantida a separação entre rotas, domínio e repositório para seguir a organização existente e manter as regras de negócio fora da interface.
- Mantidas as consultas parametrizadas para não concatenar entradas do usuário no SQL.
- Reutilizados o envio e as notificações da interface para preservar o comportamento existente de carregamento e mensagens.
- Adicionados o status `retirada`, o campo `retirada_em` e a rota de confirmação para registrar a etapa posterior ao aceite e preservá-la após reiniciar a aplicação.
- Incluídas as condições de estado, ONG e prazos na mesma atualização SQL para impedir confirmações concorrentes e preservar o primeiro horário.
- Ajustada a atualização do acompanhamento após uma recusa para evitar mostrar o status antigo quando outra sessão já confirmou a retirada.
- Adicionados testes de entrada, prazo, persistência, repetição e concorrência para verificar os critérios de aceite e detectar regressões.
- Registrada a definição de pronto no README para explicitar as condições comuns de conclusão das histórias do grupo.

Foram executados os testes automatizados e os cenários de navegador descritos na seção de verificações.

## Plano de implementação

1. Em `tests/doacoes.test.js`, cobrir a confirmação válida, persistência após reconexão, recusas, limites de horário, repetição e concorrência. Executar antes da implementação para confirmar a ausência da funcionalidade.
2. Em `src/db.js`, adicionar `retirada_em TIMESTAMPTZ` de forma idempotente. Em `src/repositorio.js`, atualizar status e horário em uma única instrução condicionada à ONG, ao estado e aos prazos.
3. Em `src/doacoes.js`, validar entrada e estado; em `src/app.js`, expor `POST /api/doacoes/:id/retirar`, com `404` para doação inexistente e `400` para confirmação recusada.
4. Em `public/index.html`, reutilizar o envio e as notificações existentes, mostrar a ação para doações aceitas no modo ONG e apresentar status, ONG e horário no acompanhamento.
5. Executar os testes em PostgreSQL temporário exclusivo, validar a interface em desktop e mobile e atualizar a documentação com as evidências e os limites encontrados.
