# Diagrama de Sequência — Aceite de Doação

O diagrama mostra o caminho de uma ONG ao tentar aceitar uma doação, desde a requisição HTTP até a atualização no banco de dados.

## Fluxo de aceite

```mermaid
sequenceDiagram
    actor ONG
    participant app as app.js
    participant doacoes as doacoes.js
    participant repo as repositorio.js
    participant db as SQLite/PostgreSQL

    ONG->>app: POST /api/doacoes/:id/aceitar { ong opcional }
    app->>doacoes: aceitar(id, req.body?.ong ?? "ONG")

    alt ONG vazia
        doacoes-->>app: erro "ong é obrigatória"
        app-->>ONG: 400 { erro }
    else ONG informada
        doacoes->>repo: buscarPorId(id)
        repo->>db: SELECT * FROM doacoes WHERE id = ?
        db-->>repo: linha da doação ou nenhuma
        repo-->>doacoes: doação ou undefined

        alt Doação não existe
            doacoes-->>app: erro "doação não encontrada"
            app-->>ONG: 400 { erro }
        else Status diferente de disponivel
            doacoes-->>app: erro "doação já foi aceita por outra ONG"
            app-->>ONG: 400 { erro }
        else Fora da janela de coleta
            Note over doacoes: Esta validação é aplicada quando janela_fim está definida.<br/>Se janela_inicio estiver ausente, usa 1970-01-01T00:00:00Z.
            doacoes-->>app: erro "aceite fora da janela de coleta definida pelo doador"
            app-->>ONG: 400 { erro }
        else Aceite válido
            doacoes->>repo: aceitar(id, ong)
            repo->>db: UPDATE ... WHERE id = ? AND status = 'disponivel' RETURNING *
            db-->>repo: linha atualizada ou nenhuma
            repo-->>doacoes: doação atualizada ou undefined

            alt Atualização vazia (outra ONG aceitou antes)
                doacoes-->>app: erro "doação já foi aceita por outra ONG"
                app-->>ONG: 400 { erro }
            else Atualização realizada
                doacoes-->>app: doação atualizada
                app-->>ONG: 200 JSON da doação atualizada
            end
        end
    end
```

## Como ler o fluxo

1. A rota recebe o ID da doação e a ONG. Se `ong` não for enviada, a API usa `"ONG"` como valor padrão.
2. A regra de negócio busca a doação e recusa o aceite se ela não existir, já tiver outro status ou estiver fora da janela definida.
3. O repositório atualiza o status para `aceita` e registra a ONG somente se a doação ainda estiver `disponivel`. Essa condição no `UPDATE` impede que duas ONGs concluam o aceite da mesma doação.
4. A API devolve a doação atualizada com HTTP 200; erros de validação são devolvidos com HTTP 400.

## Limitação desta versão

Este diagrama representa a lógica da branch `feat/logica-janela-coleta`. Embora exista uma operação `expirarVencidas()`, ela ainda não é chamada antes do aceite nesta versão. Portanto, o fluxo não verifica nem expira uma doação vencida antes de tentar aceitá-la.
