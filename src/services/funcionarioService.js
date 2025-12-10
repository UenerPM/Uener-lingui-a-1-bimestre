const funcionarioRepository = require('../repositories/funcionarioRepository');

/**
 * Listar todos os funcionários ATIVOS
 */
async function getActiveFuncionarios() {
  try {
    const funcionarios = await funcionarioRepository.getAllFuncionarios();
    // getAllFuncionarios já filtra por deleted_at IS NULL
    return funcionarios;
  } catch (error) {
    console.error('[FuncionarioService] Erro ao listar funcionários ativos:', error);
    throw new Error('Falha ao listar funcionários');
  }
}

/**
 * Buscar funcionário por CPF
 */
async function getFuncionarioByCpf(cpf) {
  try {
    if (!cpf) throw new Error('CPF é obrigatório');
    const funcionario = await funcionarioRepository.getFuncionarioByCpf(cpf);
    if (!funcionario) throw new Error('Funcionário não encontrado');
    return funcionario;
  } catch (error) {
    console.error('[FuncionarioService] Erro ao buscar funcionário:', error);
    throw error;
  }
}

/**
 * Selecionar funcionário aleatório ATIVO
 */
async function getRandomActiveFuncionario() {
  try {
    const funcionarios = await getActiveFuncionarios();
    if (!funcionarios || funcionarios.length === 0) {
      throw new Error('Nenhum funcionário ativo disponível');
    }
    
    const random = Math.floor(Math.random() * funcionarios.length);
    return funcionarios[random];
  } catch (error) {
    console.error('[FuncionarioService] Erro ao selecionar funcionário aleatório:', error);
    throw error;
  }
}

/**
 * Verificar se funcionário está ativo
 */
async function isFuncionarioActive(cpf) {
  try {
    if (!cpf) throw new Error('CPF é obrigatório');
    const funcionario = await getFuncionarioByCpf(cpf);
    // Se encontrou, está ativo (getAllFuncionarios filtra por deleted_at IS NULL)
    return true;
  } catch (error) {
    // Se não encontrou, está inativo ou não existe
    return false;
  }
}

/**
 * Criar novo funcionário
 */
async function createFuncionario(cpf, nome, email = null, telefone = null) {
  try {
    if (!cpf || !nome) throw new Error('CPF e nome são obrigatórios');
    
    // Verificar se já existe
    try {
      await getFuncionarioByCpf(cpf);
      throw new Error('Funcionário com este CPF já existe');
    } catch (err) {
      if (err.message.includes('já existe')) throw err;
      // Se não encontrou, continua
    }
    
    const funcionario = await funcionarioRepository.createFuncionario(cpf, nome, email, telefone);
    return funcionario;
  } catch (error) {
    console.error('[FuncionarioService] Erro ao criar funcionário:', error);
    throw error;
  }
}

/**
 * Desativar funcionário (soft delete)
 */
async function deactivateFuncionario(cpf) {
  try {
    if (!cpf) throw new Error('CPF é obrigatório');
    await getFuncionarioByCpf(cpf); // Verifica se existe
    
    await funcionarioRepository.deactivateFuncionario(cpf);
    return { success: true, message: 'Funcionário desativado' };
  } catch (error) {
    console.error('[FuncionarioService] Erro ao desativar funcionário:', error);
    throw error;
  }
}

module.exports = {
  getActiveFuncionarios,
  getFuncionarioByCpf,
  getRandomActiveFuncionario,
  isFuncionarioActive,
  createFuncionario,
  deactivateFuncionario
};
