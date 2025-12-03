require('dotenv').config();
const pool = require('../src/config/db');

(async ()=>{
  try {
    const create = `CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      email TEXT UNIQUE,
      is_admin BOOLEAN DEFAULT false,
      bloqueado BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    await pool.query(create);
    console.log('Tabela users criada (se não existia)');

    const insert = `INSERT INTO users (username, password_hash, email, is_admin)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING`;

    // bcrypt hash of '123' (same as init.sql)
    const hash = '$2a$10$Ld8BhPLvvzKJEE3V9fNZa.q1SmGzJ.B8vXl3WqJZb2u3VGVDjHkJW';
    await pool.query(insert, ['adm', hash, 'admin@uener.com', true]);
    console.log('Usuário admin garantido');
  } catch (err) {
    console.error('Erro criando tabela users:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
