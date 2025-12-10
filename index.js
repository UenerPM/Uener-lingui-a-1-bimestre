/**
 * Entry Point Principal
 * Inicia o servidor a partir de src/app.js
 */

require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`📁 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Banco: avap2 (PostgreSQL)`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⛔ Servidor encerrado');
  process.exit(0);
});
