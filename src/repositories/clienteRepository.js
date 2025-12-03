/**
 * CLIENTE REPOSITORY
 * Queries parametrizadas para tabela clientes
 */

const pool = require('../config/db');

const ClienteRepository = {
  /**
   * Listar todos os clientes (admin)
   */
  async getAllClientes() {
    const query = `
      SELECT id, user_id, nome_completo, email, telefone, cpf, endereco, numero, 
             complemento, bairro, cidade, estado, cep, created_at, updated_at
      FROM clientes
      ORDER BY nome_completo ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  /**
   * Obter cliente por ID
   */
  async getClienteById(id) {
    const query = `
      SELECT id, user_id, nome_completo, email, telefone, cpf, endereco, numero,
             complemento, bairro, cidade, estado, cep, created_at, updated_at
      FROM clientes
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Obter cliente por user_id (username)
   */
  async getClienteByUserId(user_id) {
    const query = `
      SELECT id, user_id, nome_completo, email, telefone, cpf, endereco, numero,
             complemento, bairro, cidade, estado, cep, created_at, updated_at
      FROM clientes
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [user_id]);
    return result.rows[0] || null;
  },

  /**
   * Criar novo cliente
   */
  async createCliente(nome_completo, email, user_id = null, telefone = null, cpf = null, endereco = null) {
    if (!nome_completo || !email) {
      throw new Error('nome_completo e email são obrigatórios');
    }

    const query = `
      INSERT INTO clientes (nome_completo, email, user_id, telefone, cpf, endereco)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, nome_completo, email, telefone, cpf, endereco, numero,
                complemento, bairro, cidade, estado, cep, created_at
    `;

    try {
      const result = await pool.query(query, [nome_completo, email, user_id, telefone, cpf, endereco]);
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') { // unique_violation
        if (err.constraint === 'clientes_email_key') {
          throw new Error(`Email ${email} já cadastrado`);
        }
        if (err.constraint === 'clientes_cpf_key') {
          throw new Error(`CPF ${cpf} já cadastrado`);
        }
        throw new Error('Dados duplicados');
      }
      throw err;
    }
  },

  /**
   * Atualizar cliente
   */
  async updateCliente(id, updates) {
    const allowedFields = [
      'nome_completo', 'email', 'telefone', 'cpf', 'endereco', 'numero',
      'complemento', 'bairro', 'cidade', 'estado', 'cep'
    ];

    const fieldsToUpdate = [];
    const values = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fieldsToUpdate.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
        paramCount++;
      }
    }

    if (fieldsToUpdate.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    fieldsToUpdate.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE clientes
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, user_id, nome_completo, email, telefone, cpf, endereco, numero,
                complemento, bairro, cidade, estado, cep, updated_at
    `;

    try {
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error(`Cliente ${id} não encontrado`);
      }

      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        if (err.constraint === 'clientes_email_key') {
          throw new Error(`Email ${updates.email} já cadastrado`);
        }
        if (err.constraint === 'clientes_cpf_key') {
          throw new Error(`CPF ${updates.cpf} já cadastrado`);
        }
      }
      throw err;
    }
  },

  /**
   * Deletar cliente
   */
  async deleteCliente(id) {
    const query = `DELETE FROM clientes WHERE id = $1 RETURNING id, nome_completo`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error(`Cliente ${id} não encontrado`);
    }

    return result.rows[0];
  }
};

module.exports = ClienteRepository;
