const pool = require('./src/config/db');

(async () => {
  try {
    console.log('\n=== VERIFICANDO COMO AS IMAGENS ESTÃO SALVAS ===\n');

    // Query 1: Tabela imagem
    console.log('1. TABELA IMAGEM:');
    const imagens = await pool.query('SELECT id, caminho FROM imagem LIMIT 10');
    console.table(imagens.rows);

    // Query 2: Produtos com imagens
    console.log('\n2. PRODUTOS COM IDS DE IMAGEM:');
    const produtos = await pool.query(`
      SELECT 
        p.idproduto, 
        p.nomeproduto, 
        p.id_imagem, 
        i.caminho as caminho_imagem
      FROM produto p 
      LEFT JOIN imagem i ON p.id_imagem = i.id 
      LIMIT 10
    `);
    console.table(produtos.rows);

    // Query 3: Onde as imagens são salvas
    console.log('\n3. CAMINHOS DAS IMAGENS (ONDE ESTÃO SALVAS):');
    const caminhos = await pool.query(`
      SELECT DISTINCT caminho FROM imagem
    `);
    console.log('Caminhos encontrados no banco:');
    caminhos.rows.forEach(row => {
      console.log('  -', row.caminho);
    });

  } catch (err) {
    console.error('Erro:', err.message);
  }
  process.exit(0);
})();
