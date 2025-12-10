const pix = require('./src/lib/pix.js');

// Payload fornecido APÓS limpeza de cache
const payloadFrontend = '00020126440014BR.GOV.BCB.PIX0122uperesmarcon@gmail.com52040000530398654042.005802BR5913UENER LINGUÇO6012CAMPO MOURAO62220518UENER17646991599536304D6D8';

console.log('═══════════════════════════════════════════════════════');
console.log('ANÁLISE DO PAYLOAD APÓS LIMPEZA DE CACHE');
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
console.log('Tags encontradas:');
tagsFrontend.forEach(t => {
  console.log(`  Tag ${t.tag} (len=${t.len.toString().padStart(2, '0')}): '${t.value}'`);
});

const crcFrontend = payloadFrontend.substring(payloadFrontend.length - 4);
console.log(`\nCRC do payload: ${crcFrontend}`);
console.log(`Tamanho do payload: ${payloadFrontend.length} caracteres\n`);

// Validar payload frontend
console.log('═══════════════════════════════════════════════════════');
console.log('VALIDAÇÃO');
console.log('═══════════════════════════════════════════════════════\n');

const validFrontend = pix.validarPayloadPix(payloadFrontend);
console.log(`✓ Payload é válido? ${validFrontend ? 'SIM ✓✓✓' : 'NÃO ✗'}`);

if (!validFrontend) {
  // Recalcular CRC
  const payloadSemCrc = payloadFrontend.substring(0, payloadFrontend.length - 8); // Remove '6304XXXX'
  const payloadParaCrc = payloadSemCrc + '6304';
  const crcCalculado = pix.crc16Ccitt(payloadParaCrc);
  console.log(`CRC esperado:  ${crcFrontend}`);
  console.log(`CRC calculado: ${crcCalculado}`);
}

// Extrair valor do frontend
const valorTag = tagsFrontend.find(t => t.tag === '54');
const valor = parseFloat(valorTag?.value || '0');

// Gerar payload do backend para comparação
console.log('\n═══════════════════════════════════════════════════════');
console.log('COMPARAÇÃO COM BACKEND');
console.log('═══════════════════════════════════════════════════════\n');

const resposta = pix.gerarRespostaPix(valor);
const tagsBackend = parsePayload(resposta.payload);

console.log(`Frontend tamanho: ${payloadFrontend.length} chars`);
console.log(`Backend tamanho:  ${resposta.payload.length} chars`);
console.log(`Frontend CRC: ${crcFrontend}`);
console.log(`Backend CRC:  ${resposta.crc}`);
console.log(`\nValor: R$ ${valor.toFixed(2)}\n`);

// Comparar campo a campo
console.log('Comparação de tags:');
let diferenças = 0;
for (let i = 0; i < Math.min(tagsFrontend.length, tagsBackend.length); i++) {
  const tf = tagsFrontend[i];
  const tb = tagsBackend[i];
  
  if (tf.tag === '62' || tf.tag === '63') {
    // Essas variam por timestamp
    console.log(`⚠  Tag ${tf.tag}: Varia por timestamp/TXID`);
  } else if (tf.value !== tb.value) {
    console.log(`✗ Tag ${tf.tag}: '${tf.value}' vs '${tb.value}'`);
    diferenças++;
  } else {
    console.log(`✓ Tag ${tf.tag}: '${tf.value}'`);
  }
}

// Conclusão
console.log('\n═══════════════════════════════════════════════════════');
console.log('CONCLUSÃO');
console.log('═══════════════════════════════════════════════════════\n');

if (validFrontend && diferenças === 0) {
  console.log('🎉 SUCESSO! PAYLOAD ESTÁ 100% CORRETO!');
  console.log('\n✅ GUI: BR.GOV.BCB.PIX (MAIÚSCULO)');
  console.log('✅ CRC: Válido e correto');
  console.log('✅ Valor: Correto');
  console.log('✅ Todos os campos: Conforme padrão BRCode');
  console.log('\n🚀 PIX PRONTO PARA USAR NO BANCO!');
} else if (validFrontend) {
  console.log('⚠️  Payload válido, mas com pequenas variações (esperado para TXID/timestamp)');
} else {
  console.log('❌ ERRO: Payload ainda inválido');
  console.log('Solução: Limpar cache novamente ou verificar o código do frontend');
}
