require('dotenv').config();
const pool = require('../src/config/db');

(async ()=>{
  try{
    const t = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' ORDER BY tablename");
    const tables = t.rows.map(r=>r.tablename);
    for(const table of tables){
      const cols = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name = $1 ORDER BY ordinal_position`,
        [table]
      );
      console.log('\nTABLE:', table);
      for(const c of cols.rows) console.log('  ', c.column_name, c.data_type);
    }
  }catch(err){
    console.error('ERROR:', err.message);
    process.exit(1);
  }finally{
    await pool.end();
  }
})();
