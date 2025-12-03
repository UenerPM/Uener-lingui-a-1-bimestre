const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '21514518',
  database: process.env.PGDATABASE || 'avap2',
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000
});

async function inspect() {
  const result = { connected: false, tables: [], candidates: [], approx_counts: [] };
  try {
    // quick connection test
    await pool.query('SELECT 1');
    result.connected = true;

    const tablesRes = await pool.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog','information_schema')
      ORDER BY table_schema, table_name
    `);

    const tables = tablesRes.rows;

    for (const t of tables) {
      const colsRes = await pool.query(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = $2
         ORDER BY ordinal_position;`,
        [t.table_schema, t.table_name]
      );

      result.tables.push({
        schema: t.table_schema,
        name: t.table_name,
        columns: colsRes.rows
      });
    }

    const candidatesRes = await pool.query(`
      SELECT table_schema, table_name, column_name
      FROM information_schema.columns
      WHERE table_schema NOT IN ('pg_catalog','information_schema')
        AND (
          lower(column_name) LIKE '%user%' OR
          lower(column_name) LIKE '%username%' OR
          lower(column_name) LIKE '%login%' OR
          lower(column_name) LIKE '%senha%' OR
          lower(column_name) LIKE '%password%' OR
          lower(column_name) LIKE '%hash%' OR
          lower(column_name) LIKE '%email%' OR
          lower(column_name) LIKE '%cpf%'
        )
      ORDER BY table_schema, table_name;
    `);

    result.candidates = candidatesRes.rows;

    const countsRes = await pool.query(`
      SELECT nspname as schema_name, relname as table_name, reltuples::bigint AS approx_rows
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE relkind = 'r' AND n.nspname NOT IN ('pg_catalog','information_schema')
      ORDER BY approx_rows DESC LIMIT 200;
    `);
    result.approx_counts = countsRes.rows;

    // Output JSON
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message, stack: err.stack }));
  } finally {
    await pool.end();
  }
}

inspect();
