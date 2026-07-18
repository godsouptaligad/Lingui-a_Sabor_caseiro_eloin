/* ---------- eventos e inicialização ---------- */
function ligarEventos() {
  window.addEventListener('scroll', () => {
    $('#topo').classList.toggle('rolou', window.scrollY > 40);
  }, { passive: true });

  $('#campoBusca').addEventListener('input', e => { estado.busca = e.target.value; renderGrade(); });
  $('#pedFone').addEventListener('input', e => { e.target.value = maskFone(e.target.value); });
  $('#cfgZap').addEventListener('input', e => { e.target.value = maskFone(e.target.value); });
  $$('input[name="entrega"]').forEach(r => r.addEventListener('change', () => {
    $('#cEnd').style.display = document.querySelector('input[name="entrega"]:checked').value === 'entrega' ? 'block' : 'none';
  }));
  $('#prArquivo').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    fotoTemp = { arquivo: f, emoji: (fotoTemp && fotoTemp.emoji) || '🥩', remover: false };
    const url = URL.createObjectURL(f);
    $('#upPreview').innerHTML = `<img src="${url}" alt=""><small>toque para trocar a foto</small>`;
  });
  $('#linkDono').addEventListener('click', abrirPainel);
  $('#senhaEntrar') && $('#senhaEntrar').addEventListener('keydown', e => { if (e.key === 'Enter') entrarAdmin(); });
  $('#novaSenha2') && $('#novaSenha2').addEventListener('keydown', e => { if (e.key === 'Enter') criarSenha(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { fecharTudo(); fecharModal('modalCheckout'); fecharModal('modalProduto'); }
  });
}

async function iniciar() {
  criarBrasas();
  montarLetreiro();
  parallaxHero();
  prepararFormProduto();
  ligarEventos();
  observarReveals();

  carregarBolsa();
  await Promise.all([carregarProdutos(), carregarConfigPublica()]);
  renderChips();
  renderGrade();
  atualizarFab();
  renderBolsa();
}
iniciar();
