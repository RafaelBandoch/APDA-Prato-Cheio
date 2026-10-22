// Regras de negócio das doações.
import * as repo from './repositorio.js';

// História zero — "um doador publica uma doação".
// Critério: tipo, quantidade e validade são obrigatórios.
export async function criarDoacao({ tipo, quantidade, validade, janela_inicio = null, janela_fim = null }) {
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
  for (const limite of [janela_inicio, janela_fim]) {
    if (limite && Number.isNaN(Date.parse(limite))) {
      throw new Error('Informe datas válidas para a janela de coleta');
    }
  }
  if (janela_inicio && janela_fim && Date.parse(janela_fim) <= Date.parse(janela_inicio)) {
    throw new Error('O fim da janela de coleta deve ser depois do início');
  }
  return repo.inserir({ tipo, quantidade, validade, janela_inicio, janela_fim });
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

  // Regra 1: aplica a expiração das 22h antes de decidir o aceite.
  await repo.expirarVencidas();

  const existente = await repo.buscarPorId(id);
  if (!existente) {
    throw new Error('doação não encontrada');
  }
  if (existente.status === 'expirada') {
    throw new Error('doação expirada');
  }
  if (existente.status !== 'disponivel') {
    throw new Error('doação já foi aceita por outra ONG');
  }
  // Cada limite da janela vale sozinho: só início, só fim ou os dois.
  const agora = Date.now();
  const antesDoInicio = existente.janela_inicio && agora < Date.parse(existente.janela_inicio);
  const depoisDoFim = existente.janela_fim && agora > Date.parse(existente.janela_fim);
  if (antesDoInicio || depoisDoFim) {
    throw new Error('aceite fora da janela de coleta definida pelo doador');
  }

  const atualizada = await repo.aceitar(id, ong);
  if (!atualizada) {
    throw new Error('doação já foi aceita por outra ONG');
  }
  return atualizada;
}

export async function expirarVencidas() {
  return repo.expirarVencidas();
}

export async function buscarPorId(id) {
  return repo.buscarPorId(id);
}
