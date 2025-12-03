// ===== TESTE DO FRONTEND PIX CORRIGIDO =====

// Função removida diacríticos
function removerDiacriticos(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// CRC16-CCITT CORRIGIDO
function crc16Ccitt(str) {
  let crc = 0xFFFF; // CORRIGIDO!
  
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

// Construir payload CORRIGIDO
function construirPayloadPix(valor) {
  function tag(id, value) {
    const v = String(value || '');
    const len = String(v.length).padStart(2, '0');
    return id + len + v;
  }
  
  const pixKey = 'uperesmarcon@gmail.com';
  const merchantName = removerDiacriticos('UENER LINGUÇO').substring(0, 25);
  const merchantCity = removerDiacriticos('CAMPO MOURAO').substring(0, 15);
  const txId = 'UEN' + Date.now().toString().slice(-8);
  
  let payload = '';
  payload += tag('00', '01');
  
  const mai = tag('00', 'BR.GOV.BCB.PIX') + tag('01', pixKey);
  payload += tag('26', mai);
  
  payload += tag('52', '0000');
  payload += tag('53', '986');
  payload += tag('54', valor.toFixed(2));
  payload += tag('58', 'BR');
  payload += tag('59', merchantName);
  payload += tag('60', merchantCity);
  
  const additionalData = tag('05', txId);
  payload += tag('62', additionalData);
  
  const payloadComCrc = payload + '6304';
  const crcValue = crc16Ccitt(payloadComCrc);
  payload += tag('63', crcValue);
  
  return payload;
}

// ===== TESTES =====

console.log('=== TESTE FRONTEND PIX CORRIGIDO ===\n');

const valor = 520.00;
const novoPayload = construirPayloadPix(valor);

console.log('Valor:', valor);
console.log('Novo Payload:', novoPayload);
console.log('Tamanho:', novoPayload.length);
console.log('CRC:', novoPayload.slice(-4));

console.log('\n=== COMPARAÇÃO COM PAYLOAD FORNECIDO ===\n');
const payloadFornecido = '00020126440014br.gov.bcb.pix0122uperesmarcon@gmail.com520400005303986540520.005802BR5913UENER LINGUÇO6012CAMPO MOURAO62220518UENER176469460995063045B8E';

console.log('Fornecido:  ', payloadFornecido);
console.log('Novo:       ', novoPayload);
console.log('Tamanho diferente:', payloadFornecido.length, 'vs', novoPayload.length);

// Comparar estrutura
console.log('\n=== ANÁLISE DE DIFERENÇAS ===\n');
console.log('Fornecido GUI:    br.gov.bcb.pix (minúsculo) ❌');
console.log('Novo GUI:         BR.GOV.BCB.PIX (maiúsculo) ✅');
console.log('');
console.log('Fornecido CRC:    5B8E');
console.log('Novo CRC:        ', novoPayload.slice(-4));
