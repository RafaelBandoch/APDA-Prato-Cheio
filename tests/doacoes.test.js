import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

// Banco limpo antes de cada teste; o schema é idempotente.
beforeEach(async () => {
  await migrar();
  await limparBanco();
});

afterAll(async () => {
  await encerrar();
});

function publicar(dados = {}) {
  return request(app)
    .post('/api/doacoes')
    .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01', ...dados });
}

// Este teste já passa e não depende do banco:
// prova que a aplicação sobe e que o CI está funcionando.
describe('a aplicação sobe', () => {
  it('responde na verificação de saúde', async () => {
    const res = await request(app).get('/api/saude');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('publicar e listar doações', () => {
  it('mostra a doação publicada na lista de disponíveis', async () => {
    await publicar({ tipo: 'Arroz' });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Arroz');
    expect(res.body[0].status).toBe('disponivel');
  });

  it('recusa doação sem os campos obrigatórios', async () => {
    const res = await request(app).post('/api/doacoes').send({ tipo: 'Arroz' });
    expect(res.status).toBe(400);

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });
});

describe('aceitar uma doação', () => {
  it('marca a doação como aceita pela ONG', async () => {
    const { body: doacao } = await publicar();

    const res = await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'Ação da Cidadania' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('aceita');
    expect(res.body.ong).toBe('Ação da Cidadania');
  });

  it('remove a doação da lista de disponíveis depois de aceita', async () => {
    const { body: doacao } = await publicar();
    await request(app).post(`/api/doacoes/${doacao.id}/aceitar`).send({ ong: 'Mesa Brasil' });

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });

  it('recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
    const { body: doacao } = await publicar();
    await request(app).post(`/api/doacoes/${doacao.id}/aceitar`).send({ ong: 'Primeira ONG' });

    const res = await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'Segunda ONG' });
    expect(res.status).toBe(400);
  });
});

// --- Casos limite / de erro não previstos nos critérios originais ---
describe('casos limite', () => {
  it('recusa publicar com campo vazio e não grava', async () => {
    const res = await publicar({ quantidade: '' });
    expect(res.status).toBe(400);

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });

  it('recusa aceitar uma doação que não existe', async () => {
    const res = await request(app)
      .post('/api/doacoes/999999/aceitar')
      .send({ ong: 'ONG Fantasma' });
    expect(res.status).toBe(400);
  });
});
