import express from 'express';
import * as doacoes from './doacoes.js';

function tratarErros(handler, statusDoErro = () => 400) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (erro) {
      res.status(statusDoErro(erro)).json({ erro: erro.message });
    }
  };
}

export function criarApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static('public'));

  // Verificação de saúde: usada pelo CI para provar que a aplicação sobe.
  app.get('/api/saude', (req, res) => res.json({ ok: true }));

  app.get('/api/doacoes', tratarErros(async (req, res) => {
    res.json(await doacoes.listarDisponiveis());
  }));

  app.get('/api/doacoes/todas', tratarErros(async (req, res) => {
    res.json(await doacoes.listarTodas());
  }));

  app.get('/api/doacoes/:id', tratarErros(async (req, res) => {
    // Aplica a Regra 1 antes de ler, como as listagens: o status devolvido já sai atualizado.
    await doacoes.expirarVencidas();
    const doacao = await doacoes.buscarPorId(req.params.id);
    if (!doacao) return res.status(404).json({ erro: 'doação não encontrada' });
    res.json(doacao);
  }));

  app.post('/api/doacoes/expirar', tratarErros(async (req, res) => {
    const expiradas = await doacoes.expirarVencidas();
    res.json({ expiradas });
  }));

  app.post('/api/doacoes', tratarErros(async (req, res) => {
    res.status(201).json(await doacoes.criarDoacao(req.body));
  }));

  app.post('/api/doacoes/:id/aceitar', tratarErros(async (req, res) => {
    res.json(await doacoes.aceitar(req.params.id, req.body?.ong ?? 'ONG'));
  }));

  app.post('/api/doacoes/:id/retirar', tratarErros(
    async (req, res) => {
      res.json(await doacoes.confirmarRetirada(req.params.id, req.body?.ong));
    },
    erro => erro.status === 404 ? 404 : 400,
  ));

  return app;
}
