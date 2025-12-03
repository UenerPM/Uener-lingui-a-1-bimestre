/**
 * PRODUTO REPOSITORY
 * Queries parametrizadas para a tabela produtos
 */

const pool = require('../config/db');
const schema = require('../config/schemaMap');

/**
 * Helper: Extrair apenas o nome do arquivo do caminho
 * Ex: "img/produtos/1.jpg" -> "1.jpg"
 */
function extrairNomeArquivo(caminho) {
  if (!caminho) return null;
  return caminho.split('/').pop();
}

const ProdutoRepository = {
  /**
   * Listar todos os produtos (público)
   */
  async getAllProdutos() {
    const t = schema.tables.produto;
    const c = schema.columns.produto;
    const img = schema.tables.imagem;
    const imgC = schema.columns.imagem;

    const query = `
      SELECT p.${c.id} as id, p.${c.nome} as nome, p.${c.preco} as preco, p.${c.estoque} as estoque,
             i.${imgC.caminho} as imagem
      FROM ${t} p
      LEFT JOIN ${img} i ON p.${c.id_imagem} = i.${imgC.id}
      ORDER BY p.${c.nome} ASC
    `;

    const result = await pool.query(query);
    // Normalizar campos para API: id, nome, preco, estoque, imagem
    return result.rows.map(r => ({
      id: r.id,
      nome: r.nome,
      preco: parseFloat(r.preco),
      estoque: Number(r.estoque),
      imagem: extrairNomeArquivo(r.imagem)
    }));
  },

  /**
   * Obter um produto por ID (público)
   */
  async getProdutoById(id) {
    const t = schema.tables.produto;
    const c = schema.columns.produto;
    const img = schema.tables.imagem;
    const imgC = schema.columns.imagem;

    const query = `
      SELECT p.${c.id} as id, p.${c.nome} as nome, p.${c.preco} as preco, p.${c.estoque} as estoque,
             i.${imgC.caminho} as imagem
      FROM ${t} p
      LEFT JOIN ${img} i ON p.${c.id_imagem} = i.${imgC.id}
      WHERE p.${c.id} = $1
    `;

    const result = await pool.query(query, [id]);
    if (!result.rows[0]) return null;
    const r = result.rows[0];
    return { id: r.id, nome: r.nome, preco: parseFloat(r.preco), estoque: Number(r.estoque), imagem: extrairNomeArquivo(r.imagem) };
  },

  /**
   * Criar novo produto (admin)
   */
  async createProduto(nome, categoria, descricao, preco, estoque = 0, imagem = null) {
    // Adapta os parâmetros da API ao schema existente (produto)
    if (!nome || !preco) {
      throw new Error('nome e preco são obrigatórios');
    }

    const t = schema.tables.produto;
    const c = schema.columns.produto;
    const imgTbl = schema.tables.imagem;
    const imgC = schema.columns.imagem;

    // Se recebeu caminho de imagem (string), inserir na tabela imagem
    let idImagem = null;
    if (imagem && typeof imagem === 'string') {
      const r = await pool.query(`INSERT INTO ${imgTbl} (${imgC.caminho}) VALUES ($1) RETURNING ${imgC.id}`, [imagem]);
      idImagem = r.rows[0][imgC.id];
    } else if (imagem && Number.isInteger(imagem)) {
      idImagem = imagem;
    }

    const query = `
      INSERT INTO ${t} (${c.nome}, ${c.preco}, ${c.estoque}, ${c.id_imagem})
      VALUES ($1, $2, $3, $4)
      RETURNING ${c.id} as id, ${c.nome} as nome, ${c.preco} as preco, ${c.estoque} as estoque, ${c.id_imagem} as id_imagem
    `;

    try {
      const result = await pool.query(query, [nome, preco, estoque, idImagem]);
      const row = result.rows[0];
      // obter caminho da imagem
      let caminho = null;
      if (row.id_imagem) {
        const ir = await pool.query(`SELECT ${imgC.caminho} as caminho FROM ${imgTbl} WHERE ${imgC.id} = $1`, [row.id_imagem]);
        caminho = extrairNomeArquivo(ir.rows[0] ? ir.rows[0].caminho : null);
      }
      return { id: row.id, nome: row.nome, preco: parseFloat(row.preco), estoque: Number(row.estoque), imagem: caminho };
    } catch (err) {
      if (err.code === '23505') { // unique_violation
        throw new Error(`Produto '${nome}' já existe`);
      }
      throw err;
    }
  },

  /**
   * Atualizar produto (admin)
   */
  async updateProduto(id, nome, categoria, descricao, preco, estoque, imagem) {
    if (!id) throw new Error('ID do produto é obrigatório');

    const t = schema.tables.produto;
    const c = schema.columns.produto;
    const imgTbl = schema.tables.imagem;
    const imgC = schema.columns.imagem;

    const updates = [];
    const values = [];
    let param = 1;

    if (nome !== undefined) {
      updates.push(`${c.nome} = $${param}`);
      values.push(nome);
      param++;
    }

    if (preco !== undefined) {
      updates.push(`${c.preco} = $${param}`);
      values.push(preco);
      param++;
    }

    if (estoque !== undefined) {
      updates.push(`${c.estoque} = $${param}`);
      values.push(estoque);
      param++;
    }

    // imagem pode ser caminho (string) ou id
    if (imagem !== undefined) {
      let idImagem = null;
      if (imagem && typeof imagem === 'string') {
        const r = await pool.query(`INSERT INTO ${imgTbl} (${imgC.caminho}) VALUES ($1) RETURNING ${imgC.id}`, [imagem]);
        idImagem = r.rows[0][imgC.id];
      } else if (imagem && Number.isInteger(imagem)) {
        idImagem = imagem;
      }
      updates.push(`${c.id_imagem} = $${param}`);
      values.push(idImagem);
      param++;
    }

    if (updates.length === 0) {
      const p = await this.getProdutoById(id);
      if (!p) throw new Error('Produto não encontrado');
      return p;
    }

    const query = `UPDATE ${t} SET ${updates.join(', ')}, updated_at = NOW() WHERE ${c.id} = $${param} RETURNING ${c.id} as id, ${c.nome} as nome, ${c.preco} as preco, ${c.estoque} as estoque, ${c.id_imagem} as id_imagem`;
    values.push(id);

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) throw new Error('Produto não encontrado');
      const row = result.rows[0];
      let caminho = null;
      if (row.id_imagem) {
        const ir = await pool.query(`SELECT ${imgC.caminho} as caminho FROM ${imgTbl} WHERE ${imgC.id} = $1`, [row.id_imagem]);
        caminho = extrairNomeArquivo(ir.rows[0] ? ir.rows[0].caminho : null);
      }
      return { id: row.id, nome: row.nome, preco: parseFloat(row.preco), estoque: Number(row.estoque), imagem: caminho };
    } catch (err) {
      if (err.code === '23505') throw new Error(`Produto '${nome}' já existe`);
      throw err;
    }
  },

  /**
   * Deletar produto (soft delete - marca como inativo)
   */
  async deleteProduto(id) {
    const t = schema.tables.produto;
    const c = schema.columns.produto;
    const query = `DELETE FROM ${t} WHERE ${c.id} = $1 RETURNING ${c.id} as id, ${c.nome} as nome`;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) throw new Error('Produto não encontrado');
    return { id: result.rows[0].id, nome: result.rows[0].nome };
  },

  /**
   * Verificar estoque de um produto
   */
  async verificarEstoque(id, quantidade) {
    const t = schema.tables.produto;
    const c = schema.columns.produto;
    const query = `SELECT ${c.estoque} as estoque FROM ${t} WHERE ${c.id} = $1`;
    const result = await pool.query(query, [id]);
    if (!result.rows[0]) throw new Error(`Produto ${id} não existe`);
    if (result.rows[0].estoque < quantidade) throw new Error(`Estoque insuficiente. Disponível: ${result.rows[0].estoque}`);
    return true;
  },

  /**
   * Reduzir estoque após venda
   */
  async decrementarEstoque(id, quantidade) {
    const t = schema.tables.produto;
    const c = schema.columns.produto;
    const query = `UPDATE ${t} SET ${c.estoque} = ${c.estoque} - $1 WHERE ${c.id} = $2 AND ${c.estoque} >= $1 RETURNING ${c.estoque} as estoque`;
    const result = await pool.query(query, [quantidade, id]);
    if (result.rows.length === 0) throw new Error('Falha ao decrementar estoque ou produto não encontrado');
    return Number(result.rows[0].estoque);
  }
};

module.exports = ProdutoRepository;
