/**
 * CLIENTE CONTROLLER
 * Lógica de negócio para gerenciar clientes
 */

const clienteRepo = require('../repositories/clienteRepository');

function jsonSuccess(res, data = {}, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, ...data });
}

function jsonError(res, message = 'Erro', statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

const ClienteController = {
  /**
   * GET /api/clientes/meu-perfil
   * Obter meu perfil (usuário logado)
   */
  async meuPerfil(req, res) {
    try {
      const username = req.session.user.username;
      const cliente = await clienteRepo.getClienteByUserId(username);

      if (!cliente) {
        return jsonError(res, 'Perfil de cliente não configurado', 404);
      }

      return jsonSuccess(res, { data: cliente }, 'perfil obtido');
    } catch (err) {
      console.error('❌ Erro ao obter perfil:', err.message);
      return jsonError(res, 'Erro ao obter perfil', 500);
    }
  },

  /**
   * PUT /api/clientes/meu-perfil
   * Atualizar meu perfil (usuário logado)
   */
  async atualizarMeu(req, res) {
    try {
      const username = req.session.user.username;
      const { nome_completo, email, telefone, cpf, endereco, numero, complemento, bairro, cidade, estado, cep } = req.body;

      const cliente = await clienteRepo.getClienteByUserId(username);

      if (!cliente) {
        return jsonError(res, 'Perfil de cliente não encontrado', 404);
      }

      const updates = {
        nome_completo: nome_completo || cliente.nome_completo,
        email: email || cliente.email,
        telefone: telefone || cliente.telefone,
        cpf: cpf || cliente.cpf,
        endereco: endereco || cliente.endereco,
        numero: numero || cliente.numero,
        complemento: complemento || cliente.complemento,
        bairro: bairro || cliente.bairro,
        cidade: cidade || cliente.cidade,
        estado: estado || cliente.estado,
        cep: cep || cliente.cep
      };

      const clienteAtualizado = await clienteRepo.updateCliente(cliente.id, updates);

      return jsonSuccess(res, { data: clienteAtualizado }, 'perfil atualizado');
    } catch (err) {
      console.error('❌ Erro ao atualizar perfil:', err.message);

      if (err.message.includes('já cadastrado')) {
        return jsonError(res, err.message, 409);
      }

      return jsonError(res, err.message || 'Erro ao atualizar perfil', 500);
    }
  },

  /**
   * GET /api/clientes
   * Listar todos os clientes (admin)
   */
  async listar(req, res) {
    try {
      const clientes = await clienteRepo.getAllClientes();
      return jsonSuccess(res, { data: clientes }, 'clientes listados');
    } catch (err) {
      console.error('❌ Erro ao listar clientes:', err.message);
      return jsonError(res, 'Erro ao listar clientes', 500);
    }
  },

  /**
   * GET /api/clientes/:id
   * Obter cliente por ID (admin)
   */
  async obter(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID inválido', 400);
      }

      const cliente = await clienteRepo.getClienteById(parseInt(id));

      if (!cliente) {
        return jsonError(res, 'Cliente não encontrado', 404);
      }

      return jsonSuccess(res, { data: cliente }, 'cliente obtido');
    } catch (err) {
      console.error('❌ Erro ao obter cliente:', err.message);
      return jsonError(res, 'Erro ao obter cliente', 500);
    }
  },

  /**
   * POST /api/clientes
   * Criar novo cliente (admin)
   */
  async criar(req, res) {
    try {
      const { nome_completo, email, user_id, telefone, cpf, endereco } = req.body;

      if (!nome_completo || nome_completo.trim() === '') {
        return jsonError(res, 'Nome completo é obrigatório', 400);
      }

      if (!email || email.trim() === '') {
        return jsonError(res, 'Email é obrigatório', 400);
      }

      const cliente = await clienteRepo.createCliente(
        nome_completo.trim(),
        email.trim(),
        user_id || null,
        telefone || null,
        cpf || null,
        endereco || null
      );

      return jsonSuccess(res, { data: cliente }, 'cliente criado', 201);
    } catch (err) {
      console.error('❌ Erro ao criar cliente:', err.message);

      if (err.message.includes('já cadastrado')) {
        return jsonError(res, err.message, 409);
      }

      return jsonError(res, err.message || 'Erro ao criar cliente', 500);
    }
  },

  /**
   * PUT /api/clientes/:id
   * Atualizar cliente (admin)
   */
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID inválido', 400);
      }

      const cliente = await clienteRepo.updateCliente(parseInt(id), updates);

      return jsonSuccess(res, { data: cliente }, 'cliente atualizado');
    } catch (err) {
      console.error('❌ Erro ao atualizar cliente:', err.message);

      if (err.message.includes('não encontrado')) {
        return jsonError(res, err.message, 404);
      }

      if (err.message.includes('já cadastrado')) {
        return jsonError(res, err.message, 409);
      }

      return jsonError(res, err.message || 'Erro ao atualizar cliente', 500);
    }
  },

  /**
   * DELETE /api/clientes/:id
   * Deletar cliente (admin)
   */
  async deletar(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID inválido', 400);
      }

      const cliente = await clienteRepo.deleteCliente(parseInt(id));

      return jsonSuccess(res, { data: cliente }, 'cliente deletado');
    } catch (err) {
      console.error('❌ Erro ao deletar cliente:', err.message);

      if (err.message.includes('não encontrado')) {
        return jsonError(res, err.message, 404);
      }

      return jsonError(res, err.message || 'Erro ao deletar cliente', 500);
    }
  }
};

module.exports = ClienteController;
