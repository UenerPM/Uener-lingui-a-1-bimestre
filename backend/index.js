const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const FileStore = require('session-file-store')(session);
const app = express();
const PORT = 3000;
const DATA_PATH = __dirname + '/data.json';
const upload = multer({ dest: path.join(__dirname, '../img/') });

// Middleware
app.use(express.static(__dirname + '/../'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Adicionado para aceitar JSON no corpo das requisições
app.use(session({
  secret: 'segredo-uener',
  resave: false,
  saveUninitialized: false,
  store: new FileStore({ path: path.join(__dirname, 'sessions'), retries: 1 }),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Dados em memória
const users = [];
const linguicas = [];

// Utilitários de persistência
function loadData() {
  if (fs.existsSync(DATA_PATH)) {
    const raw = fs.readFileSync(DATA_PATH);
    const data = JSON.parse(raw);
    users.length = 0;
    data.users.forEach(u => users.push(u));
    linguicas.length = 0;
    data.linguicas.forEach(l => linguicas.push(l));
  }
}
function saveData() {
  fs.writeFileSync(DATA_PATH, JSON.stringify({ users, linguicas }, null, 2));
}
loadData();

// Middlewares de autenticação
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login.html');
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).send('Acesso restrito ao administrador. <a href="/index.html">Voltar</a>');
  }
  next();
}

// Rotas de autenticação
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Usuário e senha obrigatórios.');
  if (users.find(u => u.username === username)) return res.status(409).send('Usuário já existe.');
  users.push({ username, password, isAdmin: false });
  saveData();
  res.send('<script>alert("Usuário cadastrado com sucesso!"); window.location.href = "/login.html";</script>');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user || user.bloqueado) {
    return res.status(401).send('<script>alert("Usuário ou senha inválidos ou usuário bloqueado."); window.location.href = "/login.html";</script>');
  }
  req.session.user = { username: user.username, isAdmin: user.isAdmin };
  res.redirect('/index.html');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

// Proteção de páginas
app.get('/index.html', requireLogin, (req, res, next) => next());
app.get('/pagamento.html', requireLogin, (req, res, next) => next());
app.get('/confirmacao.html', requireLogin, (req, res, next) => next());
app.get('/admin.html', requireAdmin, (req, res, next) => next());
// Proteger todas as páginas HTML para exigir login (exceto login.html)
app.get(/^\/((?!login\.html).)*\.html$/, requireLogin, (req, res, next) => next());

// Rotas de administração de usuários
app.get('/admin/usuarios', requireAdmin, (req, res) => res.json(users));
app.post('/admin/usuarios', requireAdmin, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ erro: 'Usuário e senha obrigatórios.' });
  if (users.find(u => u.username === username)) return res.status(409).json({ erro: 'Usuário já existe.' });
  users.push({ username, password, isAdmin: false });
  saveData();
  res.json({ ok: true });
});
app.delete('/admin/usuarios/:username', requireAdmin, (req, res) => {
  const { username } = req.params;
  if (username === 'adm') return res.status(403).json({ erro: 'Não é possível remover o administrador.' });
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  users.splice(idx, 1);
  saveData();
  res.json({ ok: true });
});
// Bloquear/desbloquear usuário
app.patch('/admin/usuarios/:username/bloquear', requireAdmin, (req, res) => {
  const { username } = req.params;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  if (username === 'adm') return res.status(403).json({ erro: 'Não é possível bloquear o administrador.' });
  user.bloqueado = !user.bloqueado;
  saveData();
  res.json({ ok: true, bloqueado: user.bloqueado });
});
// Promover usuário para admin
app.patch('/admin/usuarios/:username/promover', requireAdmin, (req, res) => {
  const { username } = req.params;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  user.isAdmin = true;
  saveData();
  res.json({ ok: true });
});
// Despromover admin para usuário comum
app.patch('/admin/usuarios/:username/despromover', requireAdmin, (req, res) => {
  const { username } = req.params;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  if (username === 'adm') return res.status(403).json({ erro: 'Não é possível despromover o administrador principal.' });
  user.isAdmin = false;
  saveData();
  res.json({ ok: true });
});

// Rotas de administração de linguiças
app.get('/admin/linguicas', requireAdmin, (req, res) => res.json(linguicas));
// Rota para adicionar linguiça com imagem
app.post('/admin/linguicas', requireAdmin, upload.single('imagem'), (req, res) => {
  const { nome, preco } = req.body;
  if (!nome || !preco) return res.status(400).json({ erro: 'Nome e preço obrigatórios.' });
  if (linguicas.find(l => l.nome === nome)) return res.status(409).json({ erro: 'Linguiça já existe.' });
  // Gera novo id
  const novoId = linguicas.length > 0 ? Math.max(...linguicas.map(l => l.id || 0)) + 1 : 1;
  let imagem = '';
  if (req.file) {
    const ext = path.extname(req.file.originalname);
    const novoNome = `${novoId}${ext}`;
    const destino = path.join(req.file.destination, novoNome);
    // Remove arquivo com mesmo nome se já existir
    if (fs.existsSync(destino)) fs.unlinkSync(destino);
    fs.renameSync(req.file.path, destino);
    imagem = novoNome;
  }
  linguicas.push({ id: novoId, nome, preco, imagem });
  saveData();
  res.json({ ok: true });
});
// Rota para editar linguiça
app.put('/admin/linguicas/:nome', requireAdmin, upload.single('imagem'), (req, res) => {
  const { nome } = req.params;
  const { nome: novoNome, preco } = req.body;
  const idx = linguicas.findIndex(l => l.nome === nome);
  if (idx === -1) return res.status(404).json({ erro: 'Linguiça não encontrada.' });
  linguicas[idx].nome = novoNome;
  linguicas[idx].preco = preco;
  if (req.file) {
    const ext = path.extname(req.file.originalname);
    const id = linguicas[idx].id;
    const novoNomeImg = `${id}${ext}`;
    const destino = path.join(req.file.destination, novoNomeImg);
    // Remove imagem antiga se for diferente
    if (linguicas[idx].imagem && linguicas[idx].imagem !== novoNomeImg) {
      const antigo = path.join(req.file.destination, linguicas[idx].imagem);
      if (fs.existsSync(antigo)) fs.unlinkSync(antigo);
    }
    // Remove arquivo com mesmo nome se já existir
    if (fs.existsSync(destino)) fs.unlinkSync(destino);
    fs.renameSync(req.file.path, destino);
    linguicas[idx].imagem = novoNomeImg;
  }
  saveData();
  res.json({ ok: true });
});
app.delete('/admin/linguicas/:nome', requireAdmin, (req, res) => {
  const { nome } = req.params;
  const idx = linguicas.findIndex(l => l.nome === nome);
  if (idx === -1) return res.status(404).json({ erro: 'Linguiça não encontrada.' });
  linguicas.splice(idx, 1);
  saveData();
  res.json({ ok: true });
});

// API de sessão
app.get('/api/session', (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user.username, isAdmin: req.session.user.isAdmin });
  } else {
    res.json({ username: null, isAdmin: false });
  }
});

// Rota pública para listar linguiças para qualquer usuário logado
app.get('/api/linguicas', requireLogin, (req, res) => res.json(linguicas));

// Página inicial (mensagem simples)
app.get('/', (req, res) => {
  res.send('Servidor funcionando!');
});

// Inicialização
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
