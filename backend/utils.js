function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 5);
}

function gerarCodigoPedido() {
  const letras = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 4; i++) c += letras[Math.floor(Math.random() * letras.length)];
  return 'PD-' + c;
}

module.exports = { uid, gerarCodigoPedido };
