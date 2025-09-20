const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const raw = process.env.DATABASE_URL;
if (!raw) {
  throw new Error('DATABASE_URL não definido em backend/.env');
}
const connectionString = (typeof raw === 'string' ? raw : String(raw)).trim();
if (!connectionString) {
  throw new Error('DATABASE_URL está vazio após trim');
}
const pool = new Pool({ connectionString });

// Criar tabela genérica entities (entity, id serial, data jsonb)
async function init() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS entities (
        entity TEXT NOT NULL,
        id SERIAL,
        data JSONB,
        PRIMARY KEY (entity, id)
      );
    `);
  } finally {
    client.release();
  }
}

// Helper: serializar row.data
function rowToItem(row) {
  const item = row.data || {};
  item.id = row.id;
  return item;
}

module.exports = {
  init,
  async getAll(entity) {
    const res = await pool.query('SELECT id, data FROM entities WHERE entity = $1 ORDER BY id', [entity]);
    return res.rows.map(rowToItem);
  },
  // find by predicate is not supported server-side; predicate should be a function applied client-side
  async find(entity, pred) {
    const all = await this.getAll(entity);
    return all.find(pred);
  },
  async insert(entity, item) {
    const res = await pool.query('INSERT INTO entities(entity, data) VALUES($1, $2) RETURNING id, data', [entity, item]);
    return rowToItem(res.rows[0]);
  },
  async update(entity, id, changes) {
    // buscar existente
    const cur = await pool.query('SELECT data FROM entities WHERE entity=$1 AND id=$2', [entity, Number(id)]);
    if (cur.rowCount === 0) return null;
    const data = cur.rows[0].data || {};
    const merged = { ...data, ...changes };
    await pool.query('UPDATE entities SET data=$3 WHERE entity=$1 AND id=$2', [entity, Number(id), merged]);
    return { id: Number(id), ...merged };
  },
  async remove(entity, id) {
    const res = await pool.query('DELETE FROM entities WHERE entity=$1 AND id=$2', [entity, Number(id)]);
    return res.rowCount > 0;
  },
  async raw() {
    const res = await pool.query('SELECT entity, id, data FROM entities ORDER BY entity, id');
    const out = {};
    for (const r of res.rows) {
      out[r.entity] = out[r.entity] || [];
      out[r.entity].push(rowToItem(r));
    }
    return out;
  },
  // compatibilidade: save é noop porque persistimos diretamente
  save() { return Promise.resolve(); },
  pool
};
