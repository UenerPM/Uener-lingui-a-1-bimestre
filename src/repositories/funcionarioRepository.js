/**
 * FUNCIONÁRIO REPOSITORY
 * Acesso a dados de funcionários no PostgreSQL
 */

const pool = require('../config/db');

const FuncionarioRepository = {
  /**
   * Obtém todos os funcionários
   */
  async getAllFuncionarios() {
    // Tenta consultar a tabela 'funcionarios' padrão. Se não existir, tenta alternativas
    const queries = [
      // padrão: nomes de colunas do modelo novo (tabela 'funcionarios')
      `SELECT id, user_id, nome_completo AS nome, email, cpf, cargo, salario, data_admissao, created_at, updated_at FROM funcionarios WHERE deleted_at IS NULL ORDER BY nome_completo`,
      // variação avap2: tabela 'funcionario' com referência a 'pessoa' e 'cargo'
      `SELECT f.pessoacpfpessoa AS cpf, p.nomepessoa AS nome, p.email AS email, f.salario AS salario, c.nomecargo AS cargo
       FROM funcionario f
       LEFT JOIN pessoa p ON f.pessoacpfpessoa = p.cpfpessoa
       LEFT JOIN cargo c ON f.cargosidcargo = c.idcargo
       ORDER BY p.nomepessoa`,
      // fallback: buscar pessoas que são funcionários (quando dados estão separados)
      `SELECT p.cpfpessoa AS cpf, p.nomepessoa AS nome, p.email AS email, NULL AS salario, NULL AS cargo
       FROM pessoa p
       WHERE p.cpfpessoa IN (SELECT pessoacpfpessoa FROM funcionario)
       ORDER BY p.nomepessoa`
    ];

    for (const q of queries) {
      try {
        const result = await pool.query(q);
        if (result && result.rows) {
          // Normalizar nomes de campos para um formato único
          return result.rows.map(r => ({
            id: r.id || null,
            cpf: r.cpf || r.pessoacpfpessoa || r.cpfpessoa || null,
            nome: r.nome || r.nome_completo || r.nomepessoa || null,
            email: r.email || null,
            cargo: r.cargo || null,
            salario: r.salario || null,
            data_admissao: r.data_admissao || null
          }));
        }
      } catch (err) {
        // Se tabela não existir (erro 42P01), tentar próximo query. Outros erros são lançados.
        if (err.code === '42P01') continue;
        console.error('funcionarioRepository.getAllFuncionarios error:', err.message);
        throw err;
      }
    }

    // Se nenhuma query retornou dados, retornar array vazio
    return [];
  },

  /**
   * Obtém funcionário por ID
   */
  async getFuncionarioById(id) {
    const query = `
      SELECT 
        id, 
        user_id, 
        nome_completo, 
        email, 
        cpf, 
        cargo, 
        salario, 
        data_admissao, 
        created_at, 
        updated_at
      FROM funcionarios
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Obtém funcionário por user_id
   */
  async getFuncionarioByUserId(user_id) {
    const query = `
      SELECT 
        id, 
        user_id, 
        nome_completo, 
        email, 
        cpf, 
        cargo, 
        salario, 
        data_admissao, 
        created_at, 
        updated_at
      FROM funcionarios
      WHERE user_id = $1 AND deleted_at IS NULL
    `;

    const result = await pool.query(query, [user_id]);
    return result.rows[0] || null;
  },

  /**
   * Cria novo funcionário
   */
  async createFuncionario(nome_completo, email, cpf, cargo, salario, user_id = null) {
    const query = `
      INSERT INTO funcionarios (nome_completo, email, cpf, cargo, salario, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, nome_completo, email, cpf, cargo, salario, data_admissao, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, [nome_completo, email, cpf, cargo, salario, user_id]);
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        // Unique constraint violation
        if (err.constraint === 'funcionarios_email_key') {
          throw new Error('Email já cadastrado');
        }
        if (err.constraint === 'funcionarios_cpf_key') {
          throw new Error('CPF já cadastrado');
        }
      }
      throw err;
    }
  },

  /**
   * Atualiza funcionário (soft delete - set deleted_at)
   */
  async updateFuncionario(id, updates) {
    const allowedFields = ['nome_completo', 'email', 'cpf', 'cargo', 'salario'];
    const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fieldsToUpdate.length === 0) {
      const funcionario = await this.getFuncionarioById(id);
      if (!funcionario) throw new Error('Funcionário não encontrado');
      return funcionario;
    }

    const setClause = fieldsToUpdate.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
    const values = fieldsToUpdate.map(field => updates[field]);
    values.push(id);

    const query = `
      UPDATE funcionarios
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${fieldsToUpdate.length + 1} AND deleted_at IS NULL
      RETURNING id, user_id, nome_completo, email, cpf, cargo, salario, data_admissao, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Funcionário não encontrado');
      }

      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        if (err.constraint === 'funcionarios_email_key') {
          throw new Error('Email já cadastrado');
        }
        if (err.constraint === 'funcionarios_cpf_key') {
          throw new Error('CPF já cadastrado');
        }
      }
      throw err;
    }
  },

  /**
   * Deleta funcionário (soft delete - set deleted_at)
   */
  async deleteFuncionario(id) {
    const query = `
      UPDATE funcionarios
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, user_id, nome_completo, email, cpf, cargo, salario, data_admissao, created_at, updated_at
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error('Funcionário não encontrado');
    }

    return result.rows[0];
  }
};

module.exports = FuncionarioRepository;
