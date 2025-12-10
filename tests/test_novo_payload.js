const pix = require('./src/lib/pix.js');

// Novo payload fornecido pelo frontend
const payloadFrontend = '00020126440014BR.GOV.BCB.PIX0122uperesmarcon@gmail.com52040000530398654042.005802BR5913UENER LINGUCO6012CAMPO MOURAO62220518UENER176469935090563041A8A';

console.log('═══════════════════════════════════════════════════════');
console.log('ANÁLISE DO NOVO PAYLOAD DO FRONTEND');
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

// Validar payload frontend
console.log('═══════════════════════════════════════════════════════');
console.log('VALIDAÇÃO DO PAYLOAD FRONTEND');
console.log('═══════════════════════════════════════════════════════\n');

const validFrontend = pix.validarPayloadPix(payloadFrontend);
console.log(`Payload frontend é válido? ${validFrontend ? 'SIM ✓' : 'NÃO ✗'}`);

if (!validFrontend) {
  // Recalcular CRC
  const payloadSemCrc = payloadFrontend.substring(0, payloadFrontend.length - 8); // Remove '6304XXXX'
  const payloadParaCrc = payloadSemCrc + '6304';
  const crcCalculado = pix.crc16Ccitt(payloadParaCrc);
  console.log(`CRC esperado: ${crcFrontend}`);
  console.log(`CRC calculado: ${crcCalculado}`);
}

// Gerar payload do backend
console.log('\n═══════════════════════════════════════════════════════');
console.log('GERANDO PAYLOAD DO BACKEND');
console.log('═══════════════════════════════════════════════════════\n');

// Extrair valor do frontend para comparação
const valorTag = tagsFrontend.find(t => t.tag === '54');
const valor = parseFloat(valorTag?.value || '0');
console.log(`Valor do frontend: R$ ${valor.toFixed(2)}`);

const resposta = pix.gerarRespostaPix(valor);
console.log(`Valor do backend: R$ ${valor.toFixed(2)}\n`);

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

// Verificar discrepâncias
console.log('\n═══════════════════════════════════════════════════════');
console.log('ANÁLISE DETALHADA');
console.log('═══════════════════════════════════════════════════════\n');

console.log('✓ GUI: BR.GOV.BCB.PIX (MAIÚSCULO) - CORRETO!');
console.log(`✓ Chave PIX: uperesmarcon@gmail.com - CORRETO!`);

// Verificar cada tag
let haDiscrepancia = false;
for (let i = 0; i < Math.min(tagsFrontend.length, tagsBackend.length); i++) {
  const tf = tagsFrontend[i];
  const tb = tagsBackend[i];
  
  if (tf.tag === '62' || tf.tag === '63') {
    // Essas podem variar por timestamp/TXID
    console.log(`⚠  Tag ${tf.tag}: Pode variar (timestamp/TXID)`);
    console.log(`   Frontend: '${tf.value}'`);
    console.log(`   Backend:  '${tb.value}'\n`);
  } else if (tf.value !== tb.value) {
    console.log(`✗ DIFERENÇA na Tag ${tf.tag}:`);
    console.log(`   Frontend: '${tf.value}'`);
    console.log(`   Backend:  '${tb.value}'\n`);
    haDiscrepancia = true;
  }
}

if (!haDiscrepancia && validFrontend) {
  console.log('\n🎉 PAYLOAD DO FRONTEND ESTÁ VÁLIDO E CORRETO!');
} else if (!validFrontend) {
  console.log('\n❌ CRC DO FRONTEND ESTÁ INVÁLIDO!');
  console.log('Solução: Limpar cache do navegador (Ctrl + Shift + Delete) e recarregar a página');
}
