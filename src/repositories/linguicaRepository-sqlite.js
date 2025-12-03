const db = require('../config/db-sqlite');

async function getAllLinguicas() {
  const res = await db.all('select id, nome, preco, imagem from linguicas order by id');
  return res;
}

async function getLinguicaByNome(nome) {
  const row = await db.get('select id, nome, preco, imagem from linguicas where nome = ?', [nome]);
  return row;
}

async function createLinguica(nome, preco, imagem = null) {
  const result = await db.run('insert into linguicas(nome, preco, imagem) values(?,?,?)', [nome, preco, imagem]);
  const id = result.lastID;
  return { id, nome, preco, imagem };
}

async function updateLinguicaById(id, nome, preco, imagem = null) {
  await db.run('update linguicas set nome = ?, preco = ?, imagem = coalesce(?, imagem) where id = ?', [nome, preco, imagem, id]);
  return { id, nome, preco, imagem };
}

async function deleteLinguicaByNome(nome) {
  await db.run('delete from linguicas where nome = ?', [nome]);
}

module.exports = {
  getAllLinguicas,
  getLinguicaByNome,
  createLinguica,
  updateLinguicaById,
  deleteLinguicaByNome
};
