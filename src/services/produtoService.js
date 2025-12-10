const produtoRepository = require('../repositories/produtoRepository-avap2');

/**
 * Listar todos os produtos
 */
async function getAllProdutos() {
  try {
    const produtos = await produtoRepository.getAllProdutos();
    return produtos;
  } catch (error) {
    console.error('[ProdutoService] Erro ao listar produtos:', error);
    throw new Error('Falha ao listar produtos');
  }
}

/**
 * Buscar produto por ID
 */
async function getProdutoById(id) {
  try {
    if (!id) throw new Error('ID do produto é obrigatório');
    const produto = await produtoRepository.getProdutoById(id);
    if (!produto) throw new Error('Produto não encontrado');
    return produto;
  } catch (error) {
    console.error('[ProdutoService] Erro ao buscar produto:', error);
    throw error;
  }
}

/**
 * Buscar produto por nome
 */
async function getProdutoByNome(nome) {
  try {
    if (!nome) throw new Error('Nome do produto é obrigatório');
    const produto = await produtoRepository.getProdutoByNome(nome);
    return produto;
  } catch (error) {
    console.error('[ProdutoService] Erro ao buscar produto por nome:', error);
    throw error;
  }
}

/**
 * Criar novo produto
 */
async function createProduto(nome, preco, imagem = null) {
  try {
    if (!nome || !preco) throw new Error('Nome e preço são obrigatórios');
    if (preco <= 0) throw new Error('Preço deve ser maior que zero');
    
    const produto = await produtoRepository.createProduto(nome, preco, imagem);
    return produto;
  } catch (error) {
    console.error('[ProdutoService] Erro ao criar produto:', error);
    throw error;
  }
}

/**
 * Atualizar produto
 */
async function updateProduto(id, nome, preco, imagem = null) {
  try {
    if (!id) throw new Error('ID do produto é obrigatório');
    if (!nome || !preco) throw new Error('Nome e preço são obrigatórios');
    if (preco <= 0) throw new Error('Preço deve ser maior que zero');
    
    await produtoRepository.updateProduto(id, nome, preco, imagem);
    return await getProdutoById(id);
  } catch (error) {
    console.error('[ProdutoService] Erro ao atualizar produto:', error);
    throw error;
  }
}

/**
 * Deletar produto
 */
async function deleteProduto(id) {
  try {
    if (!id) throw new Error('ID do produto é obrigatório');
    await produtoRepository.deleteProduto(id);
    return { success: true, message: 'Produto deletado com sucesso' };
  } catch (error) {
    console.error('[ProdutoService] Erro ao deletar produto:', error);
    throw error;
  }
}

/**
 * Verificar stock de produto
 */
async function verificarStock(idProduto, quantidade) {
  try {
    if (!idProduto || !quantidade) throw new Error('ID do produto e quantidade são obrigatórios');
    const produto = await getProdutoById(idProduto);
    
    if (!produto.estoque || produto.estoque < quantidade) {
      throw new Error(`Estoque insuficiente. Disponível: ${produto.estoque || 0}`);
    }
    return true;
  } catch (error) {
    console.error('[ProdutoService] Erro ao verificar stock:', error);
    throw error;
  }
}

module.exports = {
  getAllProdutos,
  getProdutoById,
  getProdutoByNome,
  createProduto,
  updateProduto,
  deleteProduto,
  verificarStock
};
