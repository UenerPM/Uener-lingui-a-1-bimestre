const produtoService = require('../services/produtoService');

function jsonError(res, message = 'Erro', statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

function jsonSuccess(res, data = {}, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, ...data });
}

const ProdutoController = {
  /**
   * GET /api/produtos
   * Lista todos os produtos com imagens
   */
  async getAllProdutos(req, res) {
    try {
      const produtos = await produtoService.getAllProdutos();
      return jsonSuccess(res, { data: produtos }, 'Produtos listados', 200);
    } catch (err) {
      console.error('❌ Erro ao listar produtos:', err.message);
      return jsonError(res, err.message || 'Erro ao listar produtos', 500);
    }
  },

  async getProdutoById(req, res) {
    try {
      const { id } = req.params;
      if (!id) return jsonError(res, 'ID do produto é obrigatório', 400);

      const produto = await produtoService.getProdutoById(parseInt(id));

      if (!produto) {
        return jsonError(res, 'Produto não encontrado', 404);
      }

      return jsonSuccess(res, { data: produto }, 'Produto encontrado', 200);
    } catch (err) {
      console.error('❌ Erro ao buscar produto:', err.message);
      return jsonError(res, err.message || 'Erro ao buscar produto', 500);
    }
  },

  // Adaptadores para manter compatibilidade com as rotas antigas
  async listar(req, res) {
    return this.getAllProdutos(req, res);
  },

  async obter(req, res) {
    return this.getProdutoById(req, res);
  },

  async criar(req, res) {
    try {
      const { nome, preco, imagem } = req.body || {};
      const produto = await produtoService.createProduto(nome, parseFloat(preco), imagem || null);
      return jsonSuccess(res, { data: produto }, 'produto criado', 201);
    } catch (err) {
      console.error('❌ Erro ao criar produto:', err.message);
      return jsonError(res, err.message || 'Erro ao criar produto', 500);
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, preco, imagem } = req.body || {};
      const updated = await produtoService.updateProduto(parseInt(id), nome, parseFloat(preco), imagem || null);
      return jsonSuccess(res, { data: updated }, 'produto atualizado');
    } catch (err) {
      console.error('❌ Erro ao atualizar produto:', err.message);
      return jsonError(res, err.message || 'Erro ao atualizar produto', 500);
    }
  },

  async deletar(req, res) {
    try {
      const { id } = req.params;
      const result = await produtoService.deleteProduto(parseInt(id));
      return jsonSuccess(res, { data: result }, 'produto deletado');
    } catch (err) {
      console.error('❌ Erro ao deletar produto:', err.message);
      return jsonError(res, err.message || 'Erro ao deletar produto', 500);
    }
  }
};

module.exports = ProdutoController;
