const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/linguicas',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('\n===== TESTE: GET /api/linguicas =====');
      if (json.success && json.data) {
        console.log(`✓ Retornou ${json.data.length} produtos`);
        json.data.slice(0, 5).forEach(p => {
          console.log(`  - ID: ${p.id}, Nome: ${p.nome}, Imagem: ${p.imagem}`);
        });
      } else {
        console.log('✗ Resposta inesperada:', json);
      }
    } catch (e) {
      console.log('✗ Erro ao parsear JSON:', e.message);
      console.log('Resposta recebida:', data);
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('✗ Erro de conexão:', e.message);
  process.exit(1);
});

req.end();
