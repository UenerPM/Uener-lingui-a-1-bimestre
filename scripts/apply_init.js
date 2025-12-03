require('dotenv').config();
const pool = require('../src/config/db');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const sqlPath = path.join(__dirname, '../src/database/init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Executando init.sql contra o banco', process.env.PGDATABASE || 'avap2');
    await pool.query(sql);
    console.log('init.sql executado com sucesso');
  } catch (err) {
    console.error('FALHA AO EXECUTAR init.sql:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
