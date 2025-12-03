require('dotenv').config();
const pool = require('../src/config/db');

(async () => {
  try {
    const res = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' ORDER BY tablename");
    console.log('TABLES:', res.rows.map(r => r.tablename));
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
