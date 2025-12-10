const pedidoRepo = require('../repositories/pedidoRepository-avap2');
const produtoRepo = require('../repositories/produtoRepository-avap2');
const pool = require('../config/db');
const funcionarioRepo = require('../repositories/funcionarioRepository');

function jsonError(res, message = 'Erro', statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

function jsonSuccess(res, data = {}, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, ...data });
}

const PedidoController = {
  /**
   * POST /api/pedidos
   * Cria um novo pedido com itens
   * Body: { itens: [ { idproduto, quantidade }, ... ], total }
   */
  async createPedido(req, res) {
    try {
      if (!req.session || !req.session.user) {
        return jsonError(res, 'Usuário não autenticado', 401);
      }

      const { itens, total } = req.body || {};
      const cpfpessoa = req.session.user.cpfpessoa;

      if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return jsonError(res, 'Itens do pedido são obrigatórios', 400);
      }

      if (!total || total <= 0) {
        return jsonError(res, 'Total do pedido inválido', 400);
      }

      // Criar pedido
      // Selecionar atendente ativo aleatoriamente (compatível com variações de schema)
      async function getActiveFuncionariosList(client) {
        try {
          const r = await client.query('SELECT cpf FROM funcionarios WHERE deleted_at IS NULL');
          if (r && r.rowCount > 0) return r.rows.map(rw => rw.cpf);
        } catch (e) {}
        try {
          const r2 = await client.query('SELECT pessoacpfpessoa as cpf FROM funcionario');
          if (r2 && r2.rowCount > 0) return r2.rows.map(rw => rw.cpf);
        } catch (e) {}
        try {
          const fr = await funcionarioRepo.getAllFuncionarios();
          if (Array.isArray(fr) && fr.length > 0) return fr.map(f => f.cpf || f.pessoacpfpessoa || f.cpfpessoa);
        } catch (e) {}
        return [];
      }

      const client = await pool.connect();
      let funcionarioCpf = null;
      try {
        const list = await getActiveFuncionariosList(client);
        if (list.length > 0) {
          funcionarioCpf = list[Math.floor(Math.random() * list.length)];
        } else {
          // Nenhum atendente ativo disponível — não criar pedido
          return jsonError(res, 'Nenhum atendente ativo disponível para atender o pedido', 503);
        }
      } finally {
        client.release();
      }

      const pedido = await pedidoRepo.createPedido(cpfpessoa, total, 'pendente', funcionarioCpf);

      // Adicionar itens
      for (const item of itens) {
        const { idproduto, quantidade } = item;

        if (!idproduto || !quantidade || quantidade <= 0) {
          return jsonError(res, 'Produto ou quantidade inválidos', 400);
        }

        const produto = await produtoRepo.getProdutoById(idproduto);
        if (!produto) {
          return jsonError(res, `Produto ${idproduto} não encontrado`, 404);
        }

        // Validar estoque
        if (produto.estoque < quantidade) {
          return jsonError(res, `Estoque insuficiente para ${produto.nomeproduto}`, 400);
        }

        const preco_unitario = produto.preco;
        await pedidoRepo.addItemToPedido(pedido.idpedido, idproduto, quantidade, preco_unitario);

        // Atualizar estoque
        await produtoRepo.updateEstoque(idproduto, produto.estoque - quantidade);
      }

      // Retornar pedido com itens
      const itensPedido = await pedidoRepo.getItensPedido(pedido.idpedido);

      return jsonSuccess(
        res,
        { pedido: { ...pedido, itens: itensPedido } },
        'Pedido criado com sucesso',
        201
      );
    } catch (err) {
      console.error('❌ Erro ao criar pedido:', err.message);
      return jsonError(res, err.message || 'Erro ao criar pedido', 500);
    }
  },

  /**
   * GET /api/pedidos
   * Lista pedidos do usuário logado
   */
  async getPedidosUsuario(req, res) {
    try {
      if (!req.session || !req.session.user) {
        return jsonError(res, 'Usuário não autenticado', 401);
      }

      const cpfpessoa = req.session.user.cpfpessoa;
      const pedidos = await pedidoRepo.getPedidosPorPessoa(cpfpessoa);

      // Para cada pedido, buscar seus itens
      for (const p of pedidos) {
        p.itens = await pedidoRepo.getItensPedido(p.idpedido);
      }

      return jsonSuccess(res, { data: pedidos }, 'Pedidos listados', 200);
    } catch (err) {
      console.error('❌ Erro ao listar pedidos:', err.message);
      return jsonError(res, err.message || 'Erro ao listar pedidos', 500);
    }
  },

  /**
   * GET /api/pedidos/:id
   * Busca um pedido específico
   */
  async getPedidoById(req, res) {
    try {
      const { id } = req.params;
      if (!id) return jsonError(res, 'ID do pedido é obrigatório', 400);

      const pedido = await pedidoRepo.getPedidoById(parseInt(id));

      if (!pedido) {
        return jsonError(res, 'Pedido não encontrado', 404);
      }

      // Verificar se o usuário tem permissão para ver este pedido
      // Campo real no banco é `clientepessoacpfpessoa`
      if (req.session && req.session.user && req.session.user.cpfpessoa !== pedido.clientepessoacpfpessoa && !req.session.user.isAdmin) {
        return jsonError(res, 'Acesso negado', 403);
      }

      const itens = await pedidoRepo.getItensPedido(pedido.idpedido);
      pedido.itens = itens;

      return jsonSuccess(res, { data: pedido }, 'Pedido encontrado', 200);
    } catch (err) {
      console.error('❌ Erro ao buscar pedido:', err.message);
      return jsonError(res, err.message || 'Erro ao buscar pedido', 500);
    }
  }
};

module.exports = PedidoController;
