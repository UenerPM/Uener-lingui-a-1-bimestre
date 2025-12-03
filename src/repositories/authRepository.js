const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Config via env
const AUTH_TABLE = process.env.AUTH_TABLE || null; // if null, repository will try sensible defaults

// helper: detect columns for a table
async function detectColumns(table) {
  const res = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  return res.rows.map(r => r.column_name.toLowerCase());
}

// Determine which table to use for auth and map columns
let selected = {
  table: null,
  usernameCol: null,
  emailCol: null,
  passwordCol: null,
  isAdminCol: null
};

async function initialize() {
  if (selected.table) return selected;

  const candidates = [];
  if (AUTH_TABLE) candidates.push(AUTH_TABLE);
  // sensible fallbacks
  candidates.push('funcionarios', 'clientes', 'pessoas', 'pessoa', 'funcionario', 'cliente', 'users');

  for (const t of candidates) {
    try {
      const cols = await detectColumns(t);
      if (!cols || cols.length === 0) continue;

      // heuristics
      const usernameCol = cols.find(c => ['username', 'user', 'login', 'nome_completo', 'nome', 'cpf', 'email'].includes(c));
      const emailCol = cols.find(c => c === 'email');
      const passwordCol = cols.find(c => ['password_hash', 'senha_hash', 'senha', 'password', 'passwordhash'].includes(c));
      const isAdminCol = cols.find(c => ['is_admin', 'admin', 'cargo'].includes(c));

      selected = { table: t, usernameCol, emailCol, passwordCol, isAdminCol };
      return selected;
    } catch (err) {
      // table doesn't exist — skip
      continue;
    }
  }

  // fallback: users table assumed
  selected = { table: 'users', usernameCol: 'username', emailCol: 'email', passwordCol: 'password_hash', isAdminCol: 'is_admin' };
  return selected;
}

async function validateCredentials(identifier, password) {
  await initialize();
  const t = selected.table;
  const uname = selected.usernameCol;
  const email = selected.emailCol;
  const pcol = selected.passwordCol;
  const adminCol = selected.isAdminCol;

  if (!pcol) {
    // no password column found — cannot authenticate
    return null;
  }

  // try to find user by username or email
  let whereClause = '';
  const params = [];
  if (uname) {
    whereClause = `${uname} = $1`;
    params.push(identifier);
  }
  if (email) {
    // allow searching by email as well
    if (whereClause) whereClause = `(${whereClause} OR ${email} = $1)`; // same param
    else {
      whereClause = `${email} = $1`;
      params.push(identifier);
    }
  }
  if (!whereClause) return null;

  const q = `SELECT * FROM ${t} WHERE ${whereClause} LIMIT 1`;
  try {
    const res = await pool.query(q, params);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    const hash = row[pcol];
    if (!hash) return null;

    // if hash looks like bcrypt ($2a$) use bcrypt.compare, otherwise try direct equality
    if (typeof hash === 'string' && hash.startsWith('$2')) {
      const match = await bcrypt.compare(password, hash);
      if (!match) return null;
    } else {
      // fallback insecure compare
      if (password !== String(hash)) return null;
    }

    // build returned user object
    const user = {
      id: row.id || row.usuario_id || null,
      username: row[uname] || row[email] || identifier,
      isAdmin: false,
      raw: row
    };
    if (adminCol) {
      if (adminCol === 'cargo') {
        user.isAdmin = row[adminCol] && String(row[adminCol]).toLowerCase().includes('admin');
      } else {
        user.isAdmin = !!row[adminCol];
      }
    }

    return user;
  } catch (err) {
    console.error('authRepository.validateCredentials error:', err.message);
    return null;
  }
}

module.exports = { initialize, validateCredentials, selected };
