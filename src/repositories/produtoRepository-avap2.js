const pool = require('../config/db');

/**
 * produtoRepository-avap2.js
 * Repositório para produtos com imagens do banco avap2
 * ATUALIZADO: Mapeia caminho BD para urlImagem API
 */

/**
 * Extrai nome do arquivo do caminho
 * Ex: "uploads/linguicas/calabresa.png" → "calabresa.png"
 */
function extrairNomeArquivo(caminho) {
  if (!caminho) return null;
  const partes = caminho.split('/');
  return partes[partes.length - 1];
}

/**
 * Mapeia linha do banco para objeto produto com urlImagem
 */
function mapearProduto(row) {
  if (!row) return null;
  const nomeArquivo = extrairNomeArquivo(row.imagem);
  return {
    ...row,
    urlImagem: nomeArquivo ? `/api/imagens/${nomeArquivo}` : null,
    imagem: row.imagem // Manter original para compatibilidade
  };
}

async function getAllProdutos() {
  try {
    const res = await pool.query(
      `SELECT 
        p.idproduto, 
        p.nomeproduto, 
        p.precounitario as preco, 
        p.quantidadeemestoque as estoque, 
        i.caminho as imagem,
        p.id_imagem
       FROM produto p 
       LEFT JOIN imagem i ON p.id_imagem = i.id
       ORDER BY p.nomeproduto`
    );
    return res.rows.map(mapearProduto);
  } catch (err) {
    console.error('produtoRepository.getAllProdutos error:', err.message);
    throw err;
  }
}

async function getProdutoById(idproduto) {
  try {
    const res = await pool.query(
      `SELECT 
        p.idproduto, 
        p.nomeproduto, 
        p.precounitario as preco, 
        p.quantidadeemestoque as estoque, 
        i.caminho as imagem,
        p.id_imagem
       FROM produto p 
       LEFT JOIN imagem i ON p.id_imagem = i.id
       WHERE p.idproduto = $1`,
      [idproduto]
    );
    return mapearProduto(res.rows[0]);
  } catch (err) {
    console.error('produtoRepository.getProdutoById error:', err.message);
    throw err;
  }
}

async function getProdutosByIds(idprodutos) {
  if (!idprodutos || idprodutos.length === 0) return [];
  try {
    const res = await pool.query(
      `SELECT 
        p.idproduto, 
        p.nomeproduto, 
        p.precounitario as preco, 
        p.quantidadeemestoque as estoque, 
        i.caminho as imagem,
        p.id_imagem
       FROM produto p 
       LEFT JOIN imagem i ON p.id_imagem = i.id
       WHERE p.idproduto = ANY($1)`,
      [idprodutos]
    );
    return res.rows.map(mapearProduto);
  } catch (err) {
    console.error('produtoRepository.getProdutosByIds error:', err.message);
    throw err;
  }
}

async function updateEstoque(idproduto, novoEstoque) {
  try {
    const res = await pool.query(
      'UPDATE produto SET quantidadeemestoque = $1 WHERE idproduto = $2 RETURNING idproduto, quantidadeemestoque as estoque',
      [novoEstoque, idproduto]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error('produtoRepository.updateEstoque error:', err.message);
    throw err;
  }
}

module.exports = {
  getAllProdutos,
  getProdutoById,
  getProdutosByIds,
  updateEstoque
};
