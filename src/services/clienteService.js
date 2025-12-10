const clienteRepository = require('../repositories/clienteRepository');

/**
 * Buscar cliente por CPF
 */
async function getClienteByCpf(cpf) {
  try {
    if (!cpf) throw new Error('CPF é obrigatório');
    const cliente = await clienteRepository.getClienteByCpf(cpf);
    return cliente;
  } catch (error) {
    console.error('[ClienteService] Erro ao buscar cliente:', error);
    throw error;
  }
}

/**
 * Listar todos os clientes
 */
async function getAllClientes() {
  try {
    const clientes = await clienteRepository.getAllClientes();
    return clientes;
  } catch (error) {
    console.error('[ClienteService] Erro ao listar clientes:', error);
    throw new Error('Falha ao listar clientes');
  }
}

/**
 * Criar novo cliente
 */
async function createCliente(cpf, nome, email, telefone = null) {
  try {
    if (!cpf || !nome || !email) throw new Error('CPF, nome e email são obrigatórios');
    
    // Verificar se cliente já existe
    const existente = await getClienteByCpf(cpf);
    if (existente) throw new Error('Cliente com este CPF já existe');
    
    const cliente = await clienteRepository.createCliente(cpf, nome, email, telefone);
    return cliente;
  } catch (error) {
    console.error('[ClienteService] Erro ao criar cliente:', error);
    throw error;
  }
}

/**
 * Atualizar cliente
 */
async function updateCliente(cpf, nome, email, telefone = null) {
  try {
    if (!cpf) throw new Error('CPF é obrigatório');
    if (!nome || !email) throw new Error('Nome e email são obrigatórios');
    
    await clienteRepository.updateCliente(cpf, nome, email, telefone);
    return await getClienteByCpf(cpf);
  } catch (error) {
    console.error('[ClienteService] Erro ao atualizar cliente:', error);
    throw error;
  }
}

module.exports = {
  getClienteByCpf,
  getAllClientes,
  createCliente,
  updateCliente
};
