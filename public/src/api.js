/**
 * API Client - Centraliza todas as requisições HTTP
 */

const API_BASE_URL = '/api';

/**
 * Fazer requisição genérica
 */
async function fetchAPI(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Erro:', error);
    throw error;
  }
}

/**
 * GET - Listar recursos
 */
async function getAPI(endpoint) {
  return fetchAPI(endpoint, { method: 'GET' });
}

/**
 * POST - Criar recurso
 */
async function postAPI(endpoint, data) {
  return fetchAPI(endpoint, { method: 'POST', body: JSON.stringify(data) });
}

/**
 * PUT - Atualizar recurso
 */
async function putAPI(endpoint, data) {
  return fetchAPI(endpoint, { method: 'PUT', body: JSON.stringify(data) });
}

/**
 * DELETE - Remover recurso
 */
async function deleteAPI(endpoint) {
  return fetchAPI(endpoint, { method: 'DELETE' });
}

/**
 * AUTH - Login
 */
async function login(email, senha) {
  return postAPI('/login', { email, senha });
}

/**
 * AUTH - Logout
 */
async function logout() {
  return postAPI('/logout', {});
}

/**
 * AUTH - Obter usuário atual
 */
async function getCurrentUser() {
  return getAPI('/me');
}

/**
 * PRODUTOS - Listar todos
 */
async function getProdutos() {
  return getAPI('/produtos');
}

/**
 * PRODUTOS - Buscar por ID
 */
async function getProdutoById(id) {
  return getAPI(`/produtos/${id}`);
}

/**
 * PEDIDOS - Criar novo
 */
async function createPedido(itens) {
  return postAPI('/pedidos', { itens });
}

/**
 * PEDIDOS - Listar do usuário
 */
async function getPedidosUsuario() {
  return getAPI('/pedidos');
}

/**
 * PEDIDOS - Buscar por ID
 */
async function getPedidoById(id) {
  return getAPI(`/pedidos/${id}`);
}

/**
 * PAGAMENTOS - Criar novo
 */
async function createPagamento(pedidoId, formaId, valor) {
  return postAPI('/pagamentos', { pedidoId, formaId, valor });
}

/**
 * PAGAMENTOS - Buscar por ID
 */
async function getPagamentoById(id) {
  return getAPI(`/pagamentos/${id}`);
}

/**
 * PIX - Obter configuração
 */
async function getPixConfig() {
  return getAPI('/pix-config');
}

// Exportar para uso
export {
  fetchAPI,
  getAPI,
  postAPI,
  putAPI,
  deleteAPI,
  login,
  logout,
  getCurrentUser,
  getProdutos,
  getProdutoById,
  createPedido,
  getPedidosUsuario,
  getPedidoById,
  createPagamento,
  getPagamentoById,
  getPixConfig
};
