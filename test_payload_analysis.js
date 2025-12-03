const payload = '00020126440014br.gov.bcb.pix0122uperesmarcon@gmail.com520400005303986540520.005802BR5913UENER LINGUÇO6012CAMPO MOURAO62220518UENER176469460995063045B8E';

console.log('=== ANÁLISE DO PAYLOAD FORNECIDO ===\n');
console.log('Tamanho total:', payload.length, 'caracteres');
console.log('Payload:', payload);
console.log('\n=== PARSING TAG POR TAG ===\n');

let pos = 0;
const tags = [];

while (pos < payload.length) {
  const tag = payload.slice(pos, pos + 2);
  const len = parseInt(payload.slice(pos + 2, pos + 4), 10);
  const value = payload.slice(pos + 4, pos + 4 + len);
  
  tags.push({ tag, len, value, pos });
  console.log(`Tag ${tag}: len=${len}, value='${value}'`);
  
  pos += 4 + len;
}

console.log('\n=== VERIFICAÇÃO FINAL ===\n');
console.log('Posição final:', pos, '(deve ser', payload.length, ')');
console.log('CRC (últimos 4 chars):', payload.slice(-4));

// Agora gerar novo payload com nossa implementação
console.log('\n\n=== COMPARAÇÃO COM NOVO GERADOR ===\n');
const pix = require('./src/lib/pix');
const novoPayload = pix.gerarPayloadPix(520.00);
console.log('Novo payload:', novoPayload);
console.log('Tamanho:', novoPayload.length);
console.log('CRC:', novoPayload.slice(-4));
