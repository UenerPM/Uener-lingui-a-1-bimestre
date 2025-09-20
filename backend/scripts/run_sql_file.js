#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const fileArg = process.argv[2];
  const sqlPath = fileArg ? path.resolve(fileArg) : path.resolve(__dirname, '..', '..', 'documentacao', 'avapScriptPostgre.sql');

  if (!process.env.DATABASE_URL) {
    console.error('Erro: variável DATABASE_URL não definida. Crie um .env ou exporte a variável.');
    process.exit(2);
  }

  if (!fs.existsSync(sqlPath)) {
    console.error('Arquivo SQL não encontrado em:', sqlPath);
    process.exit(3);
  }

  const sql = fs.readFileSync(sqlPath, { encoding: 'utf8' });

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('Conectado em', process.env.DATABASE_URL);
    console.log('Executando SQL de:', sqlPath);
    await client.query('BEGIN');
    // Envia todo o arquivo SQL. Se houver muitos statements, o pg executa sequencialmente.
    await client.query(sql);
    await client.query('COMMIT');
    console.log('SQL executado com sucesso.');
  } catch (err) {
    console.error('Erro executando SQL:', err.message || err);
    try { await client.query('ROLLBACK'); } catch (e) {}
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
