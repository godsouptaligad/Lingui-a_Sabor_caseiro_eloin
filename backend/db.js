const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { GRADIENTES, DEMO_PRODUTOS } = require('./constants');
const { uid } = require('./utils');

const CAMINHO_DB = path.join(__dirname, 'dados.sqlite');

function initDb() {
  const db = new DatabaseSync(CAMINHO_DB);

  db.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      cat TEXT NOT NULL,
      preco REAL NOT NULL,
      unidade TEXT NOT NULL,
      descricao TEXT,
      emoji TEXT,
      img TEXT,
      grad TEXT,
      ativo INTEGER NOT NULL DEFAULT 1,
      demo INTEGER NOT NULL DEFAULT 0,
      criado_em INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id TEXT PRIMARY KEY,
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      fone TEXT NOT NULL,
      modo TEXT NOT NULL,
      endereco TEXT,
      obs TEXT,
      itens TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'novo',
      criado_em INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      hash TEXT NOT NULL,
      zap TEXT NOT NULL DEFAULT '',
      criado_em INTEGER NOT NULL
    );
  `);

  semearDemo(db);
  return db;
}

function semearDemo(db) {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM produtos').get();
  if (n > 0) return;

  const inserir = db.prepare(`
    INSERT INTO produtos (id, nome, cat, preco, unidade, descricao, emoji, img, grad, ativo, demo, criado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, 1, 1, ?)
  `);

  DEMO_PRODUTOS.forEach((d, i) => {
    inserir.run(uid(), d.nome, d.cat, d.preco, d.unidade, d.desc, d.emoji, GRADIENTES[i % GRADIENTES.length], Date.now() + i);
  });
}

module.exports = { initDb };
