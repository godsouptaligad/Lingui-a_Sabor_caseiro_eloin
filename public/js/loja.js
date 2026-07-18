/* ================================================================
   LOJA — vitrine, bolsa (carrinho) e checkout
   ================================================================ */

const estado = {
  produtos: [],
  bolsa: {},          // id -> quantidade (guardado no localStorage do navegador)
  filtro: 'Tudo',
  busca: '',
  cfg: { zap: '' }
};

/* ---------- carregar dados da API ---------- */
async function carregarProdutos() {
  try { estado.produtos = await Api.produtos.listar(); }
  catch (e) { estado.produtos = []; }
}
async function carregarConfigPublica() {
  try { estado.cfg = await Api.config.publica(); }
  catch (e) { estado.cfg = { zap: '' }; }
  atualizarRodape();
}
function atualizarRodape() {
  const el = $('#peContato');
  if (estado.cfg && estado.cfg.zap) {
    el.innerHTML = `📱 Atendimento: <b>${esc(maskFone(estado.cfg.zap))}</b>`;
  } else { el.textContent = ''; }
}

/* ---------- vitrine ---------- */
function fotoHTML(p, cls = 'emoji') {
  if (p.img) return `<img src="${p.img}" alt="${esc(p.nome)}" loading="lazy">`;
  return `<span class="${cls}">${esc(p.emoji || '🥩')}</span>`;
}
function renderChips() {
  const catsComProduto = CATEGORIAS.filter(c => estado.produtos.some(p => p.ativo && p.cat === c));
  const todas = ['Tudo', ...catsComProduto];
  $('#chips').innerHTML = todas.map(c =>
    `<button class="chip ${estado.filtro === c ? 'ativa' : ''}" onclick="filtrar('${esc(c)}')">${esc(c)}</button>`
  ).join('');
}
function filtrar(c) { estado.filtro = c; renderChips(); renderGrade(); }
function renderGrade() {
  const g = $('#grade');
  const termo = estado.busca.trim().toLowerCase();
  const vis = estado.produtos.filter(p =>
    p.ativo &&
    (estado.filtro === 'Tudo' || p.cat === estado.filtro) &&
    (!termo || (p.nome + ' ' + (p.desc || '')).toLowerCase().includes(termo))
  );
  if (!vis.length) {
    g.innerHTML = `<div class="vazio"><span class="ico">🍽️</span>${
      estado.produtos.some(p => p.ativo)
        ? 'Nenhum corte encontrado com esse filtro. Tente outra busca!'
        : 'O catálogo ainda está sendo montado. Volte em breve! 🔥'
    }</div>`;
    return;
  }
  g.innerHTML = vis.map((p, i) => `
    <article class="card" data-reveal style="transition-delay:${Math.min(i * 0.05, .4)}s" id="card-${p.id}">
      <div class="foto" style="${p.img ? '' : 'background:' + (p.grad || 'linear-gradient(140deg,#55261a,#8f4a26)')}">
        <span class="etiqueta"><small>R$ / ${esc(p.unidade)}</small>${money(p.preco).replace('R$', '').trim()}</span>
        ${fotoHTML(p)}
      </div>
      <div class="info">
        <span class="cat-tag">${esc(p.cat)}</span>
        <h3>${esc(p.nome)}</h3>
        <p class="desc">${esc(p.desc || '')}</p>
        <div class="acao">
          <div class="stepper">
            <button onclick="mudarQtd('${p.id}',-1)" aria-label="Diminuir">−</button>
            <span class="qtd" id="qtd-${p.id}">1</span>
            <button onclick="mudarQtd('${p.id}',1)" aria-label="Aumentar">＋</button>
          </div>
          <button class="btn-add" onclick="addBolsa('${p.id}', this)">🛍️ Adicionar</button>
        </div>
      </div>
    </article>
  `).join('');
  observarReveals();
}
const qtdTemp = {};
function mudarQtd(id, d) {
  qtdTemp[id] = Math.min(99, Math.max(1, (qtdTemp[id] || 1) + d));
  const el = $('#qtd-' + id); if (el) el.textContent = qtdTemp[id];
}

