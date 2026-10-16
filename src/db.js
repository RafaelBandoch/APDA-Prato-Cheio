// Conexão com o banco — PostgreSQL via driver `pg`.
//
// A interface pública (query, migrar, limparBanco, encerrar) é a mesma de antes,
// então nenhum outro arquivo precisou mudar (src/doacoes.js, src/repositorio.js, etc).
//
// Configuração: defina DATABASE_URL no ambiente.
// Exemplo: postgres://user:senha@host:5432/dbname
// Localmente: copie .env.example para .env e preencha.
// No CI (GitHub Actions): configure como secret no repositório.
import pg from 'pg';
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL não definida. Copie .env.example para .env e preencha a variável.',
  );
}

// Pool reutiliza conexões — essencial quando há múltiplas instâncias da aplicação.
let pool;

function obterPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

/**
 * Executa uma consulta e devolve { rows, alteradas }.
 * Use $1, $2... como marcadores de parâmetro:
 *   query('SELECT * FROM doacoes WHERE id = $1', [id])
 */
export async function query(sql, valores = []) {
  const resultado = await obterPool().query(sql, valores);
  return {
    rows: resultado.rows,
    alteradas: resultado.rowCount ?? 0,
  };
}

/** Cria/atualiza o schema. Rodado por `npm run db:migrar` e ao subir o servidor. */
export async function migrar() {
  await obterPool().query(`
    CREATE TABLE IF NOT EXISTS doacoes (
      id            INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      tipo          TEXT NOT NULL,
      quantidade    TEXT NOT NULL,
      validade      TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'disponivel',
      ong           TEXT,
      janela_inicio TEXT,
      janela_fim    TEXT,
      criada_em     TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // Colunas adicionadas após a criação inicial — idempotente.
  for (const col of ['janela_inicio', 'janela_fim']) {
    await obterPool().query(`
      ALTER TABLE doacoes ADD COLUMN IF NOT EXISTS ${col} TEXT
    `);
  }
}

/** Apaga todos os dados. Usado pelos testes. */
export async function limparBanco() {
  await obterPool().query('DELETE FROM doacoes');
}

/** Fecha o pool. Usado pelos testes para não deixar conexões abertas. */
export async function encerrar() {
  if (!pool) return;

  const poolAtual = pool;
  pool = undefined;
  await poolAtual.end();
}
