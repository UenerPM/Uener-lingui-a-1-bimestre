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

module.exports = {
  validateCredentials,
  getPessoaById
};
