/**
 * ===== UENER LINGUÇO - SERVIDOR PRINCIPAL =====
 * 
 * Sistema de e-commerce integrado 100% com PostgreSQL
 * - Autenticação com sessão Postgres
 * - APIs RESTful para todos os CRUDs
 * - JSON padronizado: { success, message, [data], [redirect] }
 * - Middleware de autenticação e autorização
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
// Session store: prefer file store by default to avoid altering DB schema.
const SessionFileStore = require('session-file-store')(session);
let SessionStore = null;

// Config
const pool = require('./config/db');

// Routes
const userRoutes = require('./routes/userRoutes');
const linguicaRoutes = require('./routes/linguicaRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');
const sessionRoute = require('./routes/sessionRoute');
const apiAvap2 = require('./routes/api-avap2'); // Novas rotas para avap2
const pixRoutes = require('./routes/pix');
const imagensProdutos = require('./routes/imagensProdutos');
const imagemRoute = require('./routes/imagem');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====

// Static files (projeto mantém `public/` no diretório raiz do repositório)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware (configurable store)
// If you explicitly set SESSION_STORE=pg in .env, use Postgres store (requires session table).
if (process.env.SESSION_STORE === 'pg') {
  const PgSession = require('connect-pg-simple')(session);
  SessionStore = new PgSession({ pool });
} else {
  SessionStore = new SessionFileStore({ path: path.join(__dirname, 'sessions') });
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo-uener-desenvolvimento-2025',
  resave: false,
  saveUninitialized: false,
  store: SessionStore,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    httpOnly: true,
    sameSite: 'lax',
    secure: false // true em HTTPS
  }
}));

// ===== API ROUTES (todas em /api) =====

app.use('/api', sessionRoute);      // GET /api/session
app.use('/api', apiAvap2);          // Novas rotas avap2: /api/login, /api/logout, /api/produtos, /api/pedidos, /api/pagamentos
app.use('/api', userRoutes);        // /api/login, /api/register, /api/logout, /api/users/*
app.use('/api', linguicaRoutes);    // /api/linguicas
app.use('/api', produtoRoutes);     // /api/produtos
app.use('/api', pedidoRoutes);      // /api/pedidos
app.use('/api', clienteRoutes);     // /api/clientes
app.use('/api', funcionarioRoutes); // /api/funcionarios
// PIX routes (payload generation, validation)
app.use('/api/pix', pixRoutes);

// Servir imagens do outro projeto através de rota fixa
app.use('/imagens-produtos', imagensProdutos);

// Rota proxy para imagens externas (com validação e fallback)
app.use('/api/imagem', imagemRoute);

// Rota estática para /imgs e /uploads (se folder externa estiver configurada)
const EXTERNAL_IMAGES_PATH_STATIC = process.env.EXTERNAL_IMAGES_PATH || '';
if (EXTERNAL_IMAGES_PATH_STATIC) {
  console.log(`[app] Servindo /imgs de: ${EXTERNAL_IMAGES_PATH_STATIC}`);
  app.use('/imgs', express.static(EXTERNAL_IMAGES_PATH_STATIC));
  app.use('/uploads', express.static(EXTERNAL_IMAGES_PATH_STATIC));
}

// ===== STATIC PAGE ROUTES =====

// Redireciona / para /index.html
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor rodando' });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.path
  });
});

// ===== ERROR HANDLER =====

app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

// ===== STARTUP =====

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   🍖 UENER LINGUÇO - Servidor Iniciado 🍖    ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  🌐 Acesse: http://localhost:${PORT}           ║
║  📊 Banco: PostgreSQL (avap2)                  ║
║  🔐 Sessão: Postgres (connect-pg-simple)       ║
║                                               ║
║  ✅ Credenciais de teste:                      ║
║     • Usuário: adm                             ║
║     • Senha: 123                               ║
║                                               ║
║  📚 Rotas API:                                 ║
║     • /api/session        → info da sessão     ║
║     • /api/login          → POST autenticação  ║
║     • /api/register       → POST novo usuário  ║
║     • /api/logout         → GET sair           ║
║     • /api/linguicas      → CRUD linguiças     ║
║     • /api/produtos       → CRUD produtos      ║
║     • /api/pedidos        → CRUD pedidos       ║
║     • /api/clientes       → CRUD clientes      ║
║     • /api/funcionarios   → CRUD funcs         ║
║                                               ║
║  🛑 Para parar: Ctrl + C                       ║
║                                               ║
╚═══════════════════════════════════════════════╝
`);
});

module.exports = app;

