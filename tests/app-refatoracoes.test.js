import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const doacoes = vi.hoisted(() => ({
  listarDisponiveis: vi.fn(),
  listarTodas: vi.fn(),
  buscarPorId: vi.fn(),
  expirarVencidas: vi.fn(),
  criarDoacao: vi.fn(),
  aceitar: vi.fn(),
  confirmarRetirada: vi.fn(),
}));

vi.mock('../src/doacoes.js', () => doacoes);

import { criarApp } from '../src/app.js';

const app = criarApp();

afterEach(() => vi.clearAllMocks());

describe('respostas de erro das rotas', () => {
  it('mantém a resposta normal da rota com o handler compartilhado', async () => {
    doacoes.listarDisponiveis.mockResolvedValue([]);

    const resposta = await request(app).get('/api/doacoes');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });

  it('mantém o status 400 e a mensagem para erros de negócio', async () => {
    doacoes.listarDisponiveis.mockRejectedValue(new Error('falha de negócio'));

    const resposta = await request(app).get('/api/doacoes');

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ erro: 'falha de negócio' });
  });

  it('preserva o status 404 explicitamente informado pelo domínio', async () => {
    const erro = Object.assign(new Error('doação não encontrada'), { status: 404 });
    doacoes.confirmarRetirada.mockRejectedValue(erro);

    const resposta = await request(app)
      .post('/api/doacoes/1/retirar')
      .send({ ong: 'ONG Esperança' });

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ erro: 'doação não encontrada' });
  });
});
