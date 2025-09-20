const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, '..', 'data.json');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Garantir que a pasta de sessões exista antes de usar session-file-store
const sessionsDir = path.join(__dirname, '..', 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

// Configura session-file-store com menos retrys e sem spam de log quando arquivos desaparecem
app.use(session({
  secret: 'segredo-uener',
  resave: false,
  saveUninitialized: false,
  store: new FileStore({ path: sessionsDir, retries: 0, logFn: function() {} }),
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' }
}));

// Log simples de todas as requisições (útil para debug de 404s)
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

// (static files will be mounted after routers to avoid intercepting /api/* requests)

// Middlewares de sessão e autenticação
const resp = require('../utils/response');
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) return resp.badRequest(res, 'Login necessário');
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user || !req.session.user.isAdmin) {
    return resp.badRequest(res, 'Acesso restrito ao administrador');
  }
  next();
}

// Protege métodos que modificam dados no roteador /api/db
function protectDbWrites(req, res, next) {
  const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (writeMethods.includes(req.method)) return requireAdmin(req, res, next);
  next();
}

// Controlador de autenticação
const authController = require('../controllers/authController');
// Garantia explícita da rota /api/session para evitar 404s por alguma razão
app.get('/api/session', authController.session);

// Simple datastore module
const datastore = require('../store/datastore');

// Logout compatível via GET /logout (redireciona para login)
app.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => res.redirect('/login.html'));
  } else {
    res.redirect('/login.html');
  }
});

// Routers
const authRouter = require('../routes/authRoutes');
const adminRouter = require('../routes/adminRoutes');
const apiRouter = require('../routes/apiRoutes');
const dbRouter = require('../routes/dbRoutes');

app.use('/auth', authRouter);
app.use('/admin', requireAdmin, adminRouter);
app.use('/api', apiRouter);
app.use('/api/db', protectDbWrites, dbRouter);

// Middleware global de tratamento de erros (captura erros não tratados)
app.use((err, req, res, next) => {
  // err pode ser string ou objeto
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  return resp.serverError(res, err);
});

// Servir o painel admin protegido via rota /admin (arquivo está em public/admin.html)
app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'admin.html'));
});

// Também proteger /admin.html (caso o link aponte diretamente para o arquivo)
app.get('/admin.html', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'admin.html'));
});

// Serve HTML pages and protect with session middleware inside routes where needed
app.get('/', (req, res) => res.send('Servidor modular funcionando'));

// Inicializa datastore e só então sobe o servidor
(async () => {
  try {
    await datastore.init();
    // Garantir usuário admin padrão
    try {
      const users = await datastore.getAll('users');
      const adm = users.find(u => u.username === 'adm');
      if (!adm) {
          const bcrypt = require('bcryptjs');
          const hash = await bcrypt.hash('adm', 10);
          await datastore.insert('users', { username: 'adm', password: hash, isAdmin: true, bloqueado: false });
          console.log('Usuário admin padrão criado: adm / adm (senha hasheada)');
        }
    } catch (e) {
      console.warn('Erro checando/criando usuário adm (ignorado):', e && e.message ? e.message : e);
    }
  // Servir public tanto na raiz do workspace quanto dentro de backend/public (compatibilidade)
  app.use(express.static(path.join(__dirname, '..', '..', 'public')));
  app.use(express.static(path.join(__dirname, '..', 'public')));
  // Mantemos também a raiz do backend visível (útil para arquivos públicos fora de public)
  app.use(express.static(path.join(__dirname, '..')));

  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  } catch (e) {
    console.error('Erro inicializando datastore:', e);
    process.exit(1);
  }
})();
