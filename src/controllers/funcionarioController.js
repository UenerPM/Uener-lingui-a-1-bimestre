/**
 * FUNCIONÁRIO CONTROLLER
 * Lógica de negócio para gerenciar funcionários
 */

const funcionarioRepo = require('../repositories/funcionarioRepository');

function jsonSuccess(res, data = {}, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, ...data });
}

function jsonError(res, message = 'Erro', statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

const FuncionarioController = {
  /**
   * GET /api/funcionarios
   * Listar todos os funcionários (admin)
   */
  async listar(req, res) {
    try {
      const funcionarios = await funcionarioRepo.getAllFuncionarios();
      return jsonSuccess(res, { data: funcionarios }, 'funcionários listados');
    } catch (err) {
      console.error('❌ Erro ao listar funcionários:', err.message);
      return jsonError(res, 'Erro ao listar funcionários', 500);
    }
  },

  /**
   * GET /api/funcionarios/:id
   * Obter funcionário por ID (admin)
   */
  async obter(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID inválido', 400);
      }

      const funcionario = await funcionarioRepo.getFuncionarioById(parseInt(id));

      if (!funcionario) {
        return jsonError(res, 'Funcionário não encontrado', 404);
      }

      return jsonSuccess(res, { data: funcionario }, 'funcionário obtido');
    } catch (err) {
      console.error('❌ Erro ao obter funcionário:', err.message);
      return jsonError(res, 'Erro ao obter funcionário', 500);
    }
  },

  /**
   * POST /api/funcionarios
   * Criar novo funcionário (admin)
   */
  async criar(req, res) {
    try {
      const { nome_completo, email, cpf, cargo, salario, user_id } = req.body;

      if (!nome_completo || nome_completo.trim() === '') {
        return jsonError(res, 'Nome completo é obrigatório', 400);
      }

      if (!email || email.trim() === '') {
        return jsonError(res, 'Email é obrigatório', 400);
      }

      if (!cpf || cpf.trim() === '') {
        return jsonError(res, 'CPF é obrigatório', 400);
      }

      if (!cargo || cargo.trim() === '') {
        return jsonError(res, 'Cargo é obrigatório', 400);
      }

      if (salario === undefined || salario === null || isNaN(salario)) {
        return jsonError(res, 'Salário deve ser um número válido', 400);
      }

      if (parseFloat(salario) < 0) {
        return jsonError(res, 'Salário não pode ser negativo', 400);
      }

      const funcionario = await funcionarioRepo.createFuncionario(
        nome_completo.trim(),
        email.trim(),
        cpf.trim(),
        cargo.trim(),
        parseFloat(salario),
        user_id || null
      );

      return jsonSuccess(res, { data: funcionario }, 'funcionário criado', 201);
    } catch (err) {
      console.error('❌ Erro ao criar funcionário:', err.message);

      if (err.message.includes('já cadastrado')) {
        return jsonError(res, err.message, 409);
      }

      return jsonError(res, err.message || 'Erro ao criar funcionário', 500);
    }
  },

  /**
   * PUT /api/funcionarios/:id
   * Atualizar funcionário (admin)
   */
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome_completo, email, cpf, cargo, salario } = req.body;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID inválido', 400);
      }

      const updates = {};

      if (nome_completo !== undefined && nome_completo.trim() !== '') {
        updates.nome_completo = nome_completo.trim();
      }

      if (email !== undefined && email.trim() !== '') {
        updates.email = email.trim();
      }

      if (cpf !== undefined && cpf.trim() !== '') {
        updates.cpf = cpf.trim();
      }

      if (cargo !== undefined && cargo.trim() !== '') {
        updates.cargo = cargo.trim();
      }

      if (salario !== undefined) {
        if (isNaN(salario)) {
          return jsonError(res, 'Salário deve ser um número válido', 400);
        }
        if (parseFloat(salario) < 0) {
          return jsonError(res, 'Salário não pode ser negativo', 400);
        }
        updates.salario = parseFloat(salario);
      }

      const funcionario = await funcionarioRepo.updateFuncionario(parseInt(id), updates);

      return jsonSuccess(res, { data: funcionario }, 'funcionário atualizado');
    } catch (err) {
      console.error('❌ Erro ao atualizar funcionário:', err.message);

      if (err.message.includes('não encontrado')) {
        return jsonError(res, err.message, 404);
      }

      if (err.message.includes('já cadastrado')) {
        return jsonError(res, err.message, 409);
      }

      return jsonError(res, err.message || 'Erro ao atualizar funcionário', 500);
    }
  },

  /**
   * DELETE /api/funcionarios/:id
   * Deletar funcionário (admin)
   */
  async deletar(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID inválido', 400);
      }

      const funcionario = await funcionarioRepo.deleteFuncionario(parseInt(id));

      return jsonSuccess(res, { data: funcionario }, 'funcionário deletado');
    } catch (err) {
      console.error('❌ Erro ao deletar funcionário:', err.message);

      if (err.message.includes('não encontrado')) {
        return jsonError(res, err.message, 404);
      }

      return jsonError(res, err.message || 'Erro ao deletar funcionário', 500);
    }
  }
};

module.exports = FuncionarioController;
