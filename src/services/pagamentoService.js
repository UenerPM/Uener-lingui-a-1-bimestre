const pagamentoRepo = require('../repositories/pagamentoRepository-avap2');
const pedidoRepo = require('../repositories/pedidoRepository-avap2');

async function createPagamento(pedidoId, formaId, valor) {
  // validações de negócio de pagamento
  if (!pedidoId || !formaId || typeof valor === 'undefined') throw new Error('Campos obrigatórios ausentes');
  // Reutiliza repository para inserir pagamento (a layer de controller fará checagens de ownership)
  return pagamentoRepo.createPagamento(pedidoId, formaId, valor);
}

async function verificarFormaPagamento(idForma) {
  return pagamentoRepo.verificarFormaPagamento(idForma);
}

module.exports = {
  createPagamento,
  verificarFormaPagamento
};
