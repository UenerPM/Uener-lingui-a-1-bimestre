const store = require('../store/datastore');
const resp = require('../utils/response');

// Endpoint público para listar linguicas (usado pelo frontend)
exports.listLinguicas = async (req, res) => res.json(await store.getAll('linguicas'));

// 1: CRUD sem dependências - categorias
exports.listCategorias = async (req, res) => res.json(await store.getAll('categorias'));
exports.createCategoria = async (req, res) => {
  const { nome } = req.body;
  if (!nome) return resp.badRequest(res, 'Nome obrigatório');
  const item = await store.insert('categorias', { nome });
  res.json(item);
};
exports.updateCategoria = async (req, res) => {
  const { id } = req.params;
  const updated = await store.update('categorias', id, req.body);
  if (!updated) return resp.notFound(res, 'Categoria não encontrada');
  res.json(updated);
};
exports.deleteCategoria = async (req, res) => {
  const { id } = req.params;
  const ok = await store.remove('categorias', id);
  if (!ok) return resp.notFound(res, 'Categoria não encontrada');
  res.json({ ok: true });
};

// 2: CRUD 1:n - produtos pertencem a categoriaId
exports.listProdutos = async (req, res) => res.json(await store.getAll('produtos'));
exports.createProduto = async (req, res) => {
  const { nome, preco, categoriaId } = req.body;
  if (!nome) return resp.badRequest(res, 'Nome obrigatório');
  // opcional: validar categoria existente
  const item = await store.insert('produtos', { nome, preco, categoriaId: categoriaId ? Number(categoriaId) : null });
  res.json(item);
};
exports.updateProduto = async (req, res) => {
  const updated = await store.update('produtos', req.params.id, req.body);
  if (!updated) return resp.notFound(res, 'Produto não encontrado');
  res.json(updated);
};
exports.deleteProduto = async (req, res) => {
  const ok = await store.remove('produtos', req.params.id);
  if (!ok) return resp.notFound(res, 'Produto não encontrado');
  res.json({ ok: true });
};

// 3: CRUD n:m - atributos e ligação produtoAtributos
exports.listAtributos = async (req, res) => res.json(await store.getAll('atributos'));
exports.createAtributo = async (req, res) => {
  const { nome } = req.body;
  if (!nome) return resp.badRequest(res, 'Nome obrigatório');
  const item = await store.insert('atributos', { nome });
  res.json(item);
};
exports.updateAtributo = async (req, res) => {
  const updated = await store.update('atributos', req.params.id, req.body);
  if (!updated) return resp.notFound(res, 'Atributo não encontrado');
  res.json(updated);
};
exports.deleteAtributo = async (req, res) => {
  const ok = await store.remove('atributos', req.params.id);
  if (!ok) return resp.notFound(res, 'Atributo não encontrado');
  res.json({ ok: true });
};

// Ligacao n:m: produtoAtributos armazenada como array em produtos
exports.addProdutoAtributo = async (req, res) => {
  const { produtoId, atributoId } = req.body;
  const produto = await store.find('produtos', p => p.id === Number(produtoId));
  const atributo = await store.find('atributos', a => a.id === Number(atributoId));
  if (!produto || !atributo) return resp.notFound(res, 'Produto ou atributo não encontrado');
  const attrs = produto.atributos || [];
  if (!attrs.includes(atributo.id)) attrs.push(atributo.id);
  await store.update('produtos', produto.id, { atributos: attrs });
  res.json({ ok: true });
};
exports.removeProdutoAtributo = async (req, res) => {
  const { produtoId, atributoId } = req.body;
  const produto = await store.find('produtos', p => p.id === Number(produtoId));
  if (!produto) return resp.notFound(res, 'Produto não encontrado');
  const attrs = (produto.atributos || []).filter(id => id !== Number(atributoId));
  await store.update('produtos', produto.id, { atributos: attrs });
  res.json({ ok: true });
};

// 4: CRUD 1:1 - pedido <-> pagamento (cada pedido pode ter um pagamento)
exports.listPedidos = async (req, res) => res.json(await store.getAll('pedidos'));
exports.createPedido = async (req, res) => {
  const { cliente, itens } = req.body;
  if (!cliente) return resp.badRequest(res, 'Cliente obrigatório');
  const item = await store.insert('pedidos', { cliente, itens: itens || [], pagamentoId: null });
  res.json(item);
};
exports.updatePedido = async (req, res) => {
  const updated = await store.update('pedidos', req.params.id, req.body);
  if (!updated) return resp.notFound(res, 'Pedido não encontrado');
  res.json(updated);
};
exports.deletePedido = async (req, res) => {
  const ok = await store.remove('pedidos', req.params.id);
  if (!ok) return resp.notFound(res, 'Pedido não encontrado');
  res.json({ ok: true });
};

exports.listPagamentos = async (req, res) => res.json(await store.getAll('pagamentos'));
exports.createPagamento = async (req, res) => {
  const { pedidoId, valor } = req.body;
  if (!pedidoId || !valor) return resp.badRequest(res, 'pedidoId e valor obrigatórios');
  const pedido = await store.find('pedidos', p => p.id === Number(pedidoId));
  if (!pedido) return resp.notFound(res, 'Pedido não encontrado');
  if (pedido.pagamentoId) return resp.badRequest(res, 'Pedido já possui pagamento');
  const pagamento = await store.insert('pagamentos', { pedidoId: Number(pedidoId), valor });
  await store.update('pedidos', pedido.id, { pagamentoId: pagamento.id });
  res.json(pagamento);
};
exports.updatePagamento = async (req, res) => {
  const updated = await store.update('pagamentos', req.params.id, req.body);
  if (!updated) return resp.notFound(res, 'Pagamento não encontrado');
  res.json(updated);
};
exports.deletePagamento = async (req, res) => {
  const { id } = req.params;
  const pagamento = await store.find('pagamentos', p => p.id === Number(id));
  if (!pagamento) return resp.notFound(res, 'Pagamento não encontrado');
  const pedido = await store.find('pedidos', pe => pe.id === Number(pagamento.pedidoId));
  if (pedido) await store.update('pedidos', pedido.id, { pagamentoId: null });
  const ok = await store.remove('pagamentos', id);
  if (!ok) return resp.serverError(res, 'Erro ao remover pagamento');
  res.json({ ok: true });
};
