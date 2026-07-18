const express = require('express');
const { requireAdmin } = require('../middleware/auth');

module.exports = function configRouter(db) {
  const router = express.Router();

  router.get('/config', (req, res) => {
    const cfg = db.prepare('SELECT zap FROM config WHERE id = 1').get();
    res.json({ zap: cfg ? cfg.zap : '' });
  });

  router.post('/admin/config/zap', requireAdmin, (req, res) => {
    const zap = String((req.body || {}).zap || '').replace(/\D/g, '');
    if (zap && zap.length < 10) return res.status(400).json({ erro: 'Número incompleto — confira o DDD.' });

    db.prepare('UPDATE config SET zap = ? WHERE id = 1').run(zap);
    res.json({ ok: true, zap });
  });

  return router;
};
