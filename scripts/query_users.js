require('dotenv').config();
const pool = require('../src/config/db');

(async ()=>{
  try{
    const r = await pool.query('SELECT username, password_hash, is_admin, bloqueado FROM users');
    console.log('USERS ROWS:', r.rows);
  }catch(err){
    console.error('ERROR querying users:', err.message);
    process.exit(1);
  }finally{
    await pool.end();
  }
})();
