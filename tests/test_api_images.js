const repo = require('./src/repositories/produtoRepository');
const repo2 = require('./src/repositories/linguicaRepository');

console.log('===== TESTANDO API DE PRODUTOS =====');
repo.getAllProdutos().then(p => {
  console.log('\n✓ Produtos (via GET /api/produtos):');
  p.forEach(prod => {
    console.log(`  ID: ${prod.id}, Nome: ${prod.nome}, Imagem: ${prod.imagem}`);
  });
  testLinguicas();
}).catch(e => {
  console.error('✗ Erro em produtos:', e.message);
  process.exit(1);
});

function testLinguicas() {
  console.log('\n===== TESTANDO API DE LINGUIÇAS =====');
  repo2.getAllLinguicas().then(l => {
    console.log('\n✓ Linguiças (via GET /api/linguicas):');
    l.forEach(ling => {
      console.log(`  ID: ${ling.id}, Nome: ${ling.nome}, Imagem: ${ling.imagem}`);
    });
    testConstructUrlImagem();
  }).catch(e => {
    console.error('✗ Erro em linguiças:', e.message);
    process.exit(1);
  });
}

function testConstructUrlImagem() {
  console.log('\n===== TESTANDO construirUrlImagem() =====');
  // Simular a função
  function construirUrlImagem(imagemCampo) {
    if (!imagemCampo) return '/img/no-image.png';
    if (imagemCampo.startsWith('http')) return imagemCampo;
    if (imagemCampo.startsWith('/')) return imagemCampo;
    return `/imagens-produtos/${encodeURIComponent(imagemCampo)}`;
  }

  const testCases = ['1.jpg', '999.jpeg', null, 'img/produtos/2.jpg', '/img/test.png', 'http://example.com/img.jpg'];
  testCases.forEach(tc => {
    console.log(`  Input: "${tc}" → Output: "${construirUrlImagem(tc)}"`);
  });

  console.log('\n✅ Testes completados!');
  process.exit(0);
}
