const pool = require('../config/db');

/**
 * pedidoRepository-avap2.js
 * Repositório para pedidos e itens de pedido (pedidohasproduto)
 */

async function createPedido(cpfpessoa, totalvalue) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Criar pedido com data de hoje
    const pedidoRes = await client.query(
      `INSERT INTO pedido (datadopedido, clientepessoacpfpessoa, funcionariopessoacpfpessoa)
       VALUES (NOW()::date, $1, $1)
       RETURNING idpedido, datadopedido, clientepessoacpfpessoa`,
      [cpfpessoa]
    );

    const pedido = pedidoRes.rows[0];
    pedido.total = totalvalue;

    await client.query('COMMIT');
    return pedido;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('pedidoRepository.createPedido error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function addItemToPedido(idpedido, idproduto, quantidade, preco_unitario) {
  try {
    const res = await pool.query(
      `INSERT INTO pedidohasproduto (pedidoidpedido, produtoidproduto, quantidade, precounitario)
       VALUES ($1, $2, $3, $4)
       RETURNING pedidoidpedido, produtoidproduto, quantidade, precounitario`,
      [idpedido, idproduto, quantidade, preco_unitario]
    );
    return res.rows[0];
  } catch (err) {
    console.error('pedidoRepository.addItemToPedido error:', err.message);
    throw err;
  }
}

async function getPedidoById(idpedido) {
  try {
    const res = await pool.query(
      `SELECT p.idpedido, p.clientepessoacpfpessoa, p.datadopedido
       FROM pedido p
       WHERE p.idpedido = $1`,
      [idpedido]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error('pedidoRepository.getPedidoById error:', err.message);
    throw err;
  }
}

async function getPedidosPorPessoa(cpfpessoa) {
  try {
    const res = await pool.query(
      `SELECT p.idpedido, p.clientepessoacpfpessoa, p.datadopedido
       FROM pedido p
       WHERE p.clientepessoacpfpessoa = $1
       ORDER BY p.datadopedido DESC`,
      [cpfpessoa]
    );
    return res.rows;
  } catch (err) {
    console.error('pedidoRepository.getPedidosPorPessoa error:', err.message);
    throw err;
  }
}

async function getItensPedido(idpedido) {
  try {
    const res = await pool.query(
      `SELECT 
        pp.pedidoidpedido, 
        pp.produtoidproduto,
        pp.quantidade,
        pp.precounitario,
        prod.nomeproduto,
        img.caminho as imagem
       FROM pedidohasproduto pp
       LEFT JOIN produto prod ON pp.produtoidproduto = prod.idproduto
       LEFT JOIN imagem img ON prod.id_imagem = img.id
       WHERE pp.pedidoidpedido = $1`,
      [idpedido]
    );
    return res.rows;
  } catch (err) {
    console.error('pedidoRepository.getItensPedido error:', err.message);
    throw err;
  }
}

module.exports = {
  createPedido,
  addItemToPedido,
  getPedidoById,
  getPedidosPorPessoa,
  getItensPedido
};
