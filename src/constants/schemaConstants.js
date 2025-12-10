// Constantes centrais para nomes de tabelas/colunas (ajuste conforme schema real)
module.exports = {
  TABLES: {
    PESSOA: 'pessoa',
    PESSOAS: 'pessoas',
    FUNCIONARIOS: 'funcionarios',
    FUNCIONARIO: 'funcionario',
    PEDIDO: 'pedido',
    PEDIDO_HAS_PRODUTO: 'pedidohasproduto',
    PRODUTO: 'produto',
    PAGAMENTO: 'pagamento',
    FORMA_PAGAMENTO: 'formadepagamento'
  },
  COLUMNS: {
    PEDIDO: {
      ID: 'idpedido',
      DATA: 'datadopedido',
      CLIENTE_CPF: 'clientepessoacpfpessoa',
      FUNCIONARIO_CPF: 'funcionariopessoacpfpessoa'
    },
    PRODUTO: {
      ID: 'idproduto',
      NOME: 'nomeproduto',
      PRECO: 'precounitario'
    }
  }
};
