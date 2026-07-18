const path = require('path');
const express = require('express');
const session = require('express-session');
const { initDb } = require('./db');
const authRouter = require('./routes/auth');
const produtosRouter = require('./routes/produtos');
const pedidosRouter = require('./routes/pedidos');
const configRouter = require('./routes/config');

const PORT = process.env.PORT || 3000;
const db = initDb();
const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.use(session({
  name: 'casadacarne.sid',
  secret: process.env.SESSION_SECRET || 'troque-este-segredo-em-producao',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: undefined }
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRouter(db));
app.use('/api', produtosRouter(db));
app.use('/api', pedidosRouter(db));
app.use('/api', configRouter(db));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`🔥 Casa da Carne rodando em http://localhost:${PORT}`);
});
