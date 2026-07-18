const express = require('express');
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../middleware/auth');

const NOVENTA_DIAS = 1000 * 60 * 60 * 24 * 90;

module.exports = function authRouter(db) {
  const router = express.Router();

  const getConfig = () => db.prepare('SELECT * FROM config WHERE id = 1').get();

  router.get('/status', (req, res) => {
    const cfg = getConfig();
    res.json({ existeAdmin: !!cfg, logado: !!(req.session && req.session.admin) });
  });

  router.post('/setup', async (req, res) => {
    const { senha } = req.body || {};
    if (getConfig()) return res.status(409).json({ erro: 'Administrador já configurado.' });
    if (!senha || String(senha).length < 6) return res.status(400).json({ erro: 'Use pelo menos 6 caracteres.' });

    const hash = await bcrypt.hash(String(senha), 10);
    db.prepare('INSERT INTO config (id, hash, zap, criado_em) VALUES (1, ?, ?, ?)').run(hash, '', Date.now());
    req.session.admin = true;
    res.json({ ok: true });
  });

  router.post('/login', async (req, res) => {
    const { senha, lembrar } = req.body || {};
    const cfg = getConfig();
    if (!cfg) return res.status(400).json({ erro: 'Administrador ainda não configurado.' });

    const ok = await bcrypt.compare(String(senha || ''), cfg.hash);
    if (!ok) return res.status(401).json({ erro: 'Senha incorreta.' });

    req.session.admin = true;
    if (lembrar) req.session.cookie.maxAge = NOVENTA_DIAS;
    res.json({ ok: true });
  });

  router.post('/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  router.post('/trocar-senha', requireAdmin, async (req, res) => {
    const { senhaAtual, novaSenha } = req.body || {};
    const cfg = getConfig();

    const ok = await bcrypt.compare(String(senhaAtual || ''), cfg.hash);
    if (!ok) return res.status(401).json({ erro: 'Senha atual incorreta.' });
    if (!novaSenha || String(novaSenha).length < 6) {
      return res.status(400).json({ erro: 'A nova senha precisa de pelo menos 6 caracteres.' });
    }

    const hash = await bcrypt.hash(String(novaSenha), 10);
    db.prepare('UPDATE config SET hash = ? WHERE id = 1').run(hash);
    res.json({ ok: true });
  });

  return router;
};
