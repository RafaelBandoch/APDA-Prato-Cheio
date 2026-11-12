import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const repositorio = vi.hoisted(() => ({
  inserir: vi.fn(),
  listarDisponiveis: vi.fn(),
  listarTodas: vi.fn(),
  buscarPorId: vi.fn(),
  aceitar: vi.fn(),
  confirmarRetirada: vi.fn(),
  expirarVencidas: vi.fn(),
}));

vi.mock('../src/repositorio.js', () => repositorio);

import { aceitar, criarDoacao } from '../src/doacoes.js';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-01T15:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('validação da criação de doações', () => {
  it('recusa uma validade inválida antes de persistir', async () => {
    await expect(criarDoacao({
      tipo: 'Sopa',
      quantidade: '10 porções',
      validade: '2026-02-30',
    })).rejects.toThrow('Informe uma data de validade válida no formato AAAA-MM-DD');

    expect(repositorio.inserir).not.toHaveBeenCalled();
  });

  it('considera o dia atual no fuso de São Paulo', async () => {
    vi.setSystemTime(new Date('2026-08-02T01:00:00.000Z'));
    repositorio.inserir.mockResolvedValue({ tipo: 'Sopa' });

    await expect(criarDoacao({
      tipo: 'Sopa',
      quantidade: '10 porções',
      validade: '2026-08-01',
    })).resolves.toEqual({ tipo: 'Sopa' });
  });

  it('recusa uma janela inválida ou invertida antes de persistir', async () => {
    const dados = {
      tipo: 'Sopa',
      quantidade: '10 porções',
      validade: '2026-08-01',
    };

    await expect(criarDoacao({
      ...dados,
      janela_inicio: 'data inválida',
    })).rejects.toThrow('Informe datas válidas para a janela de coleta');
    await expect(criarDoacao({
      ...dados,
      janela_inicio: '2026-08-01T16:00:00.000Z',
      janela_fim: '2026-08-01T15:00:00.000Z',
    })).rejects.toThrow('O fim da janela de coleta deve ser depois do início');

    expect(repositorio.inserir).not.toHaveBeenCalled();
  });
});

describe('validação da janela no aceite', () => {
  it.each([
    ['início', { janela_inicio: '2026-08-01T15:00:00.000Z' }],
    ['fim', { janela_fim: '2026-08-01T15:00:00.000Z' }],
  ])('aceita no limite inclusivo quando só há %s', async (_limite, janela) => {
    const doacao = { id: 1, status: 'disponivel', ...janela };
    repositorio.expirarVencidas.mockResolvedValue([]);
    repositorio.buscarPorId.mockResolvedValue(doacao);
    repositorio.aceitar.mockResolvedValue({ ...doacao, status: 'aceita' });

    await expect(aceitar(1, 'ONG Esperança')).resolves.toMatchObject({
      status: 'aceita',
    });
    expect(repositorio.aceitar).toHaveBeenCalledWith(1, 'ONG Esperança');
  });

  it('recusa aceite antes do início sem atualizar a doação', async () => {
    repositorio.expirarVencidas.mockResolvedValue([]);
    repositorio.buscarPorId.mockResolvedValue({
      id: 1,
      status: 'disponivel',
      janela_inicio: '2026-08-01T15:00:00.001Z',
    });

    await expect(aceitar(1, 'ONG Esperança'))
      .rejects.toThrow('aceite fora da janela de coleta definida pelo doador');
    expect(repositorio.aceitar).not.toHaveBeenCalled();
  });
});
