/**
 * PEDIDO CONTROLLER
 * Lógica de negócio para gerenciar pedidos
 */

const pedidoRepo = require('../repositories/pedidoRepository');

function jsonSuccess(res, data = {}, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, ...data });
}

function jsonError(res, message = 'Erro', statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

const PedidoController = {
  /**
   * GET /api/pedidos
   * Listar meus pedidos (usuário logado)
   */
  async listar(req, res) {
    try {
      const username = req.session.user.username;
      const pedidos = await pedidoRepo.getPedidosByUser(username);
      return jsonSuccess(res, { data: pedidos }, 'pedidos listados');
    } catch (err) {
      console.error('❌ Erro ao listar pedidos:', err.message);
      return jsonError(res, 'Erro ao listar pedidos', 500);
    }
  },

  /**
   * GET /api/pedidos-admin
   * Listar todos os pedidos (admin only)
   */
  async listarTodos(req, res) {
    try {
      const pedidos = await pedidoRepo.getAllPedidos();
      return jsonSuccess(res, { data: pedidos }, 'pedidos listados (admin)');
    } catch (err) {
      console.error('❌ Erro ao listar pedidos:', err.message);
      return jsonError(res, 'Erro ao listar pedidos', 500);
    }
  },

  /**
   * GET /api/pedidos/:id
   * Obter um pedido
   */
  async obter(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID do pedido inválido', 400);
      }

      const pedido = await pedidoRepo.getPedidoById(parseInt(id));

      if (!pedido) {
        return jsonError(res, 'Pedido não encontrado', 404);
      }

      // Se é usuário comum, só pode ver seus próprios pedidos (compara CPF)
      if (!req.session.user.isAdmin) {
        const pessoa = await pedidoRepo.findPessoaByUsername(req.session.user.username);
        const cpf = pessoa ? pessoa.cpf : null;
        if (!cpf || pedido.cliente_cpf !== cpf) {
          return jsonError(res, 'Acesso negado', 403);
        }
      }

      return jsonSuccess(res, { data: pedido }, 'pedido obtido');
    } catch (err) {
      console.error('❌ Erro ao obter pedido:', err.message);
      return jsonError(res, 'Erro ao obter pedido', 500);
    }
  },

  /**
   * POST /api/pedidos
   * Criar novo pedido (usuário logado)
   */
  async criar(req, res) {
    try {
      const { cliente_id, cliente_cpf, itens, observacoes } = req.body;
      const username = req.session.user.username;

      // Validações
      if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return jsonError(res, 'Pedido deve ter ao menos 1 item', 400);
      }

      for (const item of itens) {
        if (!item.quantidade || item.quantidade < 1) {
          return jsonError(res, 'Quantidade deve ser maior que 0', 400);
        }
        if (!item.preco_unitario || item.preco_unitario <= 0) {
          return jsonError(res, 'Preço unitário deve ser positivo', 400);
        }
        if (!item.produto_id && !item.linguica_id) {
          return jsonError(res, 'Cada item deve ter produto_id ou linguica_id', 400);
        }
      }

      // Determina CPF do cliente: aceita `cliente_cpf` no body, ou tenta inferir pela sessão
      let cpfParaPedido = cliente_cpf || null;
      if (!cpfParaPedido) {
        const pessoa = await pedidoRepo.findPessoaByUsername(username);
        cpfParaPedido = pessoa ? pessoa.cpf : null;
      }

      const pedido = await pedidoRepo.createPedido(username, cpfParaPedido, itens, observacoes || null);

      return jsonSuccess(res, { data: pedido }, 'pedido criado', 201);
    } catch (err) {
      console.error('❌ Erro ao criar pedido:', err.message);
      return jsonError(res, err.message || 'Erro ao criar pedido', 500);
    }
  },

  /**
   * PUT /api/pedidos/:id
   * Atualizar pedido (status)
   */
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { status, observacoes } = req.body;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID do pedido inválido', 400);
      }

      if (!status) {
        return jsonError(res, 'Status é obrigatório', 400);
      }

      const pedido = await pedidoRepo.updatePedidoStatus(parseInt(id), status);

      return jsonSuccess(res, { data: pedido }, 'pedido atualizado');
    } catch (err) {
      console.error('❌ Erro ao atualizar pedido:', err.message);

      if (err.message.includes('não encontrado')) {
        return jsonError(res, err.message, 404);
      }

      if (err.message.includes('inválido')) {
        return jsonError(res, err.message, 400);
      }

      return jsonError(res, err.message || 'Erro ao atualizar pedido', 500);
    }
  },

  /**
   * DELETE /api/pedidos/:id
   * Deletar pedido (admin only)
   */
  async deletar(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID do pedido inválido', 400);
      }

      const pedido = await pedidoRepo.deletePedido(parseInt(id));

      return jsonSuccess(res, { data: pedido }, 'pedido deletado');
    } catch (err) {
      console.error('❌ Erro ao deletar pedido:', err.message);

      if (err.message.includes('não encontrado')) {
        return jsonError(res, err.message, 404);
      }

      return jsonError(res, err.message || 'Erro ao deletar pedido', 500);
    }
  }
};

module.exports = PedidoController;
