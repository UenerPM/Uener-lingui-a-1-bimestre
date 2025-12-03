const db = require('../config/db-sqlite');
const bcrypt = require('bcryptjs');

async function getAllUsers() {
  const rows = await db.all('SELECT username, is_admin, bloqueado FROM users ORDER BY username');
  return rows;
}

async function getUserByUsername(username) {
  const row = await db.get('SELECT username, is_admin, bloqueado, created_at FROM users WHERE username = ?', [username]);
  return row;
}

async function getUserByUsernameWithPassword(username) {
  const row = await db.get('SELECT username, password_hash, is_admin, bloqueado FROM users WHERE username = ?', [username]);
  return row;
}

async function createUser(username, password, isAdmin = false) {
  const passwordHash = await bcrypt.hash(password, 10);
  return new Promise((resolve, reject) => {
    db.db.run(
      'INSERT INTO users(username, password_hash, is_admin) VALUES(?, ?, ?)',
      [username, passwordHash, isAdmin ? 1 : 0],
      function(err) {
        if (err) reject(err);
        else resolve({ username, is_admin: isAdmin, bloqueado: 0 });
      }
    );
  });
}

async function deleteUser(username) {
  return new Promise((resolve, reject) => {
    db.db.run('DELETE FROM users WHERE username = ?', [username], function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function toggleBloqueio(username) {
  return new Promise((resolve, reject) => {
    db.db.run(
      'UPDATE users SET bloqueado = NOT bloqueado WHERE username = ?',
      [username],
      function(err) {
        if (err) reject(err);
        else resolve({ bloqueado: true });
      }
    );
  });
}

async function setAdmin(username, isAdmin = true) {
  return new Promise((resolve, reject) => {
    db.db.run(
      'UPDATE users SET is_admin = ? WHERE username = ?',
      [isAdmin ? 1 : 0, username],
      function(err) {
        if (err) reject(err);
        else resolve({ is_admin: isAdmin });
      }
    );
  });
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
