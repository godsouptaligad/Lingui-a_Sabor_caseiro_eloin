/* ================================================================
   ÁREA DO DONO
   ================================================================ */

const admin = {
  logado: false,
  produtos: [],
  pedidos: [],
  idsPedidosVistos: new Set(),
  timerPedidos: null
};

async function abrirPainel() {
  $('#painelDono').classList.add('aberto');
  document.body.style.overflow = 'hidden';
  $('#authCriar').style.display = 'none';
  $('#authEntrar').style.display = 'none';
  $('#adminApp').style.display = 'none';
  $('#tagConfiavel').style.display = 'none';

  let st;
  try { st = await Api.auth.status(); }
  catch (e) { toast('Não foi possível falar com o servidor agora.', '⚠️', true); return; }

  if (!st.existeAdmin) {
    $('#authCriar').style.display = 'block';
    setTimeout(() => $('#novaSenha').focus(), 150);
    return;
  }
  if (st.logado) {
    $('#tagConfiavel').style.display = 'inline-flex';
    entrarNoPainel();
    return;
  }
  $('#authEntrar').style.display = 'block';
  setTimeout(() => $('#senhaEntrar').focus(), 150);
}
function fecharPainel() {
  $('#painelDono').classList.remove('aberto');
  document.body.style.overflow = '';
  admin.logado = false;
  if (admin.timerPedidos) { clearInterval(admin.timerPedidos); admin.timerPedidos = null; }
  renderChips(); renderGrade(); atualizarRodape();
}

async function criarSenha() {
  const s1 = $('#novaSenha').value, s2 = $('#novaSenha2').value, erro = $('#erroCriar');
  erro.textContent = '';
  if (s1.length < 6) { erro.textContent = 'Use pelo menos 6 caracteres.'; return; }
  if (s1 !== s2) { erro.textContent = 'As senhas não conferem.'; return; }
  try {
    await Api.auth.setup(s1);
    $('#novaSenha').value = ''; $('#novaSenha2').value = '';
    $('#authCriar').style.display = 'none';
    $('#tagConfiavel').style.display = 'inline-flex';
    toast('Loja protegida! Você já pode cadastrar produtos.', '🛡️');
    entrarNoPainel();
  } catch (e) { erro.textContent = e.message; }
}

async function entrarAdmin() {
  const s = $('#senhaEntrar').value, erro = $('#erroEntrar');
  erro.textContent = '';
  if (!s) { erro.textContent = 'Digite a senha.'; return; }
  try {
    await Api.auth.login(s, $('#confiarDisp').checked);
    if ($('#confiarDisp').checked) $('#tagConfiavel').style.display = 'inline-flex';
    $('#senhaEntrar').value = '';
    $('#authEntrar').style.display = 'none';
    entrarNoPainel();
  } catch (e) {
    erro.textContent = e.message;
    $('#senhaEntrar').value = '';
  }
}

async function entrarNoPainel() {
  admin.logado = true;
  $('#adminApp').style.display = 'block';
  try {
    const cfg = await Api.config.publica();
    $('#cfgZap').value = cfg.zap ? maskFone(cfg.zap) : '';
  } catch (e) {}
  await carregarPedidosAdmin();
  admin.idsPedidosVistos = new Set(admin.pedidos.map(p => p.id));
  renderPedidos();
  await carregarProdutosAdmin();
  renderAdmProdutos();
  trocarAba('pedidos');
  if (admin.timerPedidos) clearInterval(admin.timerPedidos);
  admin.timerPedidos = setInterval(vigiarPedidos, 8000);
}

function trocarAba(qual) {
  $$('.aba').forEach(a => a.classList.toggle('ativa', a.dataset.aba === qual));
  $('#abaPedidos').style.display = qual === 'pedidos' ? 'block' : 'none';
  $('#abaProdutos').style.display = qual === 'produtos' ? 'block' : 'none';
  $('#abaConfig').style.display = qual === 'config' ? 'block' : 'none';
}

