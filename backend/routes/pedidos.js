const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { uid, gerarCodigoPedido } = require('../utils');
const { STATUS_PEDIDO } = require('../constants');

function mapPedido(r) {
  return {
    id: r.id, codigo: r.codigo, nome: r.nome, fone: r.fone, modo: r.modo,
    end: r.endereco, obs: r.obs, itens: JSON.parse(r.itens), total: r.total,
    status: r.status, criadoEm: r.criado_em
  };
}

module.exports = function pedidosRouter(db) {
  const router = express.Router();

  router.post('/pedidos', (req, res) => {
    const { nome, fone, modo, endereco, obs, itens } = req.body || {};
    const nomeOk = String(nome || '').trim();
    const foneOk = String(fone || '').replace(/\D/g, '');
    const modoOk = modo === 'entrega' ? 'entrega' : 'retirada';
    const enderecoOk = String(endereco || '').trim();

    if (nomeOk.length < 2) return res.status(400).json({ erro: 'Conta pra gente seu nome 🙂' });
    if (foneOk.length < 10) return res.status(400).json({ erro: 'Precisamos de um telefone válido com DDD para falar com você.' });
    if (modoOk === 'entrega' && enderecoOk.length < 6) return res.status(400).json({ erro: 'Informe o endereço para a entrega.' });
    if (!Array.isArray(itens) || !itens.length) return res.status(400).json({ erro: 'Sua bolsa está vazia.' });

    // recalcula os preços a partir do banco — nunca confia no valor enviado pelo cliente
    const itensValidados = [];
    for (const it of itens) {
      const p = db.prepare('SELECT * FROM produtos WHERE id = ? AND ativo = 1').get(it && it.id);
      if (!p) continue;
      const qtd = Math.min(99, Math.max(1, Math.round(Number(it.qtd)) || 1));
      itensValidados.push({ id: p.id, nome: p.nome, unidade: p.unidade, preco: p.preco, qtd });
    }
    if (!itensValidados.length) return res.status(400).json({ erro: 'Os itens da bolsa não estão mais disponíveis.' });

    const total = Math.round(itensValidados.reduce((t, i) => t + i.preco * i.qtd, 0) * 100) / 100;
    const pedido = {
      id: uid(),
      codigo: gerarCodigoPedido(),
      nome: nomeOk,
      fone: foneOk,
      modo: modoOk,
      end: modoOk === 'entrega' ? enderecoOk : '',
      obs: String(obs || '').trim().slice(0, 300),
      itens: itensValidados,
      total,
      status: 'novo',
      criadoEm: Date.now()
    };

    db.prepare(`
      INSERT INTO pedidos (id, codigo, nome, fone, modo, endereco, obs, itens, total, status, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(pedido.id, pedido.codigo, pedido.nome, pedido.fone, pedido.modo, pedido.end, pedido.obs,
      JSON.stringify(pedido.itens), pedido.total, pedido.status, pedido.criadoEm);

    res.json(pedido);
  });

  router.get('/admin/pedidos', requireAdmin, (req, res) => {
    const linhas = db.prepare('SELECT * FROM pedidos ORDER BY criado_em DESC').all();
    res.json(linhas.map(mapPedido));
  });

  router.patch('/admin/pedidos/:id/status', requireAdmin, (req, res) => {
    const { status } = req.body || {};
    if (!STATUS_PEDIDO.includes(status)) return res.status(400).json({ erro: 'Status inválido.' });

    const p = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(req.params.id);
    if (!p) return res.status(404).json({ erro: 'Pedido não encontrado.' });

    db.prepare('UPDATE pedidos SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json(mapPedido(db.prepare('SELECT * FROM pedidos WHERE id = ?').get(req.params.id)));
  });

  return router;
};
