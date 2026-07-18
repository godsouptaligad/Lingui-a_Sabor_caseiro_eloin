/* ---------- utilitários compartilhados ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function parsePreco(t) {
  t = String(t || '').trim().replace(/[^\d.,]/g, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(t);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

function maskFone(v) {
  const d = String(v).replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function quandoFoi(ts) {
  const dif = Date.now() - ts, m = Math.floor(dif / 60000);
  if (m < 1) return 'agora mesmo';
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
         new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/* ---------- toast ---------- */
let toastTimer = null;
function toast(txt, ico = '✓', fogo = false) {
  const t = $('#toast');
  $('#toastTxt').textContent = txt;
  $('#toastIco').textContent = ico;
  t.classList.toggle('fogo', !!fogo);
  t.classList.add('mostra');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('mostra'), 2600);
}
