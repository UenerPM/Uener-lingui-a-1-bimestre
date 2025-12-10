const pedidoRepo = require('../repositories/pedidoRepository-avap2');
const produtoRepo = require('../repositories/produtoRepository-avap2');

async function createPedidoWithItems(cpfpessoa, itens, total, funcionarioCpf) {
  // validações básicas de service
  if (!Array.isArray(itens) || itens.length === 0) throw new Error('Itens do pedido são obrigatórios');
  if (!total || total <= 0) throw new Error('Total do pedido inválido');

  // Criar pedido
  const pedido = await pedidoRepo.createPedido(cpfpessoa, total, 'pendente', funcionarioCpf);

  // Adicionar itens
  for (const item of itens) {
    const idproduto = item.idproduto || item.idproduto || item.id || item.productId;
    const quantidade = parseInt(item.quantidade || item.qtd || 1, 10) || 1;
    if (!idproduto) throw new Error('produtoId ausente em um dos itens');
    const produto = await produtoRepo.getProdutoById(idproduto);
    if (!produto) throw new Error(`Produto ${idproduto} não encontrado`);
    if (produto.estoque < quantidade) throw new Error(`Estoque insuficiente para ${produto.nomeproduto}`);
    const preco_unitario = produto.preco || produto.precounitario;
    await pedidoRepo.addItemToPedido(pedido.idpedido, idproduto, quantidade, preco_unitario);
    await produtoRepo.updateEstoque(idproduto, produto.estoque - quantidade).catch(()=>{});
  }

  pedido.itens = await pedidoRepo.getItensPedido(pedido.idpedido);
  return pedido;
}

async function getPedidoById(idpedido) {
  return pedidoRepo.getPedidoById(idpedido);
}

async function getPedidosPorPessoa(cpf) {
  return pedidoRepo.getPedidosPorPessoa(cpf);
}

module.exports = {
  createPedidoWithItems,
  getPedidoById,
  getPedidosPorPessoa
};