/* ---------- bolsa (carrinho no navegador) ---------- */
function salvarBolsa() {
  try { localStorage.setItem('bolsa-atual', JSON.stringify(estado.bolsa)); } catch (e) {}
}
function carregarBolsa() {
  try { estado.bolsa = JSON.parse(localStorage.getItem('bolsa-atual')) || {}; }
  catch (e) { estado.bolsa = {}; }
}
function totalBolsa() {
  return Object.entries(estado.bolsa).reduce((t, [id, q]) => {
    const p = estado.produtos.find(x => x.id === id);
    return t + (p ? p.preco * q : 0);
  }, 0);
}
function contarItens() { return Object.values(estado.bolsa).reduce((a, b) => a + b, 0); }

function addBolsa(id, botao) {
  const q = qtdTemp[id] || 1;
  estado.bolsa[id] = (estado.bolsa[id] || 0) + q;
  qtdTemp[id] = 1; const qe = $('#qtd-' + id); if (qe) qe.textContent = '1';
  salvarBolsa(); atualizarFab(); renderBolsa();
  const p = estado.produtos.find(x => x.id === id);
  voarParaBolsa(botao, p);
  toast(`${p ? p.nome : 'Item'} na bolsa!`, '🛍️');
}
function voarParaBolsa(origem, p) {
  try {
    const fab = $('#bolsaFab');
    const a = origem.getBoundingClientRect(), b = fab.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'voador';
    el.innerHTML = p && p.img ? `<img src="${p.img}" alt="">` : (p ? p.emoji || '🥩' : '🥩');
    el.style.left = a.left + a.width / 2 - 26 + 'px';
    el.style.top = a.top + 'px';
    document.body.appendChild(el);
    const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
    const dy = (b.top + b.height / 2) - a.top;
    el.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 90}px) scale(.9) rotate(-14deg)`, opacity: 1, offset: .5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.15) rotate(20deg)`, opacity: .4 }
    ], { duration: 750, easing: 'cubic-bezier(.3,.7,.4,1)' }).onfinish = () => {
      el.remove();
      fab.classList.remove('pulsa'); void fab.offsetWidth; fab.classList.add('pulsa');
    };
  } catch (e) {}
}
function atualizarFab() {
  const n = contarItens();
  $('#bolsaCont').textContent = n;
}
function renderBolsa() {
  const box = $('#bolsaItens');
  const ids = Object.keys(estado.bolsa).filter(id => estado.bolsa[id] > 0);
  if (!ids.length) {
    box.innerHTML = `<div class="bolsa-vazia"><span class="ico">🛍️</span>Sua bolsa está vazia.<br>Escolha uns cortes bons aí! 🥩</div>`;
    $('#gavetaPe').style.display = 'none';
    return;
  }
  $('#gavetaPe').style.display = 'block';
  box.innerHTML = ids.map(id => {
    const p = estado.produtos.find(x => x.id === id);
    if (!p) return '';
    const q = estado.bolsa[id];
    return `<div class="item-bolsa">
      <div class="thumb" style="${p.img ? '' : 'background:' + (p.grad || '#4a2a1a')}">${fotoHTML(p, '')}</div>
      <div class="meio">
        <div class="nm">${esc(p.nome)}</div>
        <div class="pr">${money(p.preco)} / ${esc(p.unidade)}</div>
        <button class="tira-item" onclick="tirarDaBolsa('${p.id}')">remover</button>
      </div>
      <div class="dir">
        <div class="total-lin">${money(p.preco * q)}</div>
        <div class="stepper">
          <button onclick="qtdBolsa('${p.id}',-1)" aria-label="Diminuir">−</button>
          <span class="qtd">${q}</span>
          <button onclick="qtdBolsa('${p.id}',1)" aria-label="Aumentar">＋</button>
        </div>
      </div>
    </div>`;
  }).join('');
  $('#bolsaTotal').textContent = money(totalBolsa());
}
function qtdBolsa(id, d) {
  estado.bolsa[id] = (estado.bolsa[id] || 0) + d;
  if (estado.bolsa[id] <= 0) delete estado.bolsa[id];
  salvarBolsa(); atualizarFab(); renderBolsa();
}
function tirarDaBolsa(id) {
  delete estado.bolsa[id];
  salvarBolsa(); atualizarFab(); renderBolsa();
}
function abrirBolsa() {
  renderBolsa();
  $('#veu').classList.add('aberto');
  $('#gaveta').classList.add('aberta');
  document.body.style.overflow = 'hidden';
}
function fecharTudo() {
  $('#veu').classList.remove('aberto');
  $('#gaveta').classList.remove('aberta');
  document.body.style.overflow = '';
}

