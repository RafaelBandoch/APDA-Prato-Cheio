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
  await expirarVencidas();
  const { rows } = await query(
    "SELECT * FROM doacoes WHERE status = 'disponivel' ORDER BY id",
  );
  return rows;
}

// Devolve todas as doações, em qualquer status.
export async function listarTodas() {
  await expirarVencidas();
  const { rows } = await query('SELECT * FROM doacoes ORDER BY id');
  return rows;
}

// Maior valor da coluna INTEGER do PostgreSQL; acima disso o id não pode existir.
const MAIOR_ID = 2147483647;

// Busca uma doação pelo id (devolve undefined se não existir).
export async function buscarPorId(id) {
  if (!/^[1-9]\d*$/.test(String(id)) || Number(id) > MAIOR_ID) return undefined;
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
 * Regra 1 (analise.md): expira doações disponíveis às 22h de São Paulo
 * no dia da validade. Devolve as linhas expiradas.
 */
export async function expirarVencidas() {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const parte = tipo => partes.find(item => item.type === tipo).value;
  let vencidasAte = `${parte('year')}-${parte('month')}-${parte('day')}`;

  if (Number(parte('hour')) < 22) {
    const ontem = new Date(Date.UTC(
      Number(parte('year')),
      Number(parte('month')) - 1,
      Number(parte('day')) - 1,
    ));
    vencidasAte = ontem.toISOString().slice(0, 10);
  }

  const { rows } = await query(
    "UPDATE doacoes SET status = 'expirada' WHERE status = 'disponivel' AND validade <= $1 RETURNING *",
    [vencidasAte],
  );
  return rows;
}
