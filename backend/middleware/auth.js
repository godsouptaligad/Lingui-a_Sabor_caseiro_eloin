function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ erro: 'Não autenticado.' });
}

module.exports = { requireAdmin };
