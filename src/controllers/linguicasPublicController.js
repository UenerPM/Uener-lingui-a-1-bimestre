/**
 * LINGUICAS PUBLIC CONTROLLER
 * Retorna linguiças no formato correto com imagem via API
 * 
 * Formato: { id, nome, preco, imagem: "/api/imagem/ID" }
 */

const pool = require('../config/db');

function jsonSuccess(res, data = {}, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, ...data });
}

function jsonError(res, message = 'Erro', statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

const LinguicasPublicController = {
  /**
   * GET /api/linguicas-novo
   * Listar linguiças com imagens via /api/imagem/:idProduto
   * 
   * Resposta:
   * {
   *   success: true,
   *   message: "linguiças listadas",
   *   data: [
   *     { id: 1, nome: "Calabresa", preco: 15.90, imagem: "/api/imagem/1" },
   *     ...
   *   ]
   * }
   */
  async listar(req, res) {
    try {
      const result = await pool.query(
        `SELECT 
          p.idproduto as id,
          p.nomeproduto as nome,
          p.precounitario as preco,
          p.quantidadeemestoque as estoque
         FROM produto p
         ORDER BY p.nomeproduto`
      );

      // Mapear para o formato correto
      const linguicas = result.rows.map(row => ({
        id: row.id,
        nome: row.nome,
        preco: parseFloat(row.preco || 0).toFixed(2),
        estoque: row.estoque,
        imagem: `/api/imagem/${row.id}` // URL da API para buscar imagem
      }));

      console.log('[linguicas-novo] ✓ Retornando', linguicas.length, 'linguiças');
      return jsonSuccess(res, { data: linguicas }, 'linguiças listadas');

    } catch (err) {
      console.error('[linguicas-novo] ✗ Erro ao listar:', err.message);
      return jsonError(res, 'Erro ao listar linguiças', 500);
    }
  },

  /**
   * GET /api/linguicas-novo/:id
   * Obter linguiça específica
   */
  async obter(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return jsonError(res, 'ID inválido', 400);
      }

      const result = await pool.query(
        `SELECT 
          p.idproduto as id,
          p.nomeproduto as nome,
          p.precounitario as preco,
          p.quantidadeemestoque as estoque
         FROM produto p
         WHERE p.idproduto = $1`,
        [parseInt(id)]
      );

      if (result.rows.length === 0) {
        return jsonError(res, 'Linguiça não encontrada', 404);
      }

      const row = result.rows[0];
      const linguica = {
        id: row.id,
        nome: row.nome,
        preco: parseFloat(row.preco || 0).toFixed(2),
        estoque: row.estoque,
        imagem: `/api/imagem/${row.id}`
      };

      console.log('[linguicas-novo] ✓ Linguiça obtida:', id);
      return jsonSuccess(res, { data: linguica }, 'linguiça obtida');

    } catch (err) {
      console.error('[linguicas-novo] ✗ Erro ao obter:', err.message);
      return jsonError(res, 'Erro ao obter linguiça', 500);
    }
  }
};

module.exports = LinguicasPublicController;
