const pool = require('../config/db');
const bcrypt = require('bcryptjs');

async function getAllUsers() {
  const res = await pool.query('select username, is_admin, bloqueado from users order by username');
  return res.rows;
}

async function getUserByUsername(username) {
  const res = await pool.query('select username, is_admin, bloqueado, created_at from users where username = $1', [username]);
  return res.rows[0];
}

async function getUserByUsernameWithPassword(username) {
  const res = await pool.query('select username, password_hash, is_admin, bloqueado from users where username = $1', [username]);
  return res.rows[0];
}

async function createUser(username, password, isAdmin = false) {
  const passwordHash = await bcrypt.hash(password, 10);
  const res = await pool.query(
    'insert into users(username, password_hash, is_admin) values($1,$2,$3) returning username, is_admin, bloqueado',
    [username, passwordHash, isAdmin]
  );
  return res.rows[0];
}

async function deleteUser(username) {
  await pool.query('delete from users where username = $1', [username]);
}

async function toggleBloqueio(username) {
  const res = await pool.query('update users set bloqueado = not coalesce(bloqueado, false) where username = $1 returning bloqueado', [username]);
  return res.rows[0];
}

async function setAdmin(username, isAdmin = true) {
  const res = await pool.query('update users set is_admin = $2 where username = $1 returning is_admin', [username, isAdmin]);
  return res.rows[0];
}

async function validateCredentials(username, password) {
  const user = await getUserByUsernameWithPassword(username);
  if (!user) return null;
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) return null;
  if (user.bloqueado) return null;
  return { username: user.username, is_admin: user.is_admin };
}

module.exports = {
  getAllUsers,
  getUserByUsername,
  getUserByUsernameWithPassword,
  createUser,
  deleteUser,
  toggleBloqueio,
  setAdmin,
  validateCredentials
};