/* ---------- checkout ---------- */
function abrirCheckout() {
  if (!contarItens()) return;
  fecharTudo();
  $('#resumoItens').textContent = contarItens() + (contarItens() === 1 ? ' item' : ' itens');
  $('#resumoTotal').textContent = money(totalBolsa());
  // pré-preencher com dados do último pedido deste cliente
  try {
    const d = JSON.parse(localStorage.getItem('cliente-info'));
    if (d) {
      if (!$('#pedNome').value) $('#pedNome').value = d.nome || '';
      if (!$('#pedFone').value) $('#pedFone').value = d.fone || '';
    }
  } catch (e) {}
  abrirModal('modalCheckout');
}
function abrirModal(id) { $('#' + id).classList.add('aberto'); document.body.style.overflow = 'hidden'; }
function fecharModal(id) { $('#' + id).classList.remove('aberto'); document.body.style.overflow = ''; }

async function enviarPedido() {
  const nome = $('#pedNome').value.trim();
  const fone = $('#pedFone').value.replace(/\D/g, '');
  const modo = document.querySelector('input[name="entrega"]:checked').value;
  const end = $('#pedEnd').value.trim();
  const obs = $('#pedObs').value.trim();
  const erro = $('#erroCheckout');
  erro.textContent = '';
  $('#cNome').classList.remove('erro'); $('#cFone').classList.remove('erro'); $('#cEnd').classList.remove('erro');

  if (nome.length < 2) { erro.textContent = 'Conta pra gente seu nome 🙂'; $('#cNome').classList.add('erro'); return; }
  if (fone.length < 10) { erro.textContent = 'Precisamos de um telefone válido com DDD para falar com você.'; $('#cFone').classList.add('erro'); return; }
  if (modo === 'entrega' && end.length < 6) { erro.textContent = 'Informe o endereço para a entrega.'; $('#cEnd').classList.add('erro'); return; }
  if (!contarItens()) { erro.textContent = 'Sua bolsa esvaziou — adicione itens de novo.'; return; }

  const btn = $('#btnEnviar');
  btn.disabled = true; btn.textContent = 'Enviando...';

  const itens = Object.entries(estado.bolsa).map(([id, qtd]) => ({ id, qtd }));

  try {
    const pedido = await Api.pedidos.enviar({ nome, fone, modo, endereco: end, obs, itens });
    localStorage.setItem('cliente-info', JSON.stringify({ nome, fone: $('#pedFone').value }));
    estado.bolsa = {}; salvarBolsa(); atualizarFab(); renderBolsa();
    fecharModal('modalCheckout');
    mostrarSucesso(pedido);
  } catch (e) {
    erro.textContent = e.message;
  } finally {
    btn.disabled = false; btn.textContent = '🔥 Enviar pedido';
  }
}

function mostrarSucesso(p) {
  $('#sucCod').textContent = '#' + p.codigo;
  $('#sucNome').textContent = p.nome.split(' ')[0];
  const zapBtn = $('#btnZap');
  if (estado.cfg && estado.cfg.zap) {
    const linhas = p.itens.map(i => `• ${i.qtd}x ${i.nome} (${i.unidade})`).join('%0A');
    const txt = `Olá! Acabei de fazer o pedido *%23${p.codigo}* no site 🥩%0A%0A${linhas}%0A%0ATotal: ${encodeURIComponent(money(p.total))}%0ANome: ${encodeURIComponent(p.nome)}%0A${p.modo === 'entrega' ? 'Entrega: ' + encodeURIComponent(p.end) : 'Vou retirar aí!'}`;
    zapBtn.href = `https://wa.me/55${estado.cfg.zap}?text=${txt}`;
    zapBtn.style.display = 'inline-flex';
  } else zapBtn.style.display = 'none';
  // reinicia a animação do check
  const svg = document.querySelector('.circ-check');
  const clone = svg.cloneNode(true); svg.replaceWith(clone);
  $('#telaSucesso').classList.add('aberto');
  document.body.style.overflow = 'hidden';
}
function voltarLoja() {
  $('#telaSucesso').classList.remove('aberto');
  document.body.style.overflow = '';
}
