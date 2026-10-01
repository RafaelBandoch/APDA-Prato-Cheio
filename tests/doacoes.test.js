import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();

// Este teste já passa e não depende do banco:
// prova que a aplicação sobe e que o CI está funcionando.
describe('a aplicação sobe', () => {
  it('responde na verificação de saúde', async () => {
    const res = await request(app).get('/api/saude');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('serve a página inicial', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });
});

describe('publicar e listar doações', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  afterAll(async () => {
    await encerrar();
  });

  it('mostra a doação publicada na lista de disponíveis', async () => {
    await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Sopa');
  });

  it('recusa doação sem os campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigat/i);
  });

  it('devolve a doação criada com status disponível', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz', quantidade: '5 kg', validade: '2026-09-10' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.tipo).toBe('Arroz');
    expect(res.body.quantidade).toBe('5 kg');
    expect(res.body.validade).toBe('2026-09-10');
    expect(res.body.status).toBe('disponivel');
    expect(res.body.ong).toBeNull();
  });

  it('recusa doação sem o tipo', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ quantidade: '10 porções', validade: '2026-08-01' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigat/i);
  });

  it('recusa doação sem a validade', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigat/i);
  });

  it('recusa doação sem a quantidade', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', validade: '2026-08-01' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigat/i);
  });

  it('recusa doação com campos em branco', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: '', quantidade: '', validade: '' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigat/i);
  });

  it('publica sempre como disponível, mesmo se enviar status e ONG', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({
        tipo: 'Sopa',
        quantidade: '10 porções',
        validade: '2026-08-01',
        status: 'aceita',
        ong: 'ONG A',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('disponivel');
    expect(res.body.ong).toBeNull();
  });

  it('não grava a doação recusada', async () => {
    await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa' });

    const res = await request(app).get('/api/doacoes/todas');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('devolve lista vazia quando não há doações', async () => {
    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('lista as doações na ordem em que foram publicadas', async () => {
    await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' });
    await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Feijão', quantidade: '3 kg', validade: '2026-10-15' });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].tipo).toBe('Sopa');
    expect(res.body[1].tipo).toBe('Feijão');
  });
});

describe('aceitar uma doação', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  afterAll(async () => {
    await encerrar();
  });

  async function publicar() {
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Pão', quantidade: '20 unidades', validade: '2026-08-02' });
    return res.body;
  }

  it('marca a doação como aceita pela ONG', async () => {
    const doacao = await publicar();

    const res = await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('aceita');
    expect(res.body.ong).toBe('ONG Esperança');
  });

  it('remove a doação da lista de disponíveis depois de aceita', async () => {
    const doacao = await publicar();

    await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
    const doacao = await publicar();

    await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'ONG A' });

    const res = await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'ONG B' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/já foi aceita/i);
  });

  it('mostra a doação aceita no acompanhamento com status aceita', async () => {
    const doacao = await publicar();

    await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    const res = await request(app).get('/api/doacoes/todas');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(doacao.id);
    expect(res.body[0].status).toBe('aceita');
  });

  it('mantém tipo, quantidade e validade depois de aceita', async () => {
    const doacao = await publicar();

    const res = await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    expect(res.status).toBe(200);
    expect(res.body.tipo).toBe('Pão');
    expect(res.body.quantidade).toBe('20 unidades');
    expect(res.body.validade).toBe('2026-08-02');
  });

  it('mostra disponíveis e aceitas juntas no acompanhamento', async () => {
    const aceita = await publicar();
    const disponivel = await publicar();

    await request(app)
      .post(`/api/doacoes/${aceita.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    const res = await request(app).get('/api/doacoes/todas');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].id).toBe(aceita.id);
    expect(res.body[0].status).toBe('aceita');
    expect(res.body[1].id).toBe(disponivel.id);
    expect(res.body[1].status).toBe('disponivel');
  });

  it('recusa aceitar uma doação que não existe', async () => {
    const res = await request(app)
      .post('/api/doacoes/9999/aceitar')
      .send({ ong: 'ONG Esperança' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/não encontrada/i);
  });

  it('recusa aceitar com um id que não é número', async () => {
    const res = await request(app)
      .post('/api/doacoes/abc/aceitar')
      .send({ ong: 'ONG Esperança' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/não encontrada/i);
  });

  it('recusa aceitar sem informar a ONG', async () => {
    const doacao = await publicar();

    const res = await request(app)
      .post(`/api/doacoes/${doacao.id}/aceitar`)
      .send({ ong: '' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/ong é obrigat/i);
  });

  it('mantém as outras doações disponíveis depois de aceitar uma', async () => {
    const primeira = await publicar();
    const segunda = await publicar();

    await request(app)
      .post(`/api/doacoes/${primeira.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(segunda.id);
    expect(res.body[0].status).toBe('disponivel');
  });
});
