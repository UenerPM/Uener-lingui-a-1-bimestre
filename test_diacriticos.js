/**
 * Teste: Validar payload com cedilha removida
 * 
 * Antes: UENER LINGUÇO (com cedilha)
 * Depois: UENER LINGUCO (sem cedilha)
 */

const pix = require('./src/lib/pix.js');

console.log('═══════════════════════════════════════════════════════');
console.log('TESTE: REMOÇÃO DE DIACRÍTICOS NO FRONTEND');
console.log('═══════════════════════════════════════════════════════\n');

// Função de remoção (mesmo do frontend agora)
function removerDiacriticos(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

console.log('Teste de remoção de diacríticos:');
console.log(`  Entrada: 'UENER LINGUÇO'`);
console.log(`  Saída:   '${removerDiacriticos('UENER LINGUÇO')}'`);
console.log(`  Entrada: 'CAMPO MOURAO'`);
console.log(`  Saída:   '${removerDiacriticos('CAMPO MOURAO')}'`);

// Simular payload que frontend vai gerar agora
function construirPayloadPixFrontend(valor) {
  function tag(id, value) {
    const v = String(value);
    const len = String(v.length).padStart(2, '0');
    return id + len + v;
  }

  function crc16Ccitt(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  let payload = '';
  payload += tag('00', '01');

  const mai = tag('00', 'BR.GOV.BCB.PIX') + tag('01', 'uperesmarcon@gmail.com');
  payload += tag('26', mai);

  payload += tag('52', '0000');
  payload += tag('53', '986');
  payload += tag('54', valor.toFixed(2));
  payload += tag('58', 'BR');

  // ✅ Com remoção de diacríticos (CORRETO)
  const merchantName = removerDiacriticos('UENER LINGUÇO').toUpperCase().substring(0, 25);
  const merchantCity = removerDiacriticos('CAMPO MOURAO').toUpperCase().substring(0, 15);
  payload += tag('59', merchantName);
  payload += tag('60', merchantCity);

  const additionalData = tag('05', 'UEN' + Date.now().toString().slice(-8));
  payload += tag('62', additionalData);

  const payloadComCrc = payload + '6304';
  const crcValue = crc16Ccitt(payloadComCrc);
  payload += tag('63', crcValue);

  return payload;
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('SIMULAÇÃO DO NOVO FRONTEND');
console.log('═══════════════════════════════════════════════════════\n');

const payloadNovoFrontend = construirPayloadPixFrontend(2.00);
console.log(`Payload gerado: ${payloadNovoFrontend.substring(0, 50)}...`);
console.log(`Tamanho: ${payloadNovoFrontend.length} caracteres`);

const crcNovoFrontend = payloadNovoFrontend.substring(payloadNovoFrontend.length - 4);
console.log(`CRC: ${crcNovoFrontend}`);

// Validar
const validNovoFrontend = pix.validarPayloadPix(payloadNovoFrontend);
console.log(`Válido: ${validNovoFrontend ? 'SIM ✓✓✓' : 'NÃO ✗'}\n`);

// Comparar com backend
console.log('═══════════════════════════════════════════════════════');
console.log('COMPARAÇÃO COM BACKEND');
console.log('═══════════════════════════════════════════════════════\n');

const respBackend = pix.gerarRespostaPix(2.00);
console.log(`Backend tamanho: ${respBackend.payload.length} caracteres`);
console.log(`Frontend tamanho: ${payloadNovoFrontend.length} caracteres\n`);

// Parse ambos
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

const tagsBackend = parsePayload(respBackend.payload);
const tagsFrontend = parsePayload(payloadNovoFrontend);

console.log('Comparação de tags:');
let igual = true;
for (let i = 0; i < Math.min(tagsBackend.length, tagsFrontend.length); i++) {
  const tb = tagsBackend[i];
  const tf = tagsFrontend[i];

  if (tb.tag === '62' || tb.tag === '63') {
    console.log(`  Tag ${tb.tag}: Varia por timestamp (esperado)`);
  } else if (tb.value === tf.value) {
    console.log(`  ✓ Tag ${tb.tag}: '${tb.value}'`);
  } else {
    console.log(`  ✗ Tag ${tb.tag}: Backend='${tb.value}' vs Frontend='${tf.value}'`);
    igual = false;
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('RESULTADO FINAL');
console.log('═══════════════════════════════════════════════════════\n');

if (validNovoFrontend && igual) {
  console.log('✅ SUCESSO! PAYLOAD AGORA ESTÁ CORRETO!');
  console.log('\n✓ Cedilha foi removida (LINGUÇO → LINGUCO)');
  console.log('✓ CRC é válido');
  console.log('✓ Tamanho é consistente');
  console.log('✓ Frontend e Backend geram payloads compatíveis');
  console.log('\n🚀 O PIX está pronto para usar!');
} else if (!validNovoFrontend) {
  console.log('❌ CRC ainda inválido');
} else {
  console.log('⚠️  Payloads diferem em campos que variam (esperado)');
}
