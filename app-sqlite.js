require('dotenv').config();
process.env.DB = process.env.DB || 'sqlite';
const express = require('express');
const session = require('express-session');
const path = require('path');
const userRepoSQLite = require('./src/repositories/userRepository-sqlite');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session em memória (simples, funciona com SQLite)
// Para produção com Postgres, troque por connect-pg-simple
app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo-uener-desenvolvimento',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 7 * 24 * 60 * 60 * 1000, 
    httpOnly: true, 
    sameSite: 'lax',
    secure: false // true em HTTPS
  }
}));

// API routes
app.use('/api', routes);

// Compatibilidade: formulário HTML faz POST/register ou POST/login; redireciona após sucesso

app.post('/api/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const exists = await userRepoSQLite.getUserByUsername(username);
    if (exists) return res.status(409).json({ error: 'user already exists' });
    await userRepoSQLite.createUser(username, password, false);
    res.json({ ok: true, message: 'user created successfully' });
  } catch (err) { 
    res.status(500).json({ error: 'error registering user: ' + err.message });
  }
});

app.post('/api/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const user = await userRepoSQLite.validateCredentials(username, password);
    if (!user) return res.status(401).json({ error: 'invalid credentials or user blocked' });
    req.session.user = { username: user.username, isAdmin: user.is_admin };
    res.json({ ok: true, username: user.username, isAdmin: user.is_admin });
  } catch (err) { 
    res.status(500).json({ error: 'error logging in: ' + err.message });
  }
});

app.get('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/session', (req, res) => {
  if (req.session.user) {
    res.json({ ok: true, ...req.session.user });
  } else {
    res.status(401).json({ error: 'not authenticated' });
  }
});
app.get('/', (req, res) => res.send('Servidor rodando'));

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Uener Linguço - Servidor Rodando     ║
╚════════════════════════════════════════╝

🌐 Acesse: http://localhost:${PORT}/login.html
📊 Banco: SQLite (em data/app.db)

Credenciais de teste:
  👤 Usuário: adm
  🔑 Senha: 123

Pressione Ctrl+C para parar o servidor
`);
});
