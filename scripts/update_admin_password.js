require('dotenv').config();
const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');

(async ()=>{
  try{
    const hash = await bcrypt.hash('123', 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hash, 'adm']);
    console.log('Senha do adm atualizada para hash novo');
  }catch(err){
    console.error('Erro atualizando senha:', err.message);
    process.exit(1);
  }finally{
    await pool.end();
  }
})();
