import { describe, it, expect, beforeEach, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';
import * as repositorio from '../src/repositorio.js';
import { buscarPorId, expirarVencidas } from '../src/doacoes.js';

const app = criarApp();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-08-01T15:00:00Z'));
});
afterEach(() => vi.useRealTimers());

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

  it('recusa data passada sem gravar no banco', async () => {
    const res = await request(app).post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '2 porções', validade: '2026-07-31' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/hoje ou uma data futura/);
    expect((await request(app).get('/api/doacoes/todas')).body).toEqual([]);
  });

  it.each(['2026-02-30', '2026-13-01', '01/08/2026', 'inválida', 123, {}])('recusa validade inválida: %j', async validade => {
    const res = await request(app).post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '2 porções', validade });
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/data de validade válida/);
  });

  it('aceita hoje no fuso de São Paulo mesmo quando UTC já mudou de dia', async () => {
    vi.setSystemTime(new Date('2026-08-02T01:00:00Z'));
    const res = await request(app).post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '2 porções', validade: '2026-08-01' });
    expect(res.status).toBe(201);
  });

  it('recusa ontem após a meia-noite de São Paulo', async () => {
    vi.setSystemTime(new Date('2026-08-02T03:00:00Z'));
    const res = await request(app).post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '2 porções', validade: '2026-08-01' });
    expect(res.status).toBe(400);
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

  it('persiste a janela de coleta informada pelo doador', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .send({
        tipo: 'Arroz',
        quantidade: '5 kg',
        validade: '2026-09-10',
        janela_inicio: '2026-08-01T14:00:00.000Z',
        janela_fim: '2026-08-01T16:00:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.janela_inicio).toBe('2026-08-01T14:00:00.000Z');
    expect(res.body.janela_fim).toBe('2026-08-01T16:00:00.000Z');
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

  it('expira disponíveis às 22h de São Paulo e preserva aceitas e futuras', async () => {
    vi.setSystemTime(new Date('2026-07-31T15:00:00Z'));
    const publicar = async validade => {
      const res = await request(app)
        .post('/api/doacoes')
        .send({ tipo: 'Sopa', quantidade: '2 porções', validade });
      return res.body;
    };

    const vencida = await publicar('2026-08-01');
    const futura = await publicar('2026-08-02');
    const aceita = await publicar('2026-08-01');
    await request(app)
      .post(`/api/doacoes/${aceita.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    vi.setSystemTime(new Date('2026-08-02T00:59:59Z'));
    expect(await expirarVencidas()).toEqual([]);

    vi.setSystemTime(new Date('2026-08-02T01:00:00Z'));
    const expiradas = await expirarVencidas();

    expect(expiradas.map(doacao => doacao.id)).toEqual([vencida.id]);
    expect((await buscarPorId(vencida.id)).status).toBe('expirada');
    expect((await buscarPorId(futura.id)).status).toBe('disponivel');
    expect((await buscarPorId(aceita.id)).status).toBe('aceita');
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

  it('recusa aceitar antes do início da janela de coleta', async () => {
    const resCriacao = await request(app)
      .post('/api/doacoes')
      .send({
        tipo: 'Pão',
        quantidade: '20 unidades',
        validade: '2026-08-02',
        janela_inicio: '2026-08-01T16:00:00.000Z',
        janela_fim: '2026-08-01T17:00:00.000Z',
      });

    const resAceite = await request(app)
      .post(`/api/doacoes/${resCriacao.body.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    expect(resAceite.status).toBe(400);
    expect(resAceite.body.erro).toMatch(/fora da janela de coleta/);
  });

  it('aceita dentro da janela de coleta', async () => {
    const resCriacao = await request(app)
      .post('/api/doacoes')
      .send({
        tipo: 'Pão',
        quantidade: '20 unidades',
        validade: '2026-08-02',
        janela_inicio: '2026-08-01T14:00:00.000Z',
        janela_fim: '2026-08-01T16:00:00.000Z',
      });

    const resAceite = await request(app)
      .post(`/api/doacoes/${resCriacao.body.id}/aceitar`)
      .send({ ong: 'ONG Esperança' });

    expect(resAceite.status).toBe(200);
    expect(resAceite.body.status).toBe('aceita');
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

describe('expirar doações vencidas', () => {
  beforeEach(async () => {
    await migrar();
    await limparBanco();
  });

  afterAll(async () => {
    await encerrar();
  });

  it('marca como expirada uma doação disponível com validade passada', async () => {
    const doacao = await repositorio.inserir({
      tipo: 'Arroz',
      quantidade: '5kg',
      validade: '2020-01-01',
    });

    const expiradas = await repositorio.expirarVencidas();
    const atualizada = await repositorio.buscarPorId(doacao.id);

    expect(expiradas).toHaveLength(1);
    expect(expiradas[0].id).toBe(doacao.id);
    expect(atualizada.status).toBe('expirada');
  });

  it('expira ao atualizar as listas a partir das 22h de São Paulo', async () => {
    const criada = await request(app).post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '5L', validade: '2026-08-01' });
    expect(criada.status).toBe(201);

    vi.setSystemTime(new Date('2026-08-02T00:59:59Z'));
    const antes = await request(app).get('/api/doacoes');
    expect(antes.status).toBe(200);
    expect(antes.body.map(doacao => doacao.id)).toContain(criada.body.id);

    vi.setSystemTime(new Date('2026-08-02T01:00:00Z'));
    const acompanhamento = await request(app).get('/api/doacoes/todas');
    expect(acompanhamento.status).toBe(200);
    expect(acompanhamento.body.find(doacao => doacao.id === criada.body.id).status).toBe('expirada');
    const disponiveis = await request(app).get('/api/doacoes');
    expect(disponiveis.status).toBe(200);
    expect(disponiveis.body).toHaveLength(0);
  });

  it('a lista de disponíveis expira vencidas e preserva aceitas e futuras', async () => {
    const publicar = async validade => {
      const res = await request(app).post('/api/doacoes')
        .send({ tipo: 'Sopa', quantidade: '5L', validade });
      expect(res.status).toBe(201);
      return res.body;
    };
    const vencida = await publicar('2026-08-01');
    const futura = await publicar('2026-08-02');
    const aceita = await publicar('2026-08-01');
    const aceite = await request(app).post(`/api/doacoes/${aceita.id}/aceitar`).send({ ong: 'ONG A' });
    expect(aceite.status).toBe(200);

    vi.setSystemTime(new Date('2026-08-02T01:00:00Z'));
    const lista = await request(app).get('/api/doacoes');
    expect(lista.status).toBe(200);
    expect(lista.body.map(doacao => doacao.id)).toEqual([futura.id]);
    expect((await repositorio.buscarPorId(vencida.id)).status).toBe('expirada');
    expect((await repositorio.buscarPorId(aceita.id)).status).toBe('aceita');
    expect(await repositorio.expirarVencidas()).toEqual([]);
  });
});
