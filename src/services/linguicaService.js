const linguicaRepository = require('../repositories/linguicaRepository');

/**
 * Listar todas as linguiças
 */
async function getAllLinguicas() {
  try {
    const linguicas = await linguicaRepository.getAllLinguicas();
    return linguicas;
  } catch (error) {
    console.error('[LinguicaService] Erro ao listar linguiças:', error);
    throw new Error('Falha ao listar linguiças');
  }
}

/**
 * Buscar linguiça por ID
 */
async function getLinguicaById(id) {
  try {
    if (!id) throw new Error('ID da linguiça é obrigatório');
    const linguica = await linguicaRepository.getLinguicaById(id);
    if (!linguica) throw new Error('Linguiça não encontrada');
    return linguica;
  } catch (error) {
    console.error('[LinguicaService] Erro ao buscar linguiça:', error);
    throw error;
  }
}

/**
 * Buscar linguiça por nome
 */
async function getLinguicaByNome(nome) {
  try {
    if (!nome) throw new Error('Nome da linguiça é obrigatório');
    const linguica = await linguicaRepository.getLinguicaByNome(nome);
    return linguica;
  } catch (error) {
    console.error('[LinguicaService] Erro ao buscar linguiça por nome:', error);
    throw error;
  }
}

/**
 * Criar nova linguiça
 */
async function createLinguica(nome, preco, imagem = null) {
  try {
    if (!nome || !preco) throw new Error('Nome e preço são obrigatórios');
    if (preco <= 0) throw new Error('Preço deve ser maior que zero');
    
    const linguica = await linguicaRepository.createLinguica(nome, preco, imagem);
    return linguica;
  } catch (error) {
    console.error('[LinguicaService] Erro ao criar linguiça:', error);
    throw error;
  }
}

/**
 * Atualizar linguiça
 */
async function updateLinguica(id, nome, preco, imagem = null) {
  try {
    if (!id) throw new Error('ID da linguiça é obrigatório');
    if (!nome || !preco) throw new Error('Nome e preço são obrigatórios');
    if (preco <= 0) throw new Error('Preço deve ser maior que zero');
    
    await linguicaRepository.updateLinguica(id, nome, preco, imagem);
    return await getLinguicaById(id);
  } catch (error) {
    console.error('[LinguicaService] Erro ao atualizar linguiça:', error);
    throw error;
  }
}

/**
 * Deletar linguiça
 */
async function deleteLinguica(id) {
  try {
    if (!id) throw new Error('ID da linguiça é obrigatório');
    await linguicaRepository.deleteLinguica(id);
    return { success: true, message: 'Linguiça deletada com sucesso' };
  } catch (error) {
    console.error('[LinguicaService] Erro ao deletar linguiça:', error);
    throw error;
  }
}

module.exports = {
  getAllLinguicas,
  getLinguicaById,
  getLinguicaByNome,
  createLinguica,
  updateLinguica,
  deleteLinguica
};
