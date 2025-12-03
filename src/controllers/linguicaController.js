/**
 * LINGUIÇA CONTROLLER
 * Lógica de negócio para gerenciar linguiças
 * 
 * NOTA: Mapeia "linguiças" para a tabela "produto" do PostgreSQL
 * pois o banco foi refatorado para usar estrutura genérica de produtos
 */

const produtoRepo = require('../repositories/produtoRepository');

function jsonSuccess(res, data = {}, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, ...data });
}

function jsonError(res, message = 'Erro', statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

const LinguicaController = {
  /**
   * GET /api/linguicas
   * Listar todas as linguiças (público)
   * Mapeia para produtos do banco de dados
   */
  async listar(req, res) {
    try {
      const linguicas = await produtoRepo.getAllProdutos();
      return jsonSuccess(res, { data: linguicas }, 'linguiças listadas');
    } catch (err) {
      console.error('❌ Erro ao listar linguiças:', err.message);
      return jsonError(res, 'Erro ao listar linguiças', 500);
    }
  },

  /**
   * GET /api/linguicas/:id
   * Obter linguiça por ID (público)
   */
  async obter(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID inválido', 400);
      }

      const linguica = await produtoRepo.getProdutoById(parseInt(id));

      if (!linguica) {
        return jsonError(res, 'Linguiça não encontrada', 404);
      }

      return jsonSuccess(res, { data: linguica }, 'linguiça obtida');
    } catch (err) {
      console.error('❌ Erro ao obter linguiça:', err.message);
      return jsonError(res, 'Erro ao obter linguiça', 500);
    }
  },

  /**
   * POST /api/linguicas
   * Criar nova linguiça (admin)
   */
  async criar(req, res) {
    try {
      const { nome, descricao, preco, estoque, imagem } = req.body;

      if (!nome || nome.trim() === '') {
        return jsonError(res, 'Nome é obrigatório', 400);
      }

      if (preco === undefined || preco === null || isNaN(preco)) {
        return jsonError(res, 'Preço deve ser um número válido', 400);
      }

      if (parseFloat(preco) <= 0) {
        return jsonError(res, 'Preço deve ser maior que zero', 400);
      }

      if (estoque !== undefined && (isNaN(estoque) || parseInt(estoque) < 0)) {
        return jsonError(res, 'Estoque deve ser um número não-negativo', 400);
      }

      const linguica = await linguicaRepo.createLinguica(
        nome.trim(),
        descricao ? descricao.trim() : '',
        parseFloat(preco),
        estoque ? parseInt(estoque) : 0,
        imagem || null
      );

      return jsonSuccess(res, { data: linguica }, 'linguiça criada', 201);
    } catch (err) {
      console.error('❌ Erro ao criar linguiça:', err.message);

      if (err.message.includes('já cadastrado')) {
        return jsonError(res, err.message, 409);
      }

      return jsonError(res, err.message || 'Erro ao criar linguiça', 500);
    }
  },

  /**
   * PUT /api/linguicas/:id
   * Atualizar linguiça (admin)
   */
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, descricao, preco, estoque, imagem } = req.body;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID inválido', 400);
      }

      const updates = {};

      if (nome !== undefined && nome.trim() !== '') {
        updates.nome = nome.trim();
      }

      if (descricao !== undefined) {
        updates.descricao = descricao.trim();
      }

      if (preco !== undefined) {
        if (isNaN(preco)) {
          return jsonError(res, 'Preço deve ser um número válido', 400);
        }
        if (parseFloat(preco) <= 0) {
          return jsonError(res, 'Preço deve ser maior que zero', 400);
        }
        updates.preco = parseFloat(preco);
      }

      if (estoque !== undefined) {
        if (isNaN(estoque)) {
          return jsonError(res, 'Estoque deve ser um número válido', 400);
        }
        if (parseInt(estoque) < 0) {
          return jsonError(res, 'Estoque não pode ser negativo', 400);
        }
        updates.estoque = parseInt(estoque);
      }

      if (imagem !== undefined) {
        updates.imagem = imagem;
      }

      const linguica = await linguicaRepo.updateLinguica(parseInt(id), updates);

      return jsonSuccess(res, { data: linguica }, 'linguiça atualizada');
    } catch (err) {
      console.error('❌ Erro ao atualizar linguiça:', err.message);

      if (err.message.includes('não encontrada')) {
        return jsonError(res, err.message, 404);
      }

      if (err.message.includes('já cadastrado')) {
        return jsonError(res, err.message, 409);
      }

      return jsonError(res, err.message || 'Erro ao atualizar linguiça', 500);
    }
  },

  /**
   * DELETE /api/linguicas/:id
   * Deletar linguiça (admin)
   */
  async deletar(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID inválido', 400);
      }

      const linguica = await linguicaRepo.deleteLinguica(parseInt(id));

      return jsonSuccess(res, { data: linguica }, 'linguiça deletada');
    } catch (err) {
      console.error('❌ Erro ao deletar linguiça:', err.message);

      if (err.message.includes('não encontrada')) {
        return jsonError(res, err.message, 404);
      }

      return jsonError(res, err.message || 'Erro ao deletar linguiça', 500);
    }
  }
};

module.exports = LinguicaController;
