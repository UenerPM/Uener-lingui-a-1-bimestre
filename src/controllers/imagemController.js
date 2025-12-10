/**
 * CONTROLADOR DE IMAGENS - VERSÃO 3 (Com Service Layer)
 */

const fs = require('fs');
const imagemService = require('../services/imagemService');

function jsonError(res, message = 'Erro', statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

/**
 * GET /api/imagem/:idProduto
 * Serve imagem do produto
 */
async function servirImagemProduto(req, res) {
  try {
    const { idProduto } = req.params;
    if (!idProduto) return jsonError(res, 'ID do produto é obrigatório', 400);

    const resultado = await imagemService.servirImagemProduto(idProduto);
    
    if (!resultado.filePath || !fs.existsSync(resultado.filePath)) {
      return res.status(404).json({ success: false, message: 'Imagem não encontrada' });
    }

    res.setHeader('Content-Type', resultado.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    const stream = fs.createReadStream(resultado.filePath);
    stream.pipe(res);
  } catch (err) {
    console.error('❌ Erro ao servir imagem:', err.message);
    return jsonError(res, err.message || 'Erro ao servir imagem', 500);
  }
}

module.exports = {
  servirImagemProduto
};
