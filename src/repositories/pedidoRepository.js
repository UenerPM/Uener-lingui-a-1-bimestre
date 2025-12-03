/**
 * PEDIDO REPOSITORY
 * Queries parametrizadas para pedidos e itens_pedido
 */

const pool = require('../config/db');
const schema = require('../config/schemaMap');

const PedidoRepository = {
  // Helper: tenta encontrar pessoa pelo username (cpf ou email)
  async findPessoaByUsername(username) {
    if (!username) return null;
    const pessoaTable = schema.tables.pessoa;
    const cpfCol = schema.columns.pessoa.cpf;
    const emailCol = schema.columns.pessoa.email;
    const q = `SELECT ${cpfCol} as cpf, ${schema.columns.pessoa.nome} as nome, ${emailCol} as email FROM ${pessoaTable} WHERE ${cpfCol} = $1 OR ${emailCol} = $1 LIMIT 1`;
    const r = await pool.query(q, [username]);
    return r.rows[0] || null;
  },

  /**
   * Listar pedidos do usuário (tenta mapear username -> pessoa.cpf)
   */
  async getPedidosByUser(username) {
    // Tenta achar CPF da pessoa a partir do username
    const pessoa = await this.findPessoaByUsername(username);
    if (!pessoa) return [];

    const pedidoTable = schema.tables.pedido;
    const itensTable = schema.tables.itens_pedido;
    const pedidoCols = schema.columns.pedido;
    const itensCols = schema.columns.itens_pedido;

    // Buscar pedidos do cliente
    const pedidosRes = await pool.query(
      `SELECT ${pedidoCols.id} as id, ${pedidoCols.data} as data, ${pedidoCols.cliente_fk} as cliente_cpf, ${pedidoCols.funcionario_fk} as funcionario_cpf
       FROM ${pedidoTable}
       WHERE ${pedidoCols.cliente_fk} = $1
       ORDER BY ${pedidoCols.data} DESC`,
      [pessoa.cpf]
    );

    const pedidos = [];
    for (const p of pedidosRes.rows) {
      // Buscar itens
      const itensRes = await pool.query(
        `SELECT ${itensCols.produto_fk} as produto_id, ${itensCols.quantidade} as quantidade, ${itensCols.preco_unitario} as preco_unitario
         FROM ${itensTable}
         WHERE ${itensCols.pedido_fk} = $1`,
        [p.id]
      );

      pedidos.push({
        id: p.id,
        data: p.data,
        cliente_cpf: p.cliente_cpf,
        funcionario_cpf: p.funcionario_cpf,
        itens: itensRes.rows
      });
    }

    return pedidos;
  },

  /**
   * Listar todos os pedidos (admin)
   */
  async getAllPedidos() {
    const pedidoTable = schema.tables.pedido;
    const itensTable = schema.tables.itens_pedido;
    const pedidoCols = schema.columns.pedido;
    const itensCols = schema.columns.itens_pedido;

    const pedidosRes = await pool.query(
      `SELECT ${pedidoCols.id} as id, ${pedidoCols.data} as data, ${pedidoCols.cliente_fk} as cliente_cpf, ${pedidoCols.funcionario_fk} as funcionario_cpf
       FROM ${pedidoTable}
       ORDER BY ${pedidoCols.data} DESC`
    );

    const pedidos = [];
    for (const p of pedidosRes.rows) {
      const itensRes = await pool.query(
        `SELECT ${itensCols.produto_fk} as produto_id, ${itensCols.quantidade} as quantidade, ${itensCols.preco_unitario} as preco_unitario
         FROM ${itensTable}
         WHERE ${itensCols.pedido_fk} = $1`,
        [p.id]
      );

      pedidos.push({
        id: p.id,
        data: p.data,
        cliente_cpf: p.cliente_cpf,
        funcionario_cpf: p.funcionario_cpf,
        itens: itensRes.rows
      });
    }

    return pedidos;
  },

  /**
   * Obter um pedido por ID
   */
  async getPedidoById(id) {
    const pedidoTable = schema.tables.pedido;
    const itensTable = schema.tables.itens_pedido;
    const pedidoCols = schema.columns.pedido;
    const itensCols = schema.columns.itens_pedido;

    const r = await pool.query(
      `SELECT ${pedidoCols.id} as id, ${pedidoCols.data} as data, ${pedidoCols.cliente_fk} as cliente_cpf, ${pedidoCols.funcionario_fk} as funcionario_cpf
       FROM ${pedidoTable}
       WHERE ${pedidoCols.id} = $1 LIMIT 1`,
      [id]
    );
    const pedido = r.rows[0];
    if (!pedido) return null;

    const itensRes = await pool.query(
      `SELECT ${itensCols.produto_fk} as produto_id, ${itensCols.quantidade} as quantidade, ${itensCols.preco_unitario} as preco_unitario
       FROM ${itensTable}
       WHERE ${itensCols.pedido_fk} = $1`,
      [id]
    );

    pedido.itens = itensRes.rows;
    return pedido;
  },

  /**
   * Criar novo pedido (mapear para colunas reais)
   */
  async createPedido(username, cliente_cpf = null, itens = [], observacoes = null) {
    if (!username) throw new Error('Usuário é obrigatório');
    if (!itens || itens.length === 0) throw new Error('Pedido deve ter ao menos 1 item');

    const pedidoTable = schema.tables.pedido;
    const itensTable = schema.tables.itens_pedido;
    const pedidoCols = schema.columns.pedido;
    const itensCols = schema.columns.itens_pedido;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const now = new Date();

      // Escolhe um funcionário padrão (não destrutivo): pega primeiro registro da tabela funcionario
      const funcionarioRes = await client.query(`SELECT * FROM ${schema.tables.funcionario} LIMIT 1`);
      let funcionarioCpf = null;
      if (funcionarioRes.rows[0]) {
        const row = funcionarioRes.rows[0];
        // diferentes nomes de coluna possíveis: 'pessoacpfpessoa', 'cpfpessoa', 'pessoacpf'
        funcionarioCpf = row.pessoacpfpessoa || row.cpfpessoa || row.pessoacpf || null;
      }

      // Inserir pedido (funcionario_fk não pode ser nulo no schema avap2)
      const insertPedido = `INSERT INTO ${pedidoTable} (${pedidoCols.data}, ${pedidoCols.cliente_fk}, ${pedidoCols.funcionario_fk}) VALUES ($1, $2, $3) RETURNING ${pedidoCols.id} as id`;
      const res = await client.query(insertPedido, [now, cliente_cpf, funcionarioCpf]);
      const pedido_id = res.rows[0].id;

      // Inserir itens
      for (const it of itens) {
        if (!it.produto_id) throw new Error('Cada item deve ter produto_id');
        const insertItem = `INSERT INTO ${itensTable} (${itensCols.pedido_fk}, ${itensCols.produto_fk}, ${itensCols.quantidade}, ${itensCols.preco_unitario}) VALUES ($1,$2,$3,$4)`;
        await client.query(insertItem, [pedido_id, it.produto_id, it.quantidade, it.preco_unitario]);
      }

      await client.query('COMMIT');

      return { id: pedido_id };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Atualizar status do pedido -> aqui mapeamos apenas campos simples: não existe coluna 'status' no avap2 por padrão
   */
  async updatePedidoStatus(id, status) {
    // avap2 não tem coluna de status padronizada — não destruímos o DB
    // Implementação mínima: retorna o pedido caso exista
    const r = await pool.query(`SELECT ${schema.columns.pedido.id} as id FROM ${schema.tables.pedido} WHERE ${schema.columns.pedido.id} = $1`, [id]);
    if (r.rows.length === 0) throw new Error(`Pedido ${id} não encontrado`);
    return { id: id };
  },

  /**
   * Deletar pedido (apenas admin). Removemos itens e o pedido.
   */
  async deletePedido(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM ${schema.tables.itens_pedido} WHERE ${schema.columns.itens_pedido.pedido_fk} = $1`, [id]);
      const del = await client.query(`DELETE FROM ${schema.tables.pedido} WHERE ${schema.columns.pedido.id} = $1 RETURNING ${schema.columns.pedido.id} as id`, [id]);
      await client.query('COMMIT');
      if (del.rows.length === 0) throw new Error(`Pedido ${id} não encontrado`);
      return del.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

module.exports = PedidoRepository;
