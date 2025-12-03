/**
 * ===== ROTA PIX =====
 * 
 * GET /api/pix/generate?amount=12.34
 * 
 * Gera payload EMV-Co conforme padrão BRCode (Banco Central)
 * Retorna: { success: true, payload, qr, txid, tamanho, validado, timestamp }
 * 
 * Requisitos atendidos:
 * ✓ Payload Format Indicator (00 = '01')
 * ✓ Point of Initialization (não dinâmico)
 * ✓ Merchant Account Info (26) com GUI='BR.GOV.BCB.PIX' e chave PIX
 * ✓ Merchant Category Code (52 = '0000')
 * ✓ Currency (53 = '986' para BRL)
 * ✓ Amount (54) formatado com ponto decimal, 2 casas
 * ✓ Country Code (58 = 'BR')
 * ✓ Merchant Name (59), Merchant City (60)
 * ✓ Additional Data (62) com TXID (05)
 * ✓ CRC16-CCITT (63) calculado conforme padrão
 * ✓ Logs detalhados de auditoria
 */

const express = require('express');
const router = express.Router();
const { gerarRespostaPix, validarPayloadPix } = require('../lib/pix');

function logRota(msg) { console.log(`[pix-route] ${msg}`); }
function logRotaError(msg) { console.error(`[pix-route] ❌ ${msg}`); }

/**
 * GET /api/pix/generate
 * Query params:
 *   - amount: valor em R$ (ex: 12.50 ou 12,50)
 *   - txid: opcional, ID único da transação
 */
router.get('/generate', (req, res) => {
  try {
    logRota('➡️  GET /api/pix/generate');

    let { amount, txid } = req.query;
    
    logRota(`Parâmetros: amount=${amount}, txid=${txid}`);

    // Validar amount
    if (!amount || amount === '' || amount === '0') {
      logRotaError('Amount não fornecido ou inválido');
      return res.status(400).json({
        success: false,
        message: 'Parâmetro "amount" é obrigatório e deve ser > 0',
        exemplo: '/api/pix/generate?amount=12.50'
      });
    }

    // Normalizar vírgula para ponto (compatibilidade com entrada BR)
    amount = String(amount).replace(',', '.');
    const amountNum = Number(amount);

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      logRotaError(`Amount inválido: ${amount}`);
      return res.status(400).json({
        success: false,
        message: 'Amount deve ser um número positivo',
        recebido: amount
      });
    }

    // Gerar resposta PIX (payload + QR + validação)
    const resposta = gerarRespostaPix(amountNum);

    logRota(`✓ PIX gerado com sucesso`);
    logRota(`  Payload: ${resposta.payload.substring(0, 50)}...`);
    logRota(`  Tamanho: ${resposta.tamanho} bytes`);
    logRota(`  CRC: ${resposta.payload.slice(-4)}`);
    logRota(`  TXID: ${resposta.txid}`);
    logRota(`  Validação: ${resposta.validado ? 'OK ✓' : 'FALHOU ❌'}`);

    // Confirmar que payload será exatamente o que o frontend recebe
    const payloadVerif = resposta.payload;
    const checksumVerif = validarPayloadPix(payloadVerif);
    logRota(`  Verificação final: ${checksumVerif ? 'OK' : 'FALHA'}`);

    // Retornar resposta completa
    return res.json({
      success: true,
      message: 'PIX gerado com sucesso',
      ...resposta
    });

  } catch (err) {
    logRotaError(`Erro ao gerar PIX: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar PIX',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/pix/validar
 * Valida um payload PIX fornecido
 */
router.get('/validar', (req, res) => {
  try {
    logRota('➡️  GET /api/pix/validar');
    
    const { payload } = req.query;

    if (!payload || payload === '') {
      return res.status(400).json({
        success: false,
        message: 'Parâmetro "payload" é obrigatório'
      });
    }

    const isValid = validarPayloadPix(payload);

    logRota(`Validação de payload: ${isValid ? 'VÁLIDO ✓' : 'INVÁLIDO ❌'}`);

    return res.json({
      success: true,
      valido: isValid,
      tamanho: payload.length,
      mensagem: isValid ? 'Payload PIX válido conforme padrão BRCode' : 'Payload PIX inválido (CRC ou estrutura incorreta)'
    });

  } catch (err) {
    logRotaError(`Erro ao validar PIX: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: 'Erro ao validar PIX',
      error: err.message
    });
  }
});

/**
 * GET /api/pix/config
 * Retorna configuração de PIX (sem exposição de chave privada)
 */
router.get('/config', (req, res) => {
  try {
    logRota('➡️  GET /api/pix/config');

    const config = {
      pixKey: process.env.PIX_KEY || 'uperesmarcon@gmail.com',
      merchantName: process.env.PIX_MERCHANT_NAME || 'UENER LINGUÇO',
      merchantCity: process.env.PIX_MERCHANT_CITY || 'CAMPO MOURAO',
      guidPix: 'BR.GOV.BCB.PIX',
      currencyCode: '986',
      countryCode: 'BR'
    };

    logRota(`✓ Configuração retornada`);

    return res.json({
      success: true,
      config
    });

  } catch (err) {
    logRotaError(`Erro ao retornar config: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: 'Erro ao retornar configuração'
    });
  }
});

module.exports = router;

