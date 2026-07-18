/* ---------- efeitos visuais ---------- */
function criarBrasas() {
  const box = $('#brasas');
  for (let i = 0; i < 16; i++) {
    const b = document.createElement('i');
    const tam = 3 + Math.random() * 6;
    b.style.width = b.style.height = tam + 'px';
    b.style.left = Math.random() * 100 + '%';
    b.style.setProperty('--desvio', (Math.random() * 120 - 60) + 'px');
    b.style.animationDuration = (5 + Math.random() * 6) + 's';
    b.style.animationDelay = (Math.random() * 7) + 's';
    box.appendChild(b);
  }
}
function montarLetreiro() {
  const itens = ['PICANHA', 'COSTELA NO BAFO', 'LINGUIÇA ARTESANAL', 'FRANGO CAIPIRA', 'CUPIM DEFUMADO', 'BACON CASEIRO', 'KITS DE CHURRASCO'];
  let html = '';
  for (let r = 0; r < 4; r++) html += itens.map((t, i) => `<span>${i % 2 ? `<em>${t}</em>` : t} &nbsp;✦</span>`).join('');
  $('#trilho').innerHTML = html;
}
function parallaxHero() {
  const hero = $('#hero');
  hero.addEventListener('mousemove', e => {
    const cx = e.clientX / window.innerWidth - .5;
    const cy = e.clientY / window.innerHeight - .5;
    $$('.flut').forEach(f => {
      const p = Number(f.dataset.prof) || 20;
      f.style.transform = `translate(${cx * p}px, ${cy * p}px)`;
    });
  });
}
let observador = null;
function observarReveals() {
  if (!observador) {
    observador = new IntersectionObserver(ents => {
      ents.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visivel'); observador.unobserve(en.target); } });
    }, { threshold: .12 });
  }
  $$('[data-reveal]:not(.visivel)').forEach(el => observador.observe(el));
}
