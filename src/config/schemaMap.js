// Mapeamento entre nomes usados na aplicação e nomes reais das tabelas/colunas do banco avap2
// Use este mapa para adaptar queries sem alterar o banco.

module.exports = {
  tables: {
    produto: 'produto',
    cliente: 'cliente',
    pedido: 'pedido',
    itens_pedido: 'pedidohasproduto',
    pagamento: 'pagamento',
    formas_pagamento: 'formadepagamento',
    imagem: 'imagem',
    pessoa: 'pessoa',
    funcionario: 'funcionario',
    users: 'users',
    cargo: 'cargo'
  },
  columns: {
    produto: {
      id: 'idproduto',
      nome: 'nomeproduto',
      estoque: 'quantidadeemestoque',
      preco: 'precounitario',
      id_imagem: 'id_imagem'
    },
    imagem: {
      id: 'id',
      caminho: 'caminho'
    },
    pedido: {
      id: 'idpedido',
      data: 'datadopedido',
      cliente_fk: 'clientepessoacpfpessoa',
      funcionario_fk: 'funcionariopessoacpfpessoa'
    },
    itens_pedido: {
      produto_fk: 'produtoidproduto',
      pedido_fk: 'pedidoidpedido',
      quantidade: 'quantidade',
      preco_unitario: 'precounitario'
    },
    pessoa: {
      cpf: 'cpfpessoa',
      nome: 'nomepessoa',
      email: 'email',
      senha: 'senha_pessoa'
    },
    users: {
      username: 'username',
      password_hash: 'password_hash',
      is_admin: 'is_admin',
      bloqueado: 'bloqueado'
    }
  }
};
