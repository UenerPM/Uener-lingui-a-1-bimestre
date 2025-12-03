/**
 * PRODUTO CONTROLLER
 * Lógica de negócio para gerenciar produtos
 */

const produtoRepo = require('../repositories/produtoRepository');
const imagemCtrl = require('./imagemController');

/**
 * Helper: Resposta JSON padronizada (sucesso)
 */
function jsonSuccess(res, data = {}, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
}

/**
 * Helper: Resposta JSON padronizada (erro)
 */
function jsonError(res, message = 'Erro', statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    message
  });
}

const ProdutoController = {
  /**
   * GET /api/produtos
   * Listar todos os produtos (público)
   */
  async listar(req, res) {
    try {
      const produtos = await produtoRepo.getAllProdutos();
      return jsonSuccess(res, { data: produtos }, 'produtos listados');
    } catch (err) {
      console.error('❌ Erro ao listar produtos:', err.message);
      return jsonError(res, 'Erro ao listar produtos', 500);
    }
  },

  /**
   * GET /api/produtos/:id
   * Obter um produto (público)
   */
  async obter(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID do produto inválido', 400);
      }

      const produto = await produtoRepo.getProdutoById(parseInt(id));

      if (!produto) {
        return jsonError(res, 'Produto não encontrado', 404);
      }

      return jsonSuccess(res, { data: produto }, 'produto obtido');
    } catch (err) {
      console.error('❌ Erro ao obter produto:', err.message);
      return jsonError(res, 'Erro ao obter produto', 500);
    }
  },

  /**
   * POST /api/produtos
   * Criar novo produto (admin only)
   */
  async criar(req, res) {
    try {
      const { nome, categoria, descricao, preco, estoque, imagem } = req.body;

      // Validações
      if (!nome || nome.trim() === '') {
        return jsonError(res, 'Nome do produto é obrigatório', 400);
      }

      if (!categoria || categoria.trim() === '') {
        return jsonError(res, 'Categoria é obrigatória', 400);
      }

      if (!preco || isNaN(preco) || parseFloat(preco) <= 0) {
        return jsonError(res, 'Preço deve ser um número positivo', 400);
      }

      if (estoque !== undefined && (isNaN(estoque) || parseInt(estoque) < 0)) {
        return jsonError(res, 'Estoque deve ser um número não-negativo', 400);
      }

      const produto = await produtoRepo.createProduto(
        nome.trim(),
        categoria ? categoria.trim() : null,
        descricao ? descricao.trim() : null,
        parseFloat(preco),
        estoque ? parseInt(estoque) : 0,
        imagem ? imagem : null
      );

      // Se foi fornecido caminho/identificador de imagem, tentar sincronizar a imagem
      if (imagem) {
        try {
          await imagemCtrl.sincronizarImagem(typeof imagem === 'string' ? imagem : produto.imagem);
        } catch (syncErr) {
          console.warn('⚠️ Falha ao sincronizar imagem do produto:', syncErr.message);
        }
      }

      return jsonSuccess(res, { data: produto }, 'produto criado', 201);
    } catch (err) {
      console.error('❌ Erro ao criar produto:', err.message);

      if (err.message.includes('já existe')) {
        return jsonError(res, err.message, 409);
      }

      return jsonError(res, err.message || 'Erro ao criar produto', 500);
    }
  },

  /**
   * PUT /api/produtos/:id
   * Atualizar produto (admin only)
   */
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, categoria, descricao, preco, estoque, imagem } = req.body;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID do produto inválido', 400);
      }

      // Validações (se fornecidos)
      if (nome !== undefined && (typeof nome !== 'string' || nome.trim() === '')) {
        return jsonError(res, 'Nome deve ser uma string não-vazia', 400);
      }

      if (categoria !== undefined && (typeof categoria !== 'string' || categoria.trim() === '')) {
        return jsonError(res, 'Categoria deve ser uma string não-vazia', 400);
      }

      if (preco !== undefined && (isNaN(preco) || parseFloat(preco) <= 0)) {
        return jsonError(res, 'Preço deve ser um número positivo', 400);
      }

      if (estoque !== undefined && (isNaN(estoque) || parseInt(estoque) < 0)) {
        return jsonError(res, 'Estoque deve ser um número não-negativo', 400);
      }

      const produto = await produtoRepo.updateProduto(
        parseInt(id),
        nome ? nome.trim() : undefined,
        categoria ? categoria.trim() : undefined,
        descricao ? descricao.trim() : undefined,
        preco ? parseFloat(preco) : undefined,
        estoque !== undefined ? parseInt(estoque) : undefined,
        imagem !== undefined ? imagem : undefined
      );

      // Se imagem foi fornecida (string ou id), tentar sincronizar
      if (imagem !== undefined && imagem) {
        try {
          await imagemCtrl.sincronizarImagem(typeof imagem === 'string' ? imagem : produto.imagem);
        } catch (syncErr) {
          console.warn('⚠️ Falha ao sincronizar imagem do produto (update):', syncErr.message);
        }
      }

      return jsonSuccess(res, { data: produto }, 'produto atualizado');
    } catch (err) {
      console.error('❌ Erro ao atualizar produto:', err.message);

      if (err.message.includes('não encontrado')) {
        return jsonError(res, err.message, 404);
      }

      if (err.message.includes('já existe')) {
        return jsonError(res, err.message, 409);
      }

      return jsonError(res, err.message || 'Erro ao atualizar produto', 500);
    }
  },

  /**
   * DELETE /api/produtos/:id
   * Deletar produto (admin only)
   */
  async deletar(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID do produto inválido', 400);
      }

      const produto = await produtoRepo.deleteProduto(parseInt(id));

      return jsonSuccess(res, { data: produto }, 'produto deletado');
    } catch (err) {
      console.error('❌ Erro ao deletar produto:', err.message);

      if (err.message.includes('não encontrado')) {
        return jsonError(res, err.message, 404);
      }

      return jsonError(res, err.message || 'Erro ao deletar produto', 500);
    }
  }
};

module.exports = ProdutoController;
