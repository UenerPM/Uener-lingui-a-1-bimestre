/**
 * LINGUIÇA REPOSITORY
 * Acesso a dados de linguiças no PostgreSQL
 */

const pool = require('../config/db');

/**
 * Helper: Extrair apenas o nome do arquivo do caminho
 * Ex: "img/produtos/1.jpg" -> "1.jpg"
 */
function extrairNomeArquivo(caminho) {
  if (!caminho) return null;
  return caminho.split('/').pop();
}

const LinguicaRepository = {
  /**
   * Obtém todas as linguiças
   */
  async getAllLinguicas() {
    const query = `
      SELECT id, nome, descricao, preco, estoque, imagem, created_at, updated_at
      FROM linguicas
      WHERE ativo = true
      ORDER BY nome
    `;

    const result = await pool.query(query);
    return result.rows.map(r => ({
      ...r,
      imagem: extrairNomeArquivo(r.imagem)
    }));
  },

  /**
   * Obtém linguiça por ID
   */
  async getLinguicaById(id) {
    const query = `
      SELECT id, nome, descricao, preco, estoque, imagem, created_at, updated_at
      FROM linguicas
      WHERE id = $1 AND ativo = true
    `;

    const result = await pool.query(query, [id]);
    if (!result.rows[0]) return null;
    return {
      ...result.rows[0],
      imagem: extrairNomeArquivo(result.rows[0].imagem)
    };
  },

  /**
   * Obtém linguiça por nome
   */
  async getLinguicaByNome(nome) {
    const query = `
      SELECT id, nome, descricao, preco, estoque, imagem, created_at, updated_at
      FROM linguicas
      WHERE nome = $1 AND ativo = true
    `;

    const result = await pool.query(query, [nome]);
    if (!result.rows[0]) return null;
    return {
      ...result.rows[0],
      imagem: extrairNomeArquivo(result.rows[0].imagem)
    };
  },

  /**
   * Cria nova linguiça
   */
  async createLinguica(nome, descricao = '', preco, estoque = 0, imagem = null) {
    const query = `
      INSERT INTO linguicas (nome, descricao, preco, estoque, imagem)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nome, descricao, preco, estoque, imagem, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, [nome, descricao, preco, estoque, imagem]);
      return {
        ...result.rows[0],
        imagem: extrairNomeArquivo(result.rows[0].imagem)
      };
    } catch (err) {
      if (err.code === '23505' && err.constraint === 'linguicas_nome_key') {
        throw new Error('Nome da linguiça já cadastrado');
      }
      throw err;
    }
  },

  /**
   * Atualiza linguiça
   */
  async updateLinguica(id, updates) {
    const allowedFields = ['nome', 'descricao', 'preco', 'estoque', 'imagem'];
    const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fieldsToUpdate.length === 0) {
      const linguica = await this.getLinguicaById(id);
      if (!linguica) throw new Error('Linguiça não encontrada');
      return linguica;
    }

    const setClause = fieldsToUpdate.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
    const values = fieldsToUpdate.map(field => updates[field]);
    values.push(id);

    const query = `
      UPDATE linguicas
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${fieldsToUpdate.length + 1} AND ativo = true
      RETURNING id, nome, descricao, preco, estoque, imagem, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Linguiça não encontrada');
      }

      return {
        ...result.rows[0],
        imagem: extrairNomeArquivo(result.rows[0].imagem)
      };
    } catch (err) {
      if (err.code === '23505' && err.constraint === 'linguicas_nome_key') {
        throw new Error('Nome da linguiça já cadastrado');
      }
      throw err;
    }
  },

  /**
   * Deleta linguiça (soft delete)
   */
  async deleteLinguica(id) {
    const query = `
      UPDATE linguicas
      SET ativo = false, updated_at = NOW()
      WHERE id = $1 AND ativo = true
      RETURNING id, nome, descricao, preco, estoque, imagem, created_at, updated_at
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error('Linguiça não encontrada');
    }

    return {
      ...result.rows[0],
      imagem: extrairNomeArquivo(result.rows[0].imagem)
    };
  },

  /**
   * Verifica estoque disponível
   */
  async verificarEstoque(id, quantidade) {
    const linguica = await this.getLinguicaById(id);

    if (!linguica) {
      throw new Error('Linguiça não encontrada');
    }

    if (linguica.estoque < quantidade) {
      throw new Error(`Estoque insuficiente. Disponível: ${linguica.estoque}`);
    }

    return true;
  },

  /**
   * Reduz estoque (usado após venda)
   */
  async decrementarEstoque(id, quantidade) {
    const query = `
      UPDATE linguicas
      SET estoque = estoque - $1, updated_at = NOW()
      WHERE id = $2 AND ativo = true AND estoque >= $1
      RETURNING id, nome, descricao, preco, estoque, imagem, created_at, updated_at
    `;

    const result = await pool.query(query, [quantidade, id]);

    if (result.rows.length === 0) {
      throw new Error('Falha ao decrementar estoque ou linguiça não encontrada');
    }

    return {
      ...result.rows[0],
      imagem: extrairNomeArquivo(result.rows[0].imagem)
    };
  }
};

module.exports = LinguicaRepository;
