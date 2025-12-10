const pool = require('../config/db');

/**
 * authRepository-avap2.js
 * Autenticação baseada na tabela pessoa do banco avap2
 * 
 * Login = email
 * Senha = senha_pessoa
 * ID = cpfpessoa
 */

async function validateCredentials(email, senha) {
  try {
    const res = await pool.query(
      'SELECT cpfpessoa, nomepessoa, email, data_acesso FROM pessoa WHERE email = $1 AND senha_pessoa = $2',
      [email, senha]
    );

    if (res.rows.length === 0) {
      return null;
    }

    const pessoa = res.rows[0];

    // Determinar tipo de usuário (cliente, funcionário, ou apenas pessoa)
    let userType = 'pessoa';
    let role = null;

    // Verificar se é cliente
    const clienteRes = await pool.query('SELECT pessoacpfpessoa FROM cliente WHERE pessoacpfpessoa = $1', [pessoa.cpfpessoa]);
    if (clienteRes.rows.length > 0) {
      userType = 'cliente';
    }

    // Verificar se é funcionário (e buscar cargo)
    const funcRes = await pool.query(
      `SELECT f.pessoacpfpessoa, c.nomecargo 
       FROM funcionario f 
       LEFT JOIN cargo c ON f.cargosidcargo = c.idcargo 
       WHERE f.pessoacpfpessoa = $1`,
      [pessoa.cpfpessoa]
    );
    if (funcRes.rows.length > 0) {
      userType = 'funcionario';
      role = funcRes.rows[0].nomecargo;
    }

    return {
      cpfpessoa: pessoa.cpfpessoa,
      nomepessoa: pessoa.nomepessoa,
      email: pessoa.email,
      userType,
      role,
      isAdmin: userType === 'funcionario'
    };
  } catch (err) {
    console.error('authRepository.validateCredentials error:', err.message);
    return null;
  }
}

async function getPessoaById(cpfpessoa) {
  try {
    const res = await pool.query('SELECT cpfpessoa, nomepessoa, email FROM pessoa WHERE cpfpessoa = $1', [cpfpessoa]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('authRepository.getPessoaById error:', err.message);
    return null;
  }
}

async function getUserByEmail(email) {
  try {
    const res = await pool.query('SELECT * FROM pessoa WHERE email = $1 LIMIT 1', [email]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('authRepository.getUserByEmail error:', err.message);
    return null;
  }
}

async function createUser(email, senhaHash, nome = null, cpf = null) {
  try {
    // Tenta inserir na tabela `pessoa`. Se CPF não for fornecido e for obrigatório,
    // o banco pode rejeitar a operação. Logamos e lançamos o erro para o service tratar.
    const cols = ['email', 'senha_pessoa'];
    const params = [email, senhaHash];
    let idx = 3;
    if (nome) {
      cols.push('nomepessoa');
      params.push(nome);
      idx++;
    }
    if (cpf) {
      cols.push('cpfpessoa');
      params.push(cpf);
      idx++;
    }

    const q = `INSERT INTO pessoa (${cols.join(',')}) VALUES (${cols.map((_, i) => '$' + (i + 1)).join(',')}) RETURNING *`;
    const r = await pool.query(q, params);
    return r.rows[0];
  } catch (err) {
    console.error('authRepository.createUser error:', err.message);
    throw err;
  }
}

async function updatePassword(email, novaHash) {
  try {
    const res = await pool.query('UPDATE pessoa SET senha_pessoa = $1 WHERE email = $2 RETURNING *', [novaHash, email]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('authRepository.updatePassword error:', err.message);
    throw err;
  }
}

module.exports = {
  validateCredentials,
  getPessoaById,
  getUserByEmail,
  createUser,
  updatePassword
};
