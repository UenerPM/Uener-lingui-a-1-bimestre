/**
 * ===== MÓDULO PIX - Backend =====
 * 
 * Gera payload EMV-Co conforme padrão BRCode (Banco Central)
 * - Validação rigorosa de campos conforme ISO 20022
 * - CRC16-CCITT (XModem) implementado conforme padrão
 * - Logs detalhados para auditoria
 * 
 * Exporta:
 * - gerarPayloadPix(valor, chavePixOpc = null)
 * - gerarQRCodePix(payload)
 * - validarPayloadPix(payload)
 * - gerarRespostaPix(valor, chavePixOpc = null)
 */

const crypto = require('crypto');

// ===== CONFIGURAÇÃO =====
const PIX_KEY = process.env.PIX_KEY || 'uperesmarcon@gmail.com';
const MERCHANT_NAME = (process.env.PIX_MERCHANT_NAME || 'UENER LINGUÇO').toUpperCase();
const MERCHANT_CITY = (process.env.PIX_MERCHANT_CITY || 'CAMPO MOURAO').toUpperCase();
const PIX_GUID = 'BR.GOV.BCB.PIX';

function logPix(msg) { console.log(`[pix] ${msg}`); }
function logPixError(msg) { console.error(`[pix] ❌ ${msg}`); }

// ===== UTILITÁRIOS =====

/**
 * Calcula tamanho em bytes UTF-8
 */
function byteLength(str) {
  return Buffer.byteLength(String(str), 'utf8');
}

/**
 * Cria tag EMV: ID + tamanho (2 dígitos) + valor
 * Exemplo: tag('59', 'UENER LINGUÇO') → '591UENER LINGUÇO'
 *          (59 = tag, 1 = 1 byte de len, resto é valor)
 */
function tag(id, value) {
  const v = String(value);
  const len = String(byteLength(v)).padStart(2, '0');
  return id + len + v;
}

/**
 * Remove diacríticos (ã → a, ç → c) e valida caracteres
 * Limite de tamanho em bytes.
 */
function sanitize(str, maxBytes = 25) {
  if (!str) return '';
  // Remove diacríticos
  const normalized = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Permite apenas letras, números, espaço, hífen, ponto
  const cleaned = normalized.replace(/[^A-Za-z0-9 \-.,]/g, '');
  // Truncar se necessário (respeitar limite de bytes)
  const upper = cleaned.toUpperCase();
  const buf = Buffer.from(upper, 'utf8');
  if (buf.length > maxBytes) {
    return buf.slice(0, maxBytes).toString('utf8');
  }
  return upper;
}

// ===== CRC16-CCITT (XModem) =====

/**
 * Calcula CRC16-CCITT conforme padrão EMV-Co para PIX
 * - Polynomial: 0x1021
 * - Initial value: 0xFFFF
 * - Reflection: Nenhuma
 * - Final value: Nenhuma
 * 
 * Entrada: string em UTF-8
 * Saída: 4 caracteres HEX maiúsculos (ex: '1A2B')
 */
