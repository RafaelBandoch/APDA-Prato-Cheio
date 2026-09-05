// Regras de negócio das doações.
import * as repo from './repositorio.js';

// História zero — "um doador publica uma doação".
// Critério: tipo, quantidade e validade são obrigatórios.
export async function criarDoacao({ tipo, quantidade, validade }) {
  if (!tipo || !quantidade || !validade) {
    throw new Error('tipo, quantidade e validade são obrigatórios');
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
