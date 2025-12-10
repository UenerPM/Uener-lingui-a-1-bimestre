const fs = require('fs');
const path = require('path');

const IMAGE_DIR = path.join(__dirname, '../../public/img');
const FALLBACK_IMAGE = path.join(__dirname, '../../public/img/no-image.png');

/**
 * Servir imagem de produto
 * Tenta: local → CRUD → fallback no-image.png
 */
async function servirImagemProduto(idProduto) {
  try {
    if (!idProduto) throw new Error('ID do produto é obrigatório');
    
    // Tentar caminho local
    const localPath = path.join(IMAGE_DIR, `produto_${idProduto}.png`);
    if (fs.existsSync(localPath)) {
      return { filePath: localPath, mimeType: 'image/png' };
    }
    
    // Tentar jpg
    const jpgPath = path.join(IMAGE_DIR, `produto_${idProduto}.jpg`);
    if (fs.existsSync(jpgPath)) {
      return { filePath: jpgPath, mimeType: 'image/jpeg' };
    }
    
    // Fallback
    if (fs.existsSync(FALLBACK_IMAGE)) {
      return { filePath: FALLBACK_IMAGE, mimeType: 'image/png' };
    }
    
    throw new Error('Nenhuma imagem encontrada');
  } catch (error) {
    console.error('[ImagemService] Erro ao servir imagem:', error);
    throw error;
  }
}

/**
 * Verificar se imagem existe
 */
async function imagemExists(idProduto) {
  try {
    if (!idProduto) throw new Error('ID do produto é obrigatório');
    
    const pngPath = path.join(IMAGE_DIR, `produto_${idProduto}.png`);
    const jpgPath = path.join(IMAGE_DIR, `produto_${idProduto}.jpg`);
    
    return fs.existsSync(pngPath) || fs.existsSync(jpgPath);
  } catch (error) {
    console.error('[ImagemService] Erro ao verificar imagem:', error);
    return false;
  }
}

/**
 * Listar todas as imagens de produtos
 */
async function listarImagensProdutos() {
  try {
    if (!fs.existsSync(IMAGE_DIR)) {
      return [];
    }
    
    const files = fs.readdirSync(IMAGE_DIR);
    const imagens = files
      .filter(f => f.startsWith('produto_') && (f.endsWith('.png') || f.endsWith('.jpg')))
      .map(f => {
        const match = f.match(/produto_(\d+)\./);
        return {
          idProduto: match ? match[1] : null,
          arquivo: f,
          caminho: path.join(IMAGE_DIR, f)
        };
      });
    
    return imagens;
  } catch (error) {
    console.error('[ImagemService] Erro ao listar imagens:', error);
    throw error;
  }
}

/**
 * Deletar imagem de produto
 */
async function deleteImagem(idProduto) {
  try {
    if (!idProduto) throw new Error('ID do produto é obrigatório');
    
    const pngPath = path.join(IMAGE_DIR, `produto_${idProduto}.png`);
    const jpgPath = path.join(IMAGE_DIR, `produto_${idProduto}.jpg`);
    
    if (fs.existsSync(pngPath)) {
      fs.unlinkSync(pngPath);
      return { success: true, message: 'Imagem PNG deletada' };
    }
    
    if (fs.existsSync(jpgPath)) {
      fs.unlinkSync(jpgPath);
      return { success: true, message: 'Imagem JPG deletada' };
    }
    
    return { success: false, message: 'Imagem não encontrada' };
  } catch (error) {
    console.error('[ImagemService] Erro ao deletar imagem:', error);
    throw error;
  }
}

module.exports = {
  servirImagemProduto,
  imagemExists,
  listarImagensProdutos,
  deleteImagem
};
