// Regras de negócio das doações.
import * as repo from './repositorio.js';

// História zero — "um doador publica uma doação".
// Critério: tipo, quantidade e validade são obrigatórios.
export async function criarDoacao({ tipo, quantidade, validade }) {
  if (!tipo || !quantidade || !validade) {
    throw new Error('tipo, quantidade e validade são obrigatórios');
  }
  const data = typeof validade === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(validade)
    ? new Date(`${validade}T00:00:00Z`) : new Date(NaN);
  if (!Number.isFinite(data.getTime()) || data.toISOString().slice(0, 10) !== validade) {
    throw new Error('Informe uma data de validade válida no formato AAAA-MM-DD');
  }
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const parte = tipo => partes.find(p => p.type === tipo).value;
  const hoje = `${parte('year')}-${parte('month')}-${parte('day')}`;
  if (validade < hoje) {
    throw new Error('A validade deve ser hoje ou uma data futura');
  }
  return repo.inserir({ tipo, quantidade, validade });
}

// História zero — "uma ONG vê as doações disponíveis".
export async function listarDisponiveis() {
  return repo.listarDisponiveis();
}

// Lista todas as doações, em qualquer status (visão do doador/administração).
export async function listarTodas() {
  return repo.listarTodas();
}

// História zero — "uma ONG aceita uma doação".
// Regra do caso: uma doação aceita não fica disponível para outra ONG.
export async function aceitar(id, ong) {
  if (!ong) {
    throw new Error('ong é obrigatória');
  }

  const existente = await repo.buscarPorId(id);
  if (!existente) {
    throw new Error('doação não encontrada');
  }
  if (existente.status !== 'disponivel') {
    throw new Error('doação já foi aceita por outra ONG');
  }

  const atualizada = await repo.aceitar(id, ong);
  if (!atualizada) {
    throw new Error('doação já foi aceita por outra ONG');
  }
  return atualizada;
}
