const pix = require('./src/lib/pix.js');

// Payload fornecido pelo frontend
const payloadFrontend = '00020126440014br.gov.bcb.pix0122uperesmarcon@gmail.com520400005303986540520.005802BR5913UENER LINGUÇO6012CAMPO MOURAO62220518UENER17646967842006304E3CD';

console.log('═══════════════════════════════════════════════════════');
console.log('ANÁLISE DO PAYLOAD DO FRONTEND');
console.log('═══════════════════════════════════════════════════════\n');

// Parse do payload frontend
function parsePayload(payload) {
  const result = [];
  let i = 0;
  while (i < payload.length) {
    const tag = payload.substring(i, i + 2);
    const len = parseInt(payload.substring(i + 2, i + 4), 10);
    const value = payload.substring(i + 4, i + 4 + len);
    result.push({ tag, len, value });
    i += 4 + len;
  }
  return result;
}

const tagsFrontend = parsePayload(payloadFrontend);
console.log('Tags encontradas no payload frontend:');
tagsFrontend.forEach(t => {
  console.log(`  Tag ${t.tag} (len=${t.len.toString().padStart(2, '0')}): '${t.value}'`);
});

const crcFrontend = payloadFrontend.substring(payloadFrontend.length - 4);
console.log(`\nCRC final no frontend: ${crcFrontend}`);
console.log(`Tamanho do payload: ${payloadFrontend.length} caracteres\n`);

// Gerar payload do backend
console.log('═══════════════════════════════════════════════════════');
console.log('GERANDO PAYLOAD DO BACKEND');
console.log('═══════════════════════════════════════════════════════\n');

const resposta = pix.gerarRespostaPix(520.00);
console.log('Resposta do backend:');
console.log(JSON.stringify(resposta, null, 2));

const tagsBackend = parsePayload(resposta.payload);
console.log('\nTags encontradas no payload backend:');
tagsBackend.forEach(t => {
  console.log(`  Tag ${t.tag} (len=${t.len.toString().padStart(2, '0')}): '${t.value}'`);
});

// Comparação
console.log('\n═══════════════════════════════════════════════════════');
console.log('COMPARAÇÃO');
console.log('═══════════════════════════════════════════════════════\n');
console.log(`Frontend payload size: ${payloadFrontend.length}`);
console.log(`Backend payload size:  ${resposta.payload.length}`);
console.log(`Frontend CRC: ${crcFrontend}`);
console.log(`Backend CRC:  ${resposta.crc}`);
console.log(`\n⚠️  DIFERENÇA KEY:`);
console.log(`Frontend GUI: br.gov.bcb.pix (MINÚSCULO)`);
console.log(`Backend GUI:  BR.GOV.BCB.PIX (MAIÚSCULO)`);
console.log(`\nISSO PODE CAUSAR REJEIÇÃO DO QR CODE POR ALGUNS LEITORES!`);

// Validar payload frontend
console.log('\n═══════════════════════════════════════════════════════');
console.log('VALIDAÇÃO DO PAYLOAD FRONTEND');
console.log('═══════════════════════════════════════════════════════\n');

const validFrontend = pix.validarPayloadPix(payloadFrontend);
console.log(`Payload frontend é válido? ${validFrontend ? 'SIM ✓' : 'NÃO ✗'}`);

const validBackend = pix.validarPayloadPix(resposta.payload);
console.log(`Payload backend é válido? ${validBackend ? 'SIM ✓' : 'NÃO ✗'}`);
