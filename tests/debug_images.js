const pool = require('./src/config/db');

// Verificar tabelas
console.log('===== TABELAS =====');
pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`, (err, res) => {
  if (err) {
    console.error('Erro ao listar tabelas:', err.message);
    checkLinguicas();
    return;
  }
  console.log('Tabelas encontradas:', res.rows.map(r => r.table_name));
  checkLinguicas();
});

function checkLinguicas() {
  console.log('\n===== DADOS EM LINGUICAS =====');
  pool.query('SELECT idlinguica, nomelinguica, imagem FROM linguicas LIMIT 10', (err, res) => {
    if (err) {
      console.error('Erro ao consultar linguicas:', err.message);
      process.exit(1);
    }
    console.table(res.rows);
    process.exit(0);
  });
}
