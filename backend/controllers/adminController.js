const store = require('../store/datastore');
const fs = require('fs');
const path = require('path');
const resp = require('../utils/response');

exports.listUsers = async (req, res) => res.json(await store.getAll('users'));
exports.createUser = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return resp.badRequest(res, 'Usuário e senha obrigatórios.');
  const users = await store.getAll('users');
  if (users.find(u => u.username === username)) return resp.conflict(res, 'Usuário já existe.');
  await store.insert('users', { username, password, isAdmin: false, bloqueado: false });
  res.json({ ok: true });
};
exports.deleteUser = async (req, res) => {
  const { username } = req.params;
  const users = await store.getAll('users');
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return resp.notFound(res, 'Usuário não encontrado.');
  const ok = await store.remove('users', users[idx].id);
  if (!ok) return resp.serverError(res, 'Erro removendo usuário.');
  res.json({ ok: true });
};
exports.toggleBlock = async (req, res) => {
  const { username } = req.params;
  const users = await store.getAll('users');
  const user = users.find(u => u.username === username);
  if (!user) return resp.notFound(res, 'Usuário não encontrado.');
  const updated = await store.update('users', user.id, { bloqueado: !user.bloqueado });
  res.json({ ok: true, bloqueado: updated.bloqueado });
};
exports.promote = async (req, res) => {
  const { username } = req.params;
  const users = await store.getAll('users');
  const user = users.find(u => u.username === username);
  if (!user) return resp.notFound(res, 'Usuário não encontrado.');
  await store.update('users', user.id, { isAdmin: true });
  res.json({ ok: true });
};
exports.demote = async (req, res) => {
  const { username } = req.params;
  const users = await store.getAll('users');
  const user = users.find(u => u.username === username);
  if (!user) return resp.notFound(res, 'Usuário não encontrado.');
  await store.update('users', user.id, { isAdmin: false });
  res.json({ ok: true });
};

// Linguiças CRUD
exports.listLinguicas = async (req, res) => res.json(await store.getAll('linguicas'));
exports.createLinguica = async (req, res) => {
  const { nome, preco } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome obrigatório.' });
  const linguicas = await store.getAll('linguicas');
  if (linguicas.find(l => l.nome === nome)) return res.status(409).json({ erro: 'Linguiça já existe.' });
  const imagemFile = req.file;
  const item = await store.insert('linguicas', { nome, preco, imagem: '' });
  if (imagemFile) {
    const ext = path.extname(imagemFile.originalname) || '.png';
    const novoNome = `${item.id}${ext}`;
    const destino = path.join(__dirname, '..', '..', 'public', 'img', novoNome);
    try {
      if (fs.existsSync(destino)) fs.unlinkSync(destino);
      fs.renameSync(imagemFile.path, destino);
      await store.update('linguicas', item.id, { imagem: novoNome });
    } catch (e) { console.error(e); }
  }
  res.json(item);
};
exports.updateLinguica = async (req, res) => {
  const { id } = req.params;
  const imagemFile = req.file;
  const updated = await store.update('linguicas', id, req.body);
  if (!updated) return res.status(404).json({ erro: 'Linguiça não encontrada.' });
  if (imagemFile) {
    const ext = path.extname(imagemFile.originalname) || '.png';
    const novoNome = `${updated.id}${ext}`;
    const destino = path.join(__dirname, '..', '..', 'public', 'img', novoNome);
    try {
      if (updated.imagem && fs.existsSync(path.join(__dirname, '..', '..', 'public', 'img', updated.imagem))) {
        fs.unlinkSync(path.join(__dirname, '..', '..', 'public', 'img', updated.imagem));
      }
      if (fs.existsSync(destino)) fs.unlinkSync(destino);
      fs.renameSync(imagemFile.path, destino);
      await store.update('linguicas', updated.id, { imagem: novoNome });
    } catch (e) { console.error(e); }
  }
  res.json(updated);
};
exports.deleteLinguica = async (req, res) => {
  const { id } = req.params;
  const ok = await store.remove('linguicas', id);
  if (!ok) return res.status(404).json({ erro: 'Linguiça não encontrada.' });
  res.json({ ok: true });
};
