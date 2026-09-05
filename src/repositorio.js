// Camada de dados do Prato Cheio — acesso ao banco.
// TODO (grupo): implementar as quatro funções abaixo usando query().
// A conexão e o schema já estão prontos em src/db.js.
//
// Marcador de parâmetro é `?` (SQL parametrizado evita injeção):
//   const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
import { query } from './db.js';

// TODO: inserir a doação e devolver a linha criada (dica: INSERT ... RETURNING *).
export async function inserir({ tipo, quantidade, validade }) {
  const { rows } = await query(
    'INSERT INTO doacoes (tipo, quantidade, validade) VALUES (?, ?, ?) RETURNING *',
    [tipo, quantidade, validade],
  );
  return rows[0];
}

// Devolve apenas as doações com status 'disponivel'.
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
  const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
  return rows[0];
}

// TODO: marcar a doação como aceita pela ONG e devolver a linha atualizada.
// Pense: como garantir que duas ONGs não aceitem a mesma doação?
export async function aceitar(id, ong) {
  const { rows } = await query(
    "UPDATE doacoes SET status = 'aceita', ong = ? WHERE id = ? AND status = 'disponivel' RETURNING *",
    [ong, id],
  );
  return rows[0];
}
