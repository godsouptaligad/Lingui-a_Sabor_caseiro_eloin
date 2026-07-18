/* ---------- cliente da API (fetch com sessão via cookie) ---------- */
async function apiFetch(url, opts = {}) {
  const config = { credentials: 'same-origin', ...opts };
  if (!(config.body instanceof FormData)) {
    config.headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  }
  const res = await fetch(url, config);
  let dados = null;
  try { dados = await res.json(); } catch (e) { /* resposta sem corpo */ }
  if (!res.ok) throw new Error((dados && dados.erro) || 'Opa, não conseguimos falar com o servidor agora.');
  return dados;
}

const Api = {
  produtos: {
    listar: () => apiFetch('/api/produtos'),
    listarAdmin: () => apiFetch('/api/admin/produtos'),
    criar: formData => apiFetch('/api/admin/produtos', { method: 'POST', body: formData }),
    atualizar: (id, formData) => apiFetch(`/api/admin/produtos/${id}`, { method: 'PUT', body: formData }),
    excluir: id => apiFetch(`/api/admin/produtos/${id}`, { method: 'DELETE' }),
    excluirDemos: () => apiFetch('/api/admin/produtos/demo', { method: 'DELETE' })
  },
  pedidos: {
    enviar: pedido => apiFetch('/api/pedidos', { method: 'POST', body: JSON.stringify(pedido) }),
    listarAdmin: () => apiFetch('/api/admin/pedidos'),
    mudarStatus: (id, status) => apiFetch(`/api/admin/pedidos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
  },
  config: {
    publica: () => apiFetch('/api/config'),
    salvarZap: zap => apiFetch('/api/admin/config/zap', { method: 'POST', body: JSON.stringify({ zap }) })
  },
  auth: {
    status: () => apiFetch('/api/auth/status'),
    setup: senha => apiFetch('/api/auth/setup', { method: 'POST', body: JSON.stringify({ senha }) }),
    login: (senha, lembrar) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ senha, lembrar }) }),
    logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
    trocarSenha: (senhaAtual, novaSenha) => apiFetch('/api/auth/trocar-senha', { method: 'POST', body: JSON.stringify({ senhaAtual, novaSenha }) })
  }
};
