const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAdmin } = require('../middleware/auth');
const { uid } = require('../utils');
const { CATEGORIAS, UNIDADES, GRADIENTES } = require('../constants');

const PASTA_UPLOADS = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(PASTA_UPLOADS, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: PASTA_UPLOADS,
    filename: (req, file, cb) => cb(null, uid() + path.extname(file.originalname || '').toLowerCase())
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype))
});

function mapProduto(r) {
  return {
    id: r.id, nome: r.nome, cat: r.cat, preco: r.preco, unidade: r.unidade,
    desc: r.descricao, emoji: r.emoji, img: r.img, grad: r.grad,
    ativo: !!r.ativo, demo: !!r.demo, criadoEm: r.criado_em
  };
}

function validarCorpo(body) {
  const nome = String(body.nome || '').trim();
  const preco = Number(String(body.preco || '').replace(',', '.'));
  const unidade = String(body.unidade || '').trim();
  const cat = String(body.cat || '').trim();
  const desc = String(body.desc || '').trim().slice(0, 180);
  const emoji = String(body.emoji || '🥩').trim().slice(0, 8);
  const ativo = body.ativo === '1' || body.ativo === true || body.ativo === 'true';

  if (nome.length < 2) return { erro: 'Dê um nome ao produto.' };
  if (!(preco > 0)) return { erro: 'Informe um preço válido (ex: 49,90).' };
  if (!CATEGORIAS.includes(cat)) return { erro: 'Categoria inválida.' };
  if (!UNIDADES.includes(unidade)) return { erro: 'Unidade inválida.' };

  return { nome, preco: Math.round(preco * 100) / 100, unidade, cat, desc, emoji, ativo };
}

function apagarArquivo(imgPath) {
  if (!imgPath) return;
  try {
    const nomeArquivo = path.basename(imgPath);
    const caminho = path.join(PASTA_UPLOADS, nomeArquivo);
    if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
  } catch (e) { /* arquivo já pode não existir */ }
}

module.exports = function produtosRouter(db) {
  const router = express.Router();

  router.get('/produtos', (req, res) => {
    const linhas = db.prepare('SELECT * FROM produtos WHERE ativo = 1 ORDER BY criado_em ASC').all();
    res.json(linhas.map(mapProduto));
  });

  router.get('/admin/produtos', requireAdmin, (req, res) => {
    const linhas = db.prepare('SELECT * FROM produtos ORDER BY criado_em ASC').all();
    res.json(linhas.map(mapProduto));
  });

  router.post('/admin/produtos', requireAdmin, upload.single('foto'), (req, res) => {
    const d = validarCorpo(req.body);
    if (d.erro) return res.status(400).json({ erro: d.erro });

    const id = uid();
    const img = req.file ? '/uploads/' + req.file.filename : null;
    const grad = GRADIENTES[Math.floor(Math.random() * GRADIENTES.length)];

    db.prepare(`
      INSERT INTO produtos (id, nome, cat, preco, unidade, descricao, emoji, img, grad, ativo, demo, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, d.nome, d.cat, d.preco, d.unidade, d.desc, d.emoji, img, grad, d.ativo ? 1 : 0, Date.now());

    res.json(mapProduto(db.prepare('SELECT * FROM produtos WHERE id = ?').get(id)));
  });

  router.delete('/admin/produtos/demo', requireAdmin, (req, res) => {
    const demos = db.prepare('SELECT * FROM produtos WHERE demo = 1').all();
    demos.forEach(p => apagarArquivo(p.img));
    db.prepare('DELETE FROM produtos WHERE demo = 1').run();
    res.json({ ok: true, removidos: demos.length });
  });

  router.put('/admin/produtos/:id', requireAdmin, upload.single('foto'), (req, res) => {
    const anterior = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
    if (!anterior) return res.status(404).json({ erro: 'Produto não encontrado.' });

    const d = validarCorpo(req.body);
    if (d.erro) return res.status(400).json({ erro: d.erro });

    let img = anterior.img;
    if (req.file) {
      apagarArquivo(anterior.img);
      img = '/uploads/' + req.file.filename;
    } else if (req.body.removerFoto === '1') {
      apagarArquivo(anterior.img);
      img = null;
    }

    db.prepare(`
      UPDATE produtos SET nome = ?, cat = ?, preco = ?, unidade = ?, descricao = ?, emoji = ?, img = ?, ativo = ?
      WHERE id = ?
    `).run(d.nome, d.cat, d.preco, d.unidade, d.desc, d.emoji, img, d.ativo ? 1 : 0, req.params.id);

    res.json(mapProduto(db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id)));
  });

  router.delete('/admin/produtos/:id', requireAdmin, (req, res) => {
    const p = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
    if (!p) return res.status(404).json({ erro: 'Produto não encontrado.' });

    apagarArquivo(p.img);
    db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  return router;
};