/* ---- pedidos (admin) ---- */
const NOMES_STATUS = { novo: '🔔 Novo', preparo: '🔥 Em preparo', pronto: '✅ Pronto', entregue: '📦 Entregue', cancelado: '✖ Cancelado' };
async function carregarPedidosAdmin() {
  try { admin.pedidos = await Api.pedidos.listarAdmin(); }
  catch (e) { admin.pedidos = []; }
}
function renderPedidos() {
  const box = $('#listaPedidos');
  const novos = admin.pedidos.filter(p => p.status === 'novo').length;
  const badge = $('#badgePedidos');
  badge.textContent = novos;
  badge.classList.toggle('tem', novos > 0);

  if (!admin.pedidos.length) {
    box.innerHTML = `<div class="vazio"><span class="ico">🔔</span>Nenhum pedido ainda. Quando um cliente fechar a bolsa, ele aparece aqui na hora — com aviso sonoro. 😉</div>`;
    return;
  }
  box.innerHTML = admin.pedidos.map(p => `
    <div class="pedido-card st-${esc(p.status)}">
      <div class="pedido-cab">
        <div>
          <div class="quem">${esc(p.nome)} <span style="color:var(--kraft);font-weight:500">· ${esc(maskFone(p.fone))}</span></div>
          <div class="quando">${quandoFoi(p.criadoEm)} · ${p.modo === 'entrega' ? '🛵 Entrega' : '🏠 Retirada'}${p.modo === 'entrega' && p.end ? ' — ' + esc(p.end) : ''}</div>
        </div>
        <div class="codigo">#${esc(p.codigo)}</div>
      </div>
      <ul class="pedido-itens">
        ${p.itens.map(i => `<li><span><b>${i.qtd}×</b> ${esc(i.nome)} <small style="color:var(--kraft)">(${esc(i.unidade)})</small></span><span>${money(i.preco * i.qtd)}</span></li>`).join('')}
      </ul>
      ${p.obs ? `<div class="obs-pill">📝 ${esc(p.obs)}</div>` : ''}
      <div class="pedido-pe">
        <div class="tot">${money(p.total)}</div>
        <div class="dir">
          <a class="btn btn-contorno btn-mini" href="https://wa.me/55${esc(p.fone)}" target="_blank" rel="noopener">💬 Chamar cliente</a>
          <select class="sel-status" onchange="mudarStatus('${p.id}', this.value)">
            ${Object.entries(NOMES_STATUS).map(([k, v]) => `<option value="${k}" ${p.status === k ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
  `).join('');
}
async function mudarStatus(id, st) {
  try {
    const atualizado = await Api.pedidos.mudarStatus(id, st);
    const i = admin.pedidos.findIndex(x => x.id === id);
    if (i >= 0) admin.pedidos[i] = atualizado;
    renderPedidos();
    toast('Pedido #' + atualizado.codigo + ' → ' + NOMES_STATUS[st].replace(/^\S+\s/, ''), '✓');
  } catch (e) { toast(e.message, '⚠️', true); }
}
async function vigiarPedidos() {
  if (!admin.logado) return;
  await carregarPedidosAdmin();
  const novosIds = admin.pedidos.filter(p => !admin.idsPedidosVistos.has(p.id));
  if (novosIds.length) {
    novosIds.forEach(p => admin.idsPedidosVistos.add(p.id));
    renderPedidos();
    tocarSino();
    toast(novosIds.length === 1 ? `Novo pedido de ${novosIds[0].nome}!` : `${novosIds.length} novos pedidos!`, '🔔', true);
  } else {
    renderPedidos();
  }
}
function tocarSino() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(740, ctx.currentTime);
    o.frequency.setValueAtTime(1108, ctx.currentTime + .13);
    g.gain.setValueAtTime(.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.22, ctx.currentTime + .03);
    g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .6);
    o.start(); o.stop(ctx.currentTime + .65);
  } catch (e) {}
}

/* ---- produtos (admin) ---- */
async function carregarProdutosAdmin() {
  try { admin.produtos = await Api.produtos.listarAdmin(); }
  catch (e) { admin.produtos = []; }
}
async function atualizarVitrine() {
  await carregarProdutos();
  renderChips(); renderGrade();
}
function renderAdmProdutos() {
  const box = $('#listaAdmProdutos');
  $('#btnLimparDemo').style.display = admin.produtos.some(p => p.demo) ? 'inline-flex' : 'none';
  if (!admin.produtos.length) {
    box.innerHTML = `<div class="vazio"><span class="ico">🥩</span>Nenhum produto cadastrado. Toque em <b>＋ Novo produto</b> para montar sua vitrine!</div>`;
    return;
  }
  box.innerHTML = admin.produtos.map(p => `
    <div class="linha-adm">
      <div class="thumb" style="${p.img ? '' : 'background:' + (p.grad || '#4a2a1a')}">${fotoHTML(p, '')}</div>
      <div class="meio">
        <div class="nm">${esc(p.nome)} ${p.demo ? '<span class="tag-demo">demo</span>' : ''} ${!p.ativo ? '<span class="tag-off">oculto</span>' : ''}</div>
        <div class="dt">${esc(p.cat)} · ${money(p.preco)} / ${esc(p.unidade)}</div>
      </div>
      <div class="acoes">
        <button class="btn btn-contorno btn-mini" onclick="editarProduto('${p.id}')">Editar</button>
      </div>
    </div>
  `).join('');
}
let fotoTemp = null;
function prepararFormProduto() {
  $('#prCat').innerHTML = CATEGORIAS.map(c => `<option>${c}</option>`).join('');
  $('#emojiRapidos').innerHTML = EMOJIS.map(e => `<button type="button" onclick="usarEmoji('${e}')">${e}</button>`).join('');
}
function usarEmoji(e) {
  fotoTemp = { emoji: e, arquivo: null, remover: false };
  $('#upPreview').innerHTML = `<span style="font-size:3rem">${e}</span><br><small>emoji escolhido — ou envie uma foto</small>`;
}
function novoProduto() {
  $('#tituloProduto').textContent = 'Novo produto';
  $('#prId').value = ''; $('#prNome').value = ''; $('#prPreco').value = '';
  $('#prUnidade').value = 'kg'; $('#prCat').value = CATEGORIAS[0];
  $('#prDesc').value = ''; $('#prAtivo').checked = true;
  fotoTemp = null;
  $('#upPreview').innerHTML = '📷 Toque para enviar uma foto<br><small>ou escolha um emoji abaixo</small>';
  $('#btnExcluir').style.display = 'none';
  $('#erroProduto').textContent = '';
  abrirModal('modalProduto');
}
function editarProduto(id) {
  const p = admin.produtos.find(x => x.id === id); if (!p) return;
  $('#tituloProduto').textContent = 'Editar produto';
  $('#prId').value = p.id; $('#prNome').value = p.nome;
  $('#prPreco').value = String(p.preco.toFixed(2)).replace('.', ',');
  $('#prUnidade').value = p.unidade; $('#prCat').value = p.cat;
  $('#prDesc').value = p.desc || ''; $('#prAtivo').checked = !!p.ativo;
  fotoTemp = { emoji: p.emoji || '🥩', arquivo: null, remover: false };
  $('#upPreview').innerHTML = p.img
    ? `<img src="${p.img}" alt=""><small>toque para trocar a foto</small>`
    : `<span style="font-size:3rem">${esc(p.emoji || '🥩')}</span><br><small>toque para enviar uma foto</small>`;
  $('#btnExcluir').style.display = 'inline-flex';
  $('#erroProduto').textContent = '';
  abrirModal('modalProduto');
}
async function salvarProduto() {
  const erro = $('#erroProduto'); erro.textContent = '';
  const nome = $('#prNome').value.trim();
  const preco = parsePreco($('#prPreco').value);
  if (nome.length < 2) { erro.textContent = 'Dê um nome ao produto.'; return; }
  if (preco <= 0) { erro.textContent = 'Informe um preço válido (ex: 49,90).'; return; }

  const id = $('#prId').value;
  const fd = new FormData();
  fd.append('nome', nome);
  fd.append('cat', $('#prCat').value);
  fd.append('preco', String(preco));
  fd.append('unidade', $('#prUnidade').value);
  fd.append('desc', $('#prDesc').value.trim());
  fd.append('emoji', (fotoTemp && fotoTemp.emoji) || '🥩');
  fd.append('ativo', $('#prAtivo').checked ? '1' : '0');
  if (fotoTemp && fotoTemp.arquivo) fd.append('foto', fotoTemp.arquivo);
  if (fotoTemp && fotoTemp.remover) fd.append('removerFoto', '1');

  try {
    if (id) await Api.produtos.atualizar(id, fd);
    else await Api.produtos.criar(fd);
    await carregarProdutosAdmin();
    renderAdmProdutos();
    await atualizarVitrine();
    fecharModal('modalProduto');
    document.body.style.overflow = 'hidden'; // painel continua aberto
    toast(id ? 'Produto atualizado!' : 'Produto publicado na loja!', '🥩');
  } catch (e) { erro.textContent = e.message; }
}
async function excluirProduto() {
  const id = $('#prId').value; if (!id) return;
  if (!confirm('Excluir este produto da loja?')) return;
  try {
    await Api.produtos.excluir(id);
    await carregarProdutosAdmin();
    renderAdmProdutos();
    await atualizarVitrine();
    fecharModal('modalProduto');
    document.body.style.overflow = 'hidden';
    toast('Produto excluído.', '🗑️');
  } catch (e) { toast(e.message, '⚠️', true); }
}
async function removerDemos() {
  if (!confirm('Remover todos os produtos de demonstração?')) return;
  try {
    await Api.produtos.excluirDemos();
    await carregarProdutosAdmin();
    renderAdmProdutos();
    await atualizarVitrine();
    toast('Demonstrações removidas. A loja é toda sua!', '✨');
  } catch (e) { toast(e.message, '⚠️', true); }
}

/* ---- config (admin) ---- */
async function salvarZap() {
  const d = $('#cfgZap').value.replace(/\D/g, '');
  if (d && d.length < 10) { toast('Número incompleto — confira o DDD.', '⚠️', true); return; }
  try {
    await Api.config.salvarZap(d);
    await carregarConfigPublica();
    toast(d ? 'WhatsApp salvo!' : 'WhatsApp removido.', '📱');
  } catch (e) { toast(e.message, '⚠️', true); }
}
async function trocarSenha() {
  const atual = $('#cfgSenhaAtual').value, nova = $('#cfgSenhaNova').value, erro = $('#erroTroca');
  erro.textContent = '';
  try {
    await Api.auth.trocarSenha(atual, nova);
    $('#cfgSenhaAtual').value = ''; $('#cfgSenhaNova').value = '';
    toast('Senha trocada com sucesso.', '🛡️');
  } catch (e) { erro.textContent = e.message; }
}
async function revogarConfianca() {
  try {
    await Api.auth.logout();
    $('#tagConfiavel').style.display = 'none';
    toast('Sessão encerrada neste dispositivo.', '🔒');
    fecharPainel();
  } catch (e) { toast(e.message, '⚠️', true); }
}
async function sairAdmin() {
  try { await Api.auth.logout(); } catch (e) {}
  fecharPainel();
}
