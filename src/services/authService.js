const authRepository = require('../repositories/authRepository-avap2');
const bcrypt = require('bcryptjs');

/**
 * Login do usuário
 */
async function login(email, senha) {
  try {
    if (!email || !senha) throw new Error('Email e senha são obrigatórios');
    
    const usuario = await authRepository.getUserByEmail(email);
    if (!usuario) throw new Error('Usuário não encontrado');
    
    // Verificar se senha está correta
    const senhaValida = await bcrypt.compare(senha, usuario.senha || usuario.password || '');
    if (!senhaValida) throw new Error('Senha incorreta');
    
    return {
      id: usuario.id || usuario.idpessoa,
      cpf: usuario.cpf || usuario.pessoaCpfPessoa,
      nome: usuario.nome,
      email: usuario.email,
      isAdmin: usuario.isadmin || usuario.is_admin || false
    };
  } catch (error) {
    console.error('[AuthService] Erro no login:', error);
    throw error;
  }
}

/**
 * Buscar usuário por email
 */
async function getUserByEmail(email) {
  try {
    if (!email) throw new Error('Email é obrigatório');
    const usuario = await authRepository.getUserByEmail(email);
    return usuario;
  } catch (error) {
    console.error('[AuthService] Erro ao buscar usuário:', error);
    throw error;
  }
}

/**
 * Criar novo usuário
 */
async function createUser(email, senha, nome = null, cpf = null) {
  try {
    if (!email || !senha) throw new Error('Email e senha são obrigatórios');
    
    // Verificar se email já existe
    const existente = await getUserByEmail(email);
    if (existente) throw new Error('Usuário com este email já existe');
    
    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);
    
    const usuario = await authRepository.createUser(email, senhaHash, nome, cpf);
    return usuario;
  } catch (error) {
    console.error('[AuthService] Erro ao criar usuário:', error);
    throw error;
  }
}

/**
 * Verificar se usuário é admin
 */
async function isAdmin(email) {
  try {
    if (!email) throw new Error('Email é obrigatório');
    const usuario = await getUserByEmail(email);
    if (!usuario) return false;
    return usuario.isadmin || usuario.is_admin || false;
  } catch (error) {
    console.error('[AuthService] Erro ao verificar admin:', error);
    return false;
  }
}

/**
 * Atualizar senha do usuário
 */
async function updatePassword(email, senhaAtual, senhaNova) {
  try {
    if (!email || !senhaAtual || !senhaNova) throw new Error('Email, senha atual e nova senha são obrigatórios');
    
    const usuario = await getUserByEmail(email);
    if (!usuario) throw new Error('Usuário não encontrado');
    
    // Verificar senha atual
    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha || usuario.password || '');
    if (!senhaValida) throw new Error('Senha atual incorreta');
    
    // Hash da nova senha
    const novaHash = await bcrypt.hash(senhaNova, 10);
    
    await authRepository.updatePassword(email, novaHash);
    return { success: true, message: 'Senha atualizada com sucesso' };
  } catch (error) {
    console.error('[AuthService] Erro ao atualizar senha:', error);
    throw error;
  }
}

module.exports = {
  login,
  getUserByEmail,
  createUser,
  isAdmin,
  updatePassword
};
