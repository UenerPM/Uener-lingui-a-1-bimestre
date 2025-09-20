const store = require('../store/datastore');

// Usamos pool diretamente para executar SQL nas tabelas relacionais
const pool = store.pool;

// Helper para executar query e retornar rows
async function run(q, params = []) {
  const res = await pool.query(q, params);
  return res.rows;
}

// Cargos
const listCargos = async (req, res) => {
  const rows = await run('SELECT id_cargo, nome_cargo FROM cargo ORDER BY id_cargo');
  res.json(rows);
};
const getCargo = async (req, res) => {
  const id = req.params.id;
  const rows = await run('SELECT id_cargo, nome_cargo FROM cargo WHERE id_cargo=$1', [id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Cargo não encontrado' });
  res.json(rows[0]);
};
const createCargo = async (req, res) => {
  const { nome_cargo } = req.body;
  if (!nome_cargo) return res.status(400).json({ erro: 'nome_cargo obrigatório' });
  const rows = await run('INSERT INTO cargo(nome_cargo) VALUES($1) RETURNING id_cargo, nome_cargo', [nome_cargo]);
  res.json(rows[0]);
};
const updateCargo = async (req, res) => {
  const id = req.params.id;
  const { nome_cargo } = req.body;
  const rows = await run('UPDATE cargo SET nome_cargo=$1 WHERE id_cargo=$2 RETURNING id_cargo, nome_cargo', [nome_cargo, id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Cargo não encontrado' });
  res.json(rows[0]);
};
const deleteCargo = async (req, res) => {
  const id = req.params.id;
  const r = await run('DELETE FROM cargo WHERE id_cargo=$1 RETURNING id_cargo', [id]);
  if (!r[0]) return res.status(404).json({ erro: 'Cargo não encontrado' });
  res.json({ ok: true });
};

const resp = require('../utils/response');

// Pessoas
const listPessoas = async (req, res) => {
  const rows = await run('SELECT cpf, nome, endereco FROM pessoa ORDER BY nome');
  res.json(rows);
};
const getPessoa = async (req, res) => {
  const cpf = req.params.cpf;
  const rows = await run('SELECT cpf, nome, endereco FROM pessoa WHERE cpf=$1', [cpf]);
  if (!rows[0]) return res.status(404).json({ erro: 'Pessoa não encontrada' });
  res.json(rows[0]);
};
const createPessoa = async (req, res) => {
  const { cpf, nome, endereco } = req.body;
  if (!cpf || !nome) return res.status(400).json({ erro: 'cpf e nome obrigatórios' });
  try {
    const rows = await run('INSERT INTO pessoa(cpf,nome,endereco) VALUES($1,$2,$3) RETURNING cpf,nome,endereco', [cpf, nome, endereco || null]);
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return resp.conflict(res, 'CPF já existe');
    return resp.serverError(res, e);
  }
};
const updatePessoa = async (req, res) => {
  const cpf = req.params.cpf;
  const { nome, endereco } = req.body;
  const rows = await run('UPDATE pessoa SET nome=$1, endereco=$2 WHERE cpf=$3 RETURNING cpf,nome,endereco', [nome, endereco, cpf]);
  if (!rows[0]) return res.status(404).json({ erro: 'Pessoa não encontrada' });
  res.json(rows[0]);
};
const deletePessoa = async (req, res) => {
  const cpf = req.params.cpf;
  const r = await run('DELETE FROM pessoa WHERE cpf=$1 RETURNING cpf', [cpf]);
  if (!r[0]) return res.status(404).json({ erro: 'Pessoa não encontrada' });
  res.json({ ok: true });
};

// Clientes
const listClientes = async (req, res) => {
  const rows = await run('SELECT c.id_cliente, c.cpf, p.nome, c.tipo_cliente, c.data_cadastro FROM cliente c JOIN pessoa p ON c.cpf=p.cpf ORDER BY c.id_cliente');
  res.json(rows);
};
const getCliente = async (req, res) => {
  const id = req.params.id;
  const rows = await run('SELECT id_cliente, cpf, tipo_cliente, data_cadastro FROM cliente WHERE id_cliente=$1', [id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(rows[0]);
};
const createCliente = async (req, res) => {
  const { cpf, tipo_cliente, data_cadastro } = req.body;
  if (!cpf) return res.status(400).json({ erro: 'cpf obrigatório' });
  try {
    const rows = await run('INSERT INTO cliente(cpf,tipo_cliente,data_cadastro) VALUES($1,$2,$3) RETURNING id_cliente,cpf,tipo_cliente,data_cadastro', [cpf, tipo_cliente || null, data_cadastro || null]);
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23503') return resp.badRequest(res, 'CPF referencia pessoa inexistente');
    return resp.serverError(res, e);
  }
};
const updateCliente = async (req, res) => {
  const id = req.params.id;
  const { cpf, tipo_cliente, data_cadastro } = req.body;
  const rows = await run('UPDATE cliente SET cpf=$1, tipo_cliente=$2, data_cadastro=$3 WHERE id_cliente=$4 RETURNING id_cliente,cpf,tipo_cliente,data_cadastro', [cpf, tipo_cliente, data_cadastro, id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json(rows[0]);
};
const deleteCliente = async (req, res) => {
  const id = req.params.id;
  const r = await run('DELETE FROM cliente WHERE id_cliente=$1 RETURNING id_cliente', [id]);
  if (!r[0]) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json({ ok: true });
};

// Funcionarios
const listFuncionarios = async (req, res) => {
  const rows = await run('SELECT f.cpf, p.nome, f.salario, f.id_cargo, f.porcentagem_comissao FROM funcionario f JOIN pessoa p ON f.cpf=p.cpf ORDER BY p.nome');
  res.json(rows);
};
const getFuncionario = async (req, res) => {
  const cpf = req.params.cpf;
  const rows = await run('SELECT cpf, salario, id_cargo, porcentagem_comissao FROM funcionario WHERE cpf=$1', [cpf]);
  if (!rows[0]) return res.status(404).json({ erro: 'Funcionário não encontrado' });
  res.json(rows[0]);
};
const createFuncionario = async (req, res) => {
  const { cpf, salario, id_cargo, porcentagem_comissao } = req.body;
  if (!cpf) return res.status(400).json({ erro: 'cpf obrigatório' });
  try {
    const rows = await run('INSERT INTO funcionario(cpf,salario,id_cargo,porcentagem_comissao) VALUES($1,$2,$3,$4) RETURNING cpf,salario,id_cargo,porcentagem_comissao', [cpf, salario || null, id_cargo || null, porcentagem_comissao || null]);
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23503') return resp.badRequest(res, 'Referência inválida (pessoa ou cargo)');
    if (e.code === '23505') return resp.conflict(res, 'Funcionário já existe');
    return resp.serverError(res, e);
  }
};
const updateFuncionario = async (req, res) => {
  const cpf = req.params.cpf;
  const { salario, id_cargo, porcentagem_comissao } = req.body;
  const rows = await run('UPDATE funcionario SET salario=$1, id_cargo=$2, porcentagem_comissao=$3 WHERE cpf=$4 RETURNING cpf,salario,id_cargo,porcentagem_comissao', [salario, id_cargo, porcentagem_comissao, cpf]);
  if (!rows[0]) return res.status(404).json({ erro: 'Funcionário não encontrado' });
  res.json(rows[0]);
};
const deleteFuncionario = async (req, res) => {
  const cpf = req.params.cpf;
  const r = await run('DELETE FROM funcionario WHERE cpf=$1 RETURNING cpf', [cpf]);
  if (!r[0]) return res.status(404).json({ erro: 'Funcionário não encontrado' });
  res.json({ ok: true });
};

// Produtos
const listProdutosSql = async (req, res) => {
  const rows = await run('SELECT id_produto, nome_produto, estoque_atual, preco_unidade FROM produto ORDER BY id_produto');
  res.json(rows);
};
const getProdutoSql = async (req, res) => {
  const id = req.params.id;
  const rows = await run('SELECT id_produto, nome_produto, estoque_atual, preco_unidade FROM produto WHERE id_produto=$1', [id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Produto não encontrado' });
  res.json(rows[0]);
};
const createProdutoSql = async (req, res) => {
  const { nome_produto, estoque_atual, preco_unidade } = req.body;
  if (!nome_produto) return res.status(400).json({ erro: 'nome_produto obrigatório' });
  const rows = await run('INSERT INTO produto(nome_produto,estoque_atual,preco_unidade) VALUES($1,$2,$3) RETURNING id_produto,nome_produto,estoque_atual,preco_unidade', [nome_produto, estoque_atual || 0, preco_unidade || 0]);
  res.json(rows[0]);
};
const updateProdutoSql = async (req, res) => {
  const id = req.params.id;
  const { nome_produto, estoque_atual, preco_unidade } = req.body;
  const rows = await run('UPDATE produto SET nome_produto=$1, estoque_atual=$2, preco_unidade=$3 WHERE id_produto=$4 RETURNING id_produto,nome_produto,estoque_atual,preco_unidade', [nome_produto, estoque_atual, preco_unidade, id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Produto não encontrado' });
  res.json(rows[0]);
};
const deleteProdutoSql = async (req, res) => {
  const id = req.params.id;
  const r = await run('DELETE FROM produto WHERE id_produto=$1 RETURNING id_produto', [id]);
  if (!r[0]) return res.status(404).json({ erro: 'Produto não encontrado' });
  res.json({ ok: true });
};

// Pedidos e produto_pedido
const listPedidosSql = async (req, res) => {
  const rows = await run('SELECT id_pedido, data, id_cliente, cpf_funcionario FROM pedido ORDER BY id_pedido');
  res.json(rows);
};
const getPedidoSql = async (req, res) => {
  const id = req.params.id;
  const rows = await run('SELECT id_pedido, data, id_cliente, cpf_funcionario FROM pedido WHERE id_pedido=$1', [id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Pedido não encontrado' });
  const itens = await run('SELECT id_produto_pedido, id_produto, quantidade, preco_unitario FROM produto_pedido WHERE id_pedido=$1', [id]);
  res.json({ ...rows[0], itens });
};
const createPedidoSql = async (req, res) => {
  const { data, id_cliente, cpf_funcionario, itens } = req.body;
  if (!id_cliente) return res.status(400).json({ erro: 'id_cliente obrigatório' });
  try {
    const rows = await run('INSERT INTO pedido(data,id_cliente,cpf_funcionario) VALUES($1,$2,$3) RETURNING id_pedido,data,id_cliente,cpf_funcionario', [data || null, id_cliente, cpf_funcionario || null]);
    const pedido = rows[0];
    if (Array.isArray(itens) && itens.length > 0) {
      for (const it of itens) {
        await run('INSERT INTO produto_pedido(id_pedido,id_produto,quantidade,preco_unitario) VALUES($1,$2,$3,$4)', [pedido.id_pedido, it.id_produto, it.quantidade, it.preco_unitario]);
      }
    }
    res.json(pedido);
  } catch (e) {
    if (e.code === '23503') return resp.badRequest(res, 'Referência inválida (cliente/produto/funcionário)');
    return resp.serverError(res, e);
  }
};
const updatePedidoSql = async (req, res) => {
  const id = req.params.id;
  const { data, id_cliente, cpf_funcionario } = req.body;
  const rows = await run('UPDATE pedido SET data=$1, id_cliente=$2, cpf_funcionario=$3 WHERE id_pedido=$4 RETURNING id_pedido,data,id_cliente,cpf_funcionario', [data, id_cliente, cpf_funcionario, id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Pedido não encontrado' });
  res.json(rows[0]);
};
const deletePedidoSql = async (req, res) => {
  const id = req.params.id;
  await run('DELETE FROM produto_pedido WHERE id_pedido=$1', [id]);
  const r = await run('DELETE FROM pedido WHERE id_pedido=$1 RETURNING id_pedido', [id]);
  if (!r[0]) return res.status(404).json({ erro: 'Pedido não encontrado' });
  res.json({ ok: true });
};

// produto_pedido CRUD
const listProdutoPedido = async (req, res) => {
  const rows = await run('SELECT id_produto_pedido, id_pedido, id_produto, quantidade, preco_unitario FROM produto_pedido ORDER BY id_produto_pedido');
  res.json(rows);
};
const getProdutoPedido = async (req, res) => {
  const id = req.params.id;
  const rows = await run('SELECT id_produto_pedido, id_pedido, id_produto, quantidade, preco_unitario FROM produto_pedido WHERE id_produto_pedido=$1', [id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Item pedido não encontrado' });
  res.json(rows[0]);
};
const createProdutoPedido = async (req, res) => {
  const { id_pedido, id_produto, quantidade, preco_unitario } = req.body;
  if (!id_pedido || !id_produto) return res.status(400).json({ erro: 'id_pedido e id_produto obrigatórios' });
  try {
    const rows = await run('INSERT INTO produto_pedido(id_pedido,id_produto,quantidade,preco_unitario) VALUES($1,$2,$3,$4) RETURNING id_produto_pedido,id_pedido,id_produto,quantidade,preco_unitario', [id_pedido, id_produto, quantidade || 1, preco_unitario || 0]);
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23503') return resp.badRequest(res, 'Referência inválida (pedido/produto)');
    return resp.serverError(res, e);
  }
};
const updateProdutoPedido = async (req, res) => {
  const id = req.params.id;
  const { quantidade, preco_unitario } = req.body;
  const rows = await run('UPDATE produto_pedido SET quantidade=$1, preco_unitario=$2 WHERE id_produto_pedido=$3 RETURNING id_produto_pedido,id_pedido,id_produto,quantidade,preco_unitario', [quantidade, preco_unitario, id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Item pedido não encontrado' });
  res.json(rows[0]);
};
const deleteProdutoPedido = async (req, res) => {
  const id = req.params.id;
  const r = await run('DELETE FROM produto_pedido WHERE id_produto_pedido=$1 RETURNING id_produto_pedido', [id]);
  if (!r[0]) return res.status(404).json({ erro: 'Item pedido não encontrado' });
  res.json({ ok: true });
};

// Pagamentos e formas
const listPagamentosSql = async (req, res) => {
  const rows = await run('SELECT id_pagamento, id_pedido, valor_total FROM pagamento ORDER BY id_pagamento');
  res.json(rows);
};
const getPagamentoSql = async (req, res) => {
  const id = req.params.id;
  const rows = await run('SELECT id_pagamento, id_pedido, valor_total FROM pagamento WHERE id_pagamento=$1', [id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Pagamento não encontrado' });
  const formas = await run('SELECT pfp.id_forma_pagamento, f.nome_forma_pagamento, pfp.valor_pago FROM pagamento_forma_pagamento pfp JOIN forma_pagamento f ON pfp.id_forma_pagamento=f.id_forma_pagamento WHERE pfp.id_pagamento=$1', [id]);
  res.json({ ...rows[0], formas });
};
const createPagamentoSql = async (req, res) => {
  const { id_pedido, valor_total, formas } = req.body;
  if (!id_pedido || !valor_total) return res.status(400).json({ erro: 'id_pedido e valor_total obrigatórios' });
  try {
    const rows = await run('INSERT INTO pagamento(id_pedido,valor_total) VALUES($1,$2) RETURNING id_pagamento,id_pedido,valor_total', [id_pedido, valor_total]);
    const pagamento = rows[0];
    if (Array.isArray(formas)) {
      for (const f of formas) {
        await run('INSERT INTO pagamento_forma_pagamento(id_pagamento,id_forma_pagamento,valor_pago) VALUES($1,$2,$3)', [pagamento.id_pagamento, f.id_forma_pagamento, f.valor_pago]);
      }
    }
    res.json(pagamento);
  } catch (e) {
    if (e.code === '23503') return resp.badRequest(res, 'Referência inválida (pedido/forma_pagamento)');
    return resp.serverError(res, e);
  }
};
const updatePagamentoSql = async (req, res) => {
  const id = req.params.id;
  const { id_pedido, valor_total } = req.body;
  const rows = await run('UPDATE pagamento SET id_pedido=$1, valor_total=$2 WHERE id_pagamento=$3 RETURNING id_pagamento,id_pedido,valor_total', [id_pedido, valor_total, id]);
  if (!rows[0]) return res.status(404).json({ erro: 'Pagamento não encontrado' });
  res.json(rows[0]);
};
const deletePagamentoSql = async (req, res) => {
  const id = req.params.id;
  await run('DELETE FROM pagamento_forma_pagamento WHERE id_pagamento=$1', [id]);
  const r = await run('DELETE FROM pagamento WHERE id_pagamento=$1 RETURNING id_pagamento', [id]);
  if (!r[0]) return res.status(404).json({ erro: 'Pagamento não encontrado' });
  res.json({ ok: true });
};

// Formas de pagamento
const listFormas = async (req, res) => {
  const rows = await run('SELECT id_forma_pagamento, nome_forma_pagamento FROM forma_pagamento ORDER BY id_forma_pagamento');
  res.json(rows);
};
const createForma = async (req, res) => {
  const { nome_forma_pagamento } = req.body;
  if (!nome_forma_pagamento) return res.status(400).json({ erro: 'nome_forma_pagamento obrigatório' });
  const rows = await run('INSERT INTO forma_pagamento(nome_forma_pagamento) VALUES($1) RETURNING id_forma_pagamento,nome_forma_pagamento', [nome_forma_pagamento]);
  res.json(rows[0]);
};

// Relação pagamento_forma_pagamento
const listPagamentoFormas = async (req, res) => {
  const rows = await run('SELECT id_pagamento, id_forma_pagamento, valor_pago FROM pagamento_forma_pagamento ORDER BY id_pagamento');
  res.json(rows);
};

// Agrupamento por recurso para usar nas rotas
const controllers = {
  cargos: { list: listCargos, get: getCargo, create: createCargo, update: updateCargo, remove: deleteCargo },
  pessoas: { list: listPessoas, get: getPessoa, create: createPessoa, update: updatePessoa, remove: deletePessoa },
  clientes: { list: listClientes, get: getCliente, create: createCliente, update: updateCliente, remove: deleteCliente },
  funcionarios: { list: listFuncionarios, get: getFuncionario, create: createFuncionario, update: updateFuncionario, remove: deleteFuncionario },
  produtos: { list: listProdutosSql, get: getProdutoSql, create: createProdutoSql, update: updateProdutoSql, remove: deleteProdutoSql },
  pedidos: { list: listPedidosSql, get: getPedidoSql, create: createPedidoSql, update: updatePedidoSql, remove: deletePedidoSql },
  produto_pedido: { list: listProdutoPedido, get: getProdutoPedido, create: createProdutoPedido, update: updateProdutoPedido, remove: deleteProdutoPedido },
  pagamentos: { list: listPagamentosSql, get: getPagamentoSql, create: createPagamentoSql, update: updatePagamentoSql, remove: deletePagamentoSql },
  forma_pagamento: { list: listFormas, get: null, create: createForma, update: null, remove: null },
  pagamento_forma_pagamento: { list: listPagamentoFormas, get: null, create: null, update: null, remove: null }
};

module.exports = controllers;
