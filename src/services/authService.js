const authRepository = require('../repositories/authRepository-avap2');
const bcrypt = require('bcryptjs');

/**
 * Login do usuário
 * Compatível com repositórios avap2 (validateCredentials) e genéricos
 */
async function login(email, senha) {
  try {
    if (!email || !senha) throw new Error('Email e senha são obrigatórios');

    // Preferir método validateCredentials do repositório se existir
    if (typeof authRepository.validateCredentials === 'function') {
      const validated = await authRepository.validateCredentials(email, senha);
      if (!validated) throw new Error('Credenciais inválidas');

      // Se o repositório já validou, retorna objeto padronizado
      return {
        id: validated.id || validated.idpessoa || null,
        cpf: validated.cpf || validated.cpfpessoa || null,
        nome: validated.nome || validated.nomepessoa || null,
        email: validated.email || email,
        isAdmin: validated.isAdmin || validated.isadmin || false
      };
    }

    // Fallback: buscar usuário e comparar senha com bcrypt
    const usuario = await authRepository.getUserByEmail(email);
    if (!usuario) throw new Error('Usuário não encontrado');

    const senhaHash = usuario.senha || usuario.password || usuario.senha_pessoa || '';
    // Se não houver hash, comparar diretamente (inseguro)
    if (!senhaHash) {
      if (senha !== '') throw new Error('Senha incorreta');
    } else {
      const senhaValida = await bcrypt.compare(senha, String(senhaHash));
      if (!senhaValida) throw new Error('Senha incorreta');
    }

    return {
      id: usuario.id || usuario.idpessoa || null,
      cpf: usuario.cpf || usuario.pessoaCpfPessoa || usuario.cpfpessoa || null,
      nome: usuario.nome || usuario.nomepessoa || null,
      email: usuario.email,
      isAdmin: usuario.isadmin || usuario.is_admin || false
    };
  } catch (error) {
    console.error('[AuthService] Erro no login:', error.message || error);
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
