const CATEGORIAS = ['Bovinos', 'Suínos', 'Aves', 'Embutidos', 'Kits & Espetos'];
const UNIDADES = ['kg', '500g', 'unidade', 'pacote', 'bandeja', 'kit'];
const STATUS_PEDIDO = ['novo', 'preparo', 'pronto', 'entregue', 'cancelado'];

const GRADIENTES = [
  'linear-gradient(140deg,#5a2318,#8a3524)',
  'linear-gradient(140deg,#4a2a14,#7a4620)',
  'linear-gradient(140deg,#5c2e16,#a0521f)',
  'linear-gradient(140deg,#54341a,#8a5a22)',
  'linear-gradient(140deg,#59261c,#93402a)',
  'linear-gradient(140deg,#43231a,#6e3a24)',
  'linear-gradient(140deg,#55261a,#8f4a26)',
  'linear-gradient(140deg,#4f2c1e,#7d4a2c)',
  'linear-gradient(140deg,#4e2f18,#7f4e1f)',
  'linear-gradient(140deg,#5e2418,#a03a1f)'
];

const DEMO_PRODUTOS = [
  { nome: 'Picanha Premium', cat: 'Bovinos', preco: 79.90, unidade: 'kg', emoji: '🥩', desc: 'A rainha do churrasco: macia, suculenta e com a capa de gordura no ponto certo.' },
  { nome: 'Costela no Bafo', cat: 'Bovinos', preco: 42.50, unidade: 'kg', emoji: '🍖', desc: 'Costela bovina selecionada, perfeita para assar lentamente até desmanchar.' },
  { nome: 'Fraldinha Temperada', cat: 'Bovinos', preco: 54.90, unidade: 'kg', emoji: '🥩', desc: 'Já temperada com nosso tempero caseiro. É só levar pra grelha.' },
  { nome: 'Cupim Defumado', cat: 'Bovinos', preco: 49.90, unidade: 'kg', emoji: '🍖', desc: 'Defumado por horas na lenha, derrete na boca.' },
  { nome: 'Linguiça Artesanal', cat: 'Embutidos', preco: 34.90, unidade: 'kg', emoji: '🌭', desc: 'Receita da casa: toscana suculenta, feita aqui, sem conservantes.' },
  { nome: 'Bacon Caseiro', cat: 'Embutidos', preco: 44.90, unidade: '500g', emoji: '🥓', desc: 'Curado e defumado artesanalmente. Crocante e cheio de sabor.' },
  { nome: 'Pernil Suíno', cat: 'Suínos', preco: 29.90, unidade: 'kg', emoji: '🍖', desc: 'Corte generoso, ideal para assados de domingo em família.' },
  { nome: 'Frango Caipira Inteiro', cat: 'Aves', preco: 36.00, unidade: 'unidade', emoji: '🍗', desc: 'Criado solto, sabor de comida de vó. Rende um almoço inteiro.' },
  { nome: 'Coxinha da Asa Temperada', cat: 'Aves', preco: 24.90, unidade: 'kg', emoji: '🍗', desc: 'Marinada no alho e limão, pronta pra fritar ou assar.' },
  { nome: 'Kit Churrasco Família', cat: 'Kits & Espetos', preco: 159.90, unidade: 'kit', emoji: '🔥', desc: '2 kg de carnes variadas + linguiça + pão de alho. Serve 6 pessoas.' }
];

module.exports = { CATEGORIAS, UNIDADES, STATUS_PEDIDO, GRADIENTES, DEMO_PRODUTOS };
