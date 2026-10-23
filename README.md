# Prato Cheio — NoBug

Projeto da disciplina **Análise, Projeto e Desenvolvimento Ágil**.
Conecta doadores de alimentos excedentes a ONGs, antes que a comida se perca.

> Este repositório é a base do produto que evolui nas três unidades:
> walking skeleton (U1) → incremento guiado pelo projeto (U2) → produto refatorado (U3).

## Integrantes
- Anttonio Osório Molinaro Maccagnini — @anttonio06
- Gabriel Lengert Guedes — @GabrielLengertGuedes
- João Vitor Paranhos — @joaoparanhoss
- João Pedro Alves de Lima — @CapJao
- Rafael Alexandre Alves Bandoch — @RafaelBandoch

## Documentação e evidências

- [Análise, histórias de usuário e regras de negócio](docs/analise.md)
- [Decisões de projeto e requisitos não funcionais](docs/projeto.md)
- [Registros de decisões arquiteturais (ADRs)](docs/adr/)
- [Atividade de diagramas — escolha dos tipos, versões, críticas e PRs](docs/projeto.md#diagramas)
- [Diagrama de sequência do aceite — versões inicial e corrigida](docs/diagramas/sequencia-aceite.md)
- [Análise crítica do diagrama de sequência](docs/diagramas/critica-sequencia.md)
- [Diagrama de estados da doação — versões inicial e final, análise e reflexão](docs/diagramas/estados-doacao.md)
- [Análise crítica do diagrama de estados](docs/diagramas/critica-estados.md)
- [Retrospectivas](docs/retrospectivas/)
- [Testes automatizados](tests/doacoes.test.js)
- [Pipeline de integração contínua](.github/workflows/ci.yml)

## Como rodar sem Supabase

**A equipe utiliza PostgreSQL hospedado no Supabase.** Se o professor quiser executar o projeto com o banco utilizado pelo grupo, pode solicitar a conexão e a senha à equipe, que fornecerá os dados por um canal privado. As credenciais não são publicadas no repositório.

Como alternativa, o procedimento abaixo permite executar o projeto com PostgreSQL local via Docker, sem acesso ao Supabase e sem precisar solicitar a senha.

Requisitos: **Node.js 22.13 ou superior**, npm e Docker em execução. Os comandos abaixo usam Bash (Linux, macOS ou WSL). A aplicação usa PostgreSQL; SQLite pertence à versão inicial.

Não é necessário conhecer a senha do Supabase. O caminho local cria um PostgreSQL 16 independente, com dados próprios, e fornece `DATABASE_URL` diretamente em cada comando. Essa variável tem precedência sobre o `.env` existente. A autenticação sem senha abaixo é para a demonstração local, com a porta publicada apenas em `127.0.0.1`.

### Banco da aplicação

Na primeira execução:

```bash
npm ci
docker run --name prato-cheio-db --detach \
  --publish 127.0.0.1:54329:5432 \
  --env POSTGRES_HOST_AUTH_METHOD=trust \
  --env POSTGRES_DB=pratocheio \
  --volume prato-cheio-dados:/var/lib/postgresql/data \
  postgres:16
docker exec prato-cheio-db pg_isready -U postgres -d pratocheio
```

Aguarde o último comando informar `accepting connections`; se o banco ainda estiver iniciando, repita a verificação. Depois:

```bash
DATABASE_URL=postgresql://postgres@127.0.0.1:54329/pratocheio npm run db:migrar
DATABASE_URL=postgresql://postgres@127.0.0.1:54329/pratocheio npm start
```

Abra <http://localhost:3000>. A rota <http://localhost:3000/api/saude> responde `{ "ok": true }`. Para desenvolver com recarga automática, use a mesma variável com `npm run dev`.

O schema é criado por `npm run db:migrar` e também ao iniciar o servidor. O projeto ainda usa `CREATE TABLE IF NOT EXISTS` e adições idempotentes de colunas em `src/db.js`, sem um sistema de migrações versionadas.

### Banco exclusivo de testes

**Os testes apagam as doações do banco indicado por `DATABASE_URL`.** Use este segundo contêiner, separado do banco da aplicação e do Supabase:

```bash
docker run --name prato-cheio-testes --detach \
  --publish 127.0.0.1:54330:5432 \
  --env POSTGRES_HOST_AUTH_METHOD=trust \
  --env POSTGRES_DB=pratocheio_testes \
  postgres:16
docker exec prato-cheio-testes pg_isready -U postgres -d pratocheio_testes
```

Após `accepting connections`, execute:

```bash
DATABASE_URL=postgresql://postgres@127.0.0.1:54330/pratocheio_testes npm test
```

A suíte usa PostgreSQL real e cria o schema necessário. O CI faz o mesmo com Node.js 22 e PostgreSQL 16; os testes não usam SQLite em memória.

### Execuções seguintes

Os comandos `docker run` criam os contêineres uma única vez. Para parar e retomar os mesmos contêineres:

```bash
docker stop prato-cheio-db prato-cheio-testes
docker start prato-cheio-db prato-cheio-testes
```

Confira a prontidão novamente e repita os comandos da aplicação ou dos testes. As portas `54329` e `54330` precisam estar livres na primeira criação; se escolher outras, atualize também as URLs correspondentes.

### Usar o Supabase da equipe

Para usar o banco compartilhado, solicite à equipe a conexão e a senha; forneceremos os dados por um canal privado. Configure sua `DATABASE_URL` somente no `.env` local, seguindo [`.env.example`](.env.example), e execute `npm ci`, `npm run db:migrar` e `npm start`. Para executar de forma independente, use o caminho com Docker acima. Em ambos os casos, mantenha os testes no banco exclusivo documentado.

## Evolução do banco

O projeto começou com SQLite e já foi migrado para PostgreSQL, usando `pg.Pool` e consultas parametrizadas em `src/repositorio.js`. O banco pode ser local ou remoto, conforme `DATABASE_URL`; o código não exige recursos específicos do Supabase. Os [ADRs](docs/adr/) preservam os registros iniciais e incluem notas datadas sobre o que foi efetivamente implementado.

## Estrutura

```
src/server.js        entrypoint (npm start)
src/db.js            conexão e schema do banco (pronto)
src/app.js           rotas da API
src/doacoes.js       regras de negócio das doações
src/repositorio.js   acesso ao PostgreSQL (SQL)
public/index.html    interface (funciona no celular)
tests/               testes automatizados
docs/analise.md      documento de análise   (Trabalho 1)
docs/projeto.md      documento de projeto   (Trabalho 2)
docs/adr/            decisões arquiteturais (Trabalho 2)
docs/validacao.md    validação e testes     (Trabalho 3)
docs/refatoracoes.md refatorações feitas    (Trabalho 3)
docs/demo.md         roteiro da demo        (Trabalho 3)
docs/retrospectivas/ retrospectiva de cada iteração
.github/workflows/   pipeline de CI
```

## Como trabalhar (fluxo de Pull Request)

A partir da Unidade 2, **nada entra direto na `main`**:

```bash
git checkout -b historia/ong-aceita-doacao
# ... implementa, escreve o teste, roda npm test ...
git commit -m "ONG aceita uma doação e ela sai da lista"
git push -u origin historia/ong-aceita-doacao
```

Abra o Pull Request no GitHub, preencha o template, espere o **CI ficar verde** e
peça a revisão de **outro integrante**. Só então faça o merge.

## Estado da iteração 2

Implementados: publicar, listar e aceitar doações; acompanhar por ID; expirar disponíveis às 22h de São Paulo no dia da validade; informar e validar janela de coleta; persistir em PostgreSQL. Os critérios e os testes correspondentes estão em [docs/projeto.md](docs/projeto.md#histórias-de-usuário).

Autenticação, credenciamento sanitário, confirmação de retirada e liberação após não retirada continuam fora do incremento implementado. O aviso de expiração ao doador funciona apenas no navegador que publicou a doação, por `localStorage` e atualização das listas; não há envio externo nem agendador.

A entrega exige um vídeo de 5 a 8 minutos com todos os integrantes, o branch `entrega-2` representando a versão entregue e os envios individuais no Teams. O roteiro existente em `docs/demo.md` é um modelo anterior de três minutos e deve ser adaptado à duração e ao conteúdo exigidos. Esta orientação não registra o andamento da gravação ou dos envios da equipe.

## Uso de IA

A IA pode participar da produção, mas o grupo é responsável por verificar, testar,
corrigir e **defender** o resultado. Registre em cada Pull Request o que foi gerado
com IA e o que vocês alteraram.
