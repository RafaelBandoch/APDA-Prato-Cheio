// Camada de dados do Prato Cheio — acesso ao banco.
// Marcador de parâmetro é $1, $2... (PostgreSQL — evita injeção de SQL):
//   const { rows } = await query('SELECT * FROM doacoes WHERE id = $1', [id]);
import { query } from './db.js';

/**
 * Insere uma nova doação e devolve a linha criada.
 * Aceita opcionalmente janela_inicio e janela_fim (ISO 8601) para a Regra HU03.
 */
export async function inserir({ tipo, quantidade, validade, janela_inicio = null, janela_fim = null }) {
  const { rows } = await query(
    'INSERT INTO doacoes (tipo, quantidade, validade, janela_inicio, janela_fim) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [tipo, quantidade, validade, janela_inicio, janela_fim],
  );
  return rows[0];
}

/**
 * Devolve apenas as doações com status 'disponivel'.
 * Não inclui doações expiradas (status = 'expirada').
 */
export async function listarDisponiveis() {
  const { rows } = await query(
    "SELECT * FROM doacoes WHERE status = 'disponivel' ORDER BY id",
  );
  return rows;
}

// Devolve todas as doações, em qualquer status.
export async function listarTodas() {
  const { rows } = await query('SELECT * FROM doacoes ORDER BY id');
  return rows;
}

// Busca uma doação pelo id (devolve undefined se não existir).
export async function buscarPorId(id) {
  const { rows } = await query('SELECT * FROM doacoes WHERE id = $1', [id]);
  return rows[0];
}

/**
 * Marca como aceita pela ONG — atomicamente (Regra 2 / Decisão #2).
 * Devolve a linha atualizada, ou undefined se já foi aceita por outra ONG.
 */
export async function aceitar(id, ong) {
  const { rows } = await query(
    "UPDATE doacoes SET status = 'aceita', ong = $1 WHERE id = $2 AND status = 'disponivel' RETURNING *",
    [ong, id],
  );
  return rows[0];
}

/**
 * Regra 1 (analise.md): expira doações 'disponivel' cuja validade
 * está a menos de `margemHoras` horas do momento atual.
 * Devolve o número de linhas alteradas.
 */
export async function expirarVencidas(margemHoras = 2) {
  // Calcula a data-limite: agora + margemHoras horas, no formato 'YYYY-MM-DD'
  const limite = new Date(Date.now() + margemHoras * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const { alteradas } = await query(
    "UPDATE doacoes SET status = 'expirada' WHERE status = 'disponivel' AND validade <= $1 RETURNING *",
    [limite],
  );
  return alteradas ?? 0;
}
