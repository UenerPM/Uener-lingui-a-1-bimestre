/**
 * ===== SETUP DO BANCO POSTGRESQL =====
 * 
 * Este script:
 * 1. Conecta ao PostgreSQL
 * 2. Cria o banco de dados 'avap2' (se não existir)
 * 3. Executa o schema (init.sql)
 * 4. Insere dados iniciais (seed)
 * 
 * Uso: node src/database/setup.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const config = {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres'
};

const dbName = process.env.PGDATABASE || 'avap2';

async function setupDatabase() {
  let client = null;

  try {
    // Conectar ao PostgreSQL (sem especificar banco)
    console.log('🔌 Conectando ao PostgreSQL...');
    client = new Client(config);
    await client.connect();
    console.log('✅ Conectado');

    // Verificar se banco existe
    const result = await client.query(
      `SELECT datname FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`📦 Banco '${dbName}' não existe. Criando...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Banco '${dbName}' criado`);
    } else {
      console.log(`✅ Banco '${dbName}' já existe`);
    }

    // Desconectar e reconectar ao novo banco
    await client.end();

    console.log(`🔌 Conectando ao banco '${dbName}'...`);
    const poolClient = new Client({
      ...config,
      database: dbName
    });
    await poolClient.connect();
    console.log('✅ Conectado ao banco');

    // Ler e executar init.sql
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 Executando schema (init.sql)...');
    await poolClient.query(sql);
    console.log('✅ Schema executado com sucesso');

    // Criar extensão para gerar UUIDs (opcional, mas útil)
    try {
      await poolClient.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
      console.log('✅ Extensão UUID criada');
    } catch (e) {
      console.log('ℹ️  Extensão UUID já existe ou não disponível');
    }

    // Verificar dados iniciais
    const usersCount = await poolClient.query(`SELECT COUNT(*) as count FROM users`);
    console.log(`👥 Usuários no banco: ${usersCount.rows[0].count}`);

    const produtosCount = await poolClient.query(`SELECT COUNT(*) as count FROM produtos`);
    console.log(`📦 Produtos no banco: ${produtosCount.rows[0].count}`);

    const formasCount = await poolClient.query(`SELECT COUNT(*) as count FROM formas_pagamento`);
    console.log(`💳 Formas de pagamento: ${formasCount.rows[0].count}`);

    await poolClient.end();

    console.log(`
╔════════════════════════════════════════════════╗
║  ✅ BANCO POSTGRESQL CONFIGURADO COM SUCESSO   ║
╠════════════════════════════════════════════════╣
║                                                ║
║  Banco: ${dbName}                                      ║
║  Host: ${config.host}                                 ║
║  Porta: ${config.port}                                 ║
║                                                ║
║  📊 Tabelas criadas:                           ║
║     ✓ users                                    ║
║     ✓ linguicas                                ║
║     ✓ produtos                                 ║
║     ✓ clientes                                 ║
║     ✓ funcionarios                             ║
║     ✓ pedidos                                  ║
║     ✓ itens_pedido                             ║
║     ✓ formas_pagamento                         ║
║     ✓ pagamentos                               ║
║                                                ║
║  🔐 Admin criado:                              ║
║     Username: adm                              ║
║     Senha: 123                                 ║
║                                                ║
║  Próximo passo: npm start                      ║
║                                                ║
╚════════════════════════════════════════════════╝
    `);

  } catch (error) {
    console.error('❌ Erro durante setup:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   → PostgreSQL não está rodando!');
      console.error('   → Inicie o serviço: sudo service postgresql start (Linux)');
    } else if (error.code === '28P01') {
      console.error('   → Senha do PostgreSQL incorreta!');
      console.error('   → Verifique .env: PGPASSWORD');
    }
    process.exit(1);
  }
}

setupDatabase();