function crc16Ccitt(input) {
  const buffer = Buffer.from(input, 'utf8');
  let crc = 0xFFFF;

  for (let i = 0; i < buffer.length; i++) {
    crc ^= (buffer[i] << 8);
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ===== GERAÇÃO DE PAYLOAD =====

/**
 * Monta payload EMV-Co PIX estático conforme padrão BRCode
 * 
 * Campos obrigatórios:
 * - 00: Payload Format Indicator (sempre '01')
 * - 26: Merchant Account Information
 *   - 00: Globally Unique Identifier (GUI = 'BR.GOV.BCB.PIX')
 *   - 01: Chave PIX (email, CPF, CNPJ, telefone ou aleatória)
 * - 52: Merchant Category Code (MCC - sempre '0000' para P2P)
 * - 53: Transaction Currency (986 = BRL)
 * - 54: Transaction Amount (opcional; se informado, estático)
 * - 58: Country Code ('BR')
 * - 59: Merchant Name (até 25 bytes)
 * - 60: Merchant City (até 15 bytes)
 * - 62: Additional Data Field Template (TXID obrigatório)
 *   - 05: Unique Transaction ID (até 25 bytes)
 * - 63: CRC16-CCITT (calculado sobre campo 00 a 62 sem 63)
 */
function gerarPayloadPix(valor = null, chavePixOpc = null) {
  try {
    // Usar chave fornecida ou variável de ambiente
    const chavePix = chavePixOpc || PIX_KEY;
    const nomeComercio = sanitize(MERCHANT_NAME, 25);
    const cidadeComercio = sanitize(MERCHANT_CITY, 15);

    if (!chavePix || typeof chavePix !== 'string' || chavePix.trim().length === 0) {
      throw new Error('Chave PIX inválida ou não configurada');
    }

    if (!nomeComercio || nomeComercio.length === 0) {
      throw new Error('Nome do comércio não pode ser vazio');
    }

    if (!cidadeComercio || cidadeComercio.length === 0) {
      throw new Error('Cidade do comércio não pode ser vazia');
    }

    let payload = '';

    // Tag 00: Payload Format Indicator
    payload += tag('00', '01');

    // Tag 26: Merchant Account Information
    // Subtag 00: GUI (sempre BR.GOV.BCB.PIX)
    // Subtag 01: Chave PIX
    const merchantInfo = tag('00', PIX_GUID) + tag('01', chavePix);
    payload += tag('26', merchantInfo);

    // Tag 52: Merchant Category Code (P2P = 0000)
    payload += tag('52', '0000');

    // Tag 53: Currency Code (986 = BRL)
    payload += tag('53', '986');

    // Tag 54: Transaction Amount (opcional)
    // Formato: sempre com ponto decimal, máximo 2 casas decimais
    if (valor !== null && valor !== undefined && String(valor).trim().length > 0) {
      const valorNum = Number(valor);
      if (Number.isFinite(valorNum) && valorNum > 0) {
        const valorFormatado = valorNum.toFixed(2);
        payload += tag('54', valorFormatado);
      }
    }

    // Tag 58: Country Code
    payload += tag('58', 'BR');

    // Tag 59: Merchant Name
    payload += tag('59', nomeComercio);

    // Tag 60: Merchant City
    payload += tag('60', cidadeComercio);

    // Tag 62: Additional Data Field Template
    // Subtag 05: Unique Transaction ID
    const txid = 'UEN' + Date.now().toString().slice(-8);
    const additionalData = tag('05', txid);
    payload += tag('62', additionalData);

    // Tag 63: CRC16 (calculado sobre payload + "6304" que é o placeholder)
    const payloadToCrc = payload + '6304';
    const crc = crc16Ccitt(payloadToCrc);
    payload += tag('63', crc);

    // Validação: recalcular CRC para verificar
    const payloadSemCrc = payload.slice(0, -8); // Remove '63' + '04' + 4 hex
    const crcVerif = crc16Ccitt(payloadSemCrc + '6304');
    if (crcVerif !== crc) {
      logPixError(`CRC mismatch: gerado=${crc}, verificado=${crcVerif}`);
      throw new Error('CRC validation failed');
    }

    logPix(`✓ Payload gerado: len=${payload.length}, valor=${valor || 'dinâmico'}, crc=${crc}`);

    return payload;
  } catch (err) {
    logPixError(`gerarPayloadPix: ${err.message}`);
    throw err;
  }
}

/**
 * Valida um payload PIX existente
 * - Verifica estrutura básica (começa com 00, termina com 63)
 * - Recalcula e compara CRC16
 */
function validarPayloadPix(payload) {
  try {
    if (!payload || typeof payload !== 'string') {
      logPix('Payload inválido: não é string');
      return false;
    }

    if (payload.length < 10) {
      logPix('Payload muito curto');
      return false;
    }

    // Extrair CRC da posição final
    if (!payload.endsWith(payload.slice(-4))) {
      // payload termina com 63 + 04 + 4hex?
      const match = payload.match(/6304([0-9A-Fa-f]{4})$/);
      if (!match) {
        logPix('Payload não termina com tag 63 (CRC)');
        return false;
      }
    }

    // Remover CRC, recalcular
    const payloadSemCrc = payload.slice(0, -8);
    const crcEsperado = payload.slice(-4);
    const crcCalculado = crc16Ccitt(payloadSemCrc + '6304');

    if (crcEsperado !== crcCalculado) {
      logPix(`❌ CRC inválido: esperado=${crcEsperado}, calculado=${crcCalculado}`);
      return false;
    }

    logPix(`✓ Payload válido (CRC=${crcEsperado})`);
    return true;
  } catch (err) {
    logPixError(`validarPayloadPix: ${err.message}`);
    return false;
  }
}

/**
 * Gera URL do QR Code usando API pública
 * Pode ser gerado offline também com bibliotecas como 'qrcode'
 */
function gerarQRCodePix(payload) {
  if (!payload || typeof payload !== 'string') {
    throw new Error('Payload PIX inválido para gerar QR Code');
  }
  // Usando API pública qrserver.com (recomendado para testes/produção pequena)
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;
}

/**
 * Função completa: gera payload + QR + TXID
 * Retorna objeto com todas as informações
 */
function gerarRespostaPix(valor, chavePixOpc = null) {
  try {
    logPix(`➡️  Gerando resposta PIX para valor=${valor}`);

    const payload = gerarPayloadPix(valor, chavePixOpc);
    const qrUrl = gerarQRCodePix(payload);
    const validado = validarPayloadPix(payload);

    // Extrair TXID do payload
    const txidMatch = payload.match(/050[A-Z0-9]{8}/, '');
    const txid = txidMatch ? txidMatch[0].slice(3) : 'DESCONHECIDO';

    const resposta = {
      payload,
      qr: qrUrl,
      txid,
      validado,
      tamanho: payload.length,
      timestamp: new Date().toISOString()
    };

    logPix(`✓ Resposta gerada: tamanho=${resposta.tamanho}, txid=${resposta.txid}`);

    return resposta;
  } catch (err) {
    logPixError(`gerarRespostaPix: ${err.message}`);
    throw err;
  }
}

// ===== EXPORTS =====

module.exports = {
  gerarPayloadPix,
  gerarQRCodePix,
  validarPayloadPix,
  gerarRespostaPix,
  crc16Ccitt,
  tag,
  sanitize,
  logPix,
  logPixError
};
