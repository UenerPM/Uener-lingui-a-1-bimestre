const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'app.db');

// Criar diretório se não existir
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Diretório /data criado');
}

const db = new sqlite3.Database(dbPath, async (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao SQLite:', err.message);
    process.exit(1);
  }

  console.log('✅ Conectado ao SQLite');

  // Criar tabelas
  db.serialize(() => {
    // Tabela de usuários
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        bloqueado INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('❌ Erro ao criar tabela users:', err);
      else console.log('✅ Tabela users criada/verificada');
    });

    // Tabela de linguiças
    db.run(`
      CREATE TABLE IF NOT EXISTS linguicas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE NOT NULL,
        preco REAL NOT NULL,
        imagem TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('❌ Erro ao criar tabela linguicas:', err);
      else console.log('✅ Tabela linguicas criada/verificada');
    });

    // Inserir admin de teste (se não existir)
    setTimeout(async () => {
      const admin = await new Promise((resolve) => {
        db.get('SELECT * FROM users WHERE username = ?', ['adm'], (err, row) => {
          resolve(row);
        });
      });

      if (!admin) {
        const adminHash = await bcrypt.hash('123', 10);
        db.run(
          'INSERT INTO users(username, password_hash, is_admin) VALUES(?, ?, ?)',
          ['adm', adminHash, 1],
          (err) => {
            if (err) console.error('❌ Erro ao inserir admin:', err);
            else console.log('✅ Usuário admin criado (senha: 123)');
            console.log('\n🎉 Banco de dados inicializado com sucesso!');
            process.exit(0);
          }
        );
      } else {
        console.log('✅ Usuário admin já existe');
        console.log('\n🎉 Banco de dados já estava inicializado!');
        process.exit(0);
      }
    }, 500);
  });
});

db.on('error', (err) => {
  console.error('❌ Erro de banco de dados:', err);
  process.exit(1);
});
