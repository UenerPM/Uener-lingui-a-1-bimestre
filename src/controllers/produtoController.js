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

  /**
   * GET /api/produtos/:id
   * Busca um produto específico
   */
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
  }
};

module.exports = ProdutoController;
