const store = require('../store/datastore');
const bcrypt = require('bcryptjs');
const resp = require('../utils/response');

exports.register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return resp.badRequest(res, 'Usuário e senha obrigatórios.');
  const users = await store.getAll('users');
  const exists = users.find(u => u.username === username);
  if (exists) return resp.conflict(res, 'Usuário já existe.');
  const hash = await bcrypt.hash(password, 10);
  await store.insert('users', { username, password: hash, isAdmin: false, bloqueado: false });
  res.json({ ok: true });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const users = await store.getAll('users');
  const user = users.find(u => u.username === username);
  if (!user || user.bloqueado) return resp.badRequest(res, 'Usuário ou senha inválidos.');
  const match = await bcrypt.compare(password, user.password || '');
  if (!match) return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
  req.session.user = { username: user.username, isAdmin: user.isAdmin };
  // Garantir persistência da sessão antes de responder
  req.session.save((err) => {
    if (err) return resp.serverError(res, err);
    res.json({ ok: true });
  });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    const accept = req.headers['accept'] || '';
    if (accept.indexOf('application/json') !== -1) {
      return res.json({ ok: true });
    }
    return res.redirect('/login.html');
  });
};

exports.session = (req, res) => {
  if (req.session && req.session.user) return res.json({ username: req.session.user.username, isAdmin: req.session.user.isAdmin });
  res.json({ username: null, isAdmin: false });
};
