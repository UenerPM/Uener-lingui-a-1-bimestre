/**
 * ===== ROTA /api/imagem =====
 * 
 * Proxy seguro para servir imagens de projetos externos
 * 
 * Uso:
 *   GET /api/imagem?path=/imgs/produtos/caseira.png
 *   GET /api/imagem?path=/uploads/linguica1.png
 * 
 * Funcionalidades:
 * - Valida caminho (sem path traversal)
 * - Busca arquivo na pasta externa configurada
 * - Retorna arquivo com stream (eficiente)
 * - Fallback para imagem padrão se não encontrado
 * - Logs detalhados para auditoria
 * - CORS-safe (permite acesso do frontend)
 * 
 * Configuração:
 * - EXTERNAL_IMAGES_PATH no .env (ex: C:\projetos\crud\public)
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

function log(msg) {
  console.log(`[imagem] ${msg}`);
}

function logError(msg) {
  console.error(`[imagem] ❌ ${msg}`);
}

// Configurações
const EXTERNAL_IMAGES_PATH = process.env.EXTERNAL_IMAGES_PATH || '';
const ALLOWED_DIRS = ['/imgs', '/uploads', '/images', '/fotos'];
const FALLBACK_IMAGE = path.join(__dirname, '../../public/img/no-image.png');

/**
 * Valida se um caminho é seguro (não permite path traversal)
 */
function isPathSafe(requestPath) {
  // Normalizar caminho
  const normalized = path.normalize(requestPath);
  
  // Rejeitar absolute paths ou paths com ..
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    logError(`Path traversal bloqueado: ${requestPath}`);
    return false;
  }
  
  // Permitir apenas diretórios conhecidos
  const startsWithAllowed = ALLOWED_DIRS.some(dir => normalized.startsWith(dir));
  if (!startsWithAllowed) {
    logError(`Diretório não permitido: ${requestPath}`);
    return false;
  }
  
  return true;
}

/**
 * Resolve caminho completo da imagem
 */
function resolveImagePath(requestPath) {
  // Validar caminho
  if (!isPathSafe(requestPath)) {
    return null;
  }
  
  // Se tem pasta externa configurada, usar ela
  if (EXTERNAL_IMAGES_PATH) {
    const fullPath = path.join(EXTERNAL_IMAGES_PATH, requestPath);
    // Double-check: garantir que resolve dentro da base
    const resolved = path.resolve(fullPath);
    const base = path.resolve(EXTERNAL_IMAGES_PATH);
    
    if (!resolved.startsWith(base)) {
      logError(`Tentativa de escape da pasta base: ${requestPath}`);
      return null;
    }
    
    return resolved;
  }
  
  // Se não tem pasta externa, tentar local public/
  const localPath = path.join(__dirname, '../../public', requestPath);
  return localPath;
}

/**
 * GET /api/imagem?path=/imgs/produtos/caseira.png
 */
router.get('/', (req, res) => {
  try {
    const { path: imagePath } = req.query;
    
    if (!imagePath) {
      log('⚠️  Parâmetro path ausente');
      return res.status(400).json({
        success: false,
        message: 'Parâmetro path é obrigatório',
        example: '/api/imagem?path=/imgs/produtos/caseira.png'
      });
    }
    
    log(`Requisição: ${imagePath}`);
    
    // Resolver caminho seguro
    const fullPath = resolveImagePath(imagePath);
    if (!fullPath) {
      log(`Caminho inválido ou fora do escopo: ${imagePath}`);
      return serveFallback(res);
    }
    
    log(`Resolvido para: ${fullPath}`);
    
    // Verificar existência
    if (!fs.existsSync(fullPath)) {
      log(`Arquivo não encontrado: ${fullPath}`);
      return serveFallback(res);
    }
    
    // Verificar se é arquivo (não diretório)
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      logError(`Caminho apontaum diretório, não arquivo: ${fullPath}`);
      return serveFallback(res);
    }
    
    // Detectar MIME type
    const mimeType = mime.lookup(fullPath) || 'application/octet-stream';
    log(`MIME type detectado: ${mimeType}`);
    
    // Configurar headers de cache
    res.set('Content-Type', mimeType);
    res.set('Cache-Control', 'public, max-age=86400'); // 1 dia
    res.set('Last-Modified', new Date(stat.mtime).toUTCString());
    
    // Servir com stream (eficiente para arquivos grandes)
    const fileStream = fs.createReadStream(fullPath);
    fileStream.on('error', (err) => {
      logError(`Erro ao ler arquivo: ${err.message}`);
      return serveFallback(res);
    });
    
    log(`✓ Servindo arquivo: ${imagePath} (${stat.size} bytes)`);
    fileStream.pipe(res);
    
  } catch (err) {
    logError(`Erro não tratado: ${err.message}`);
    return serveFallback(res);
  }
});

/**
 * Serve imagem padrão (fallback)
 */
function serveFallback(res) {
  try {
    if (!fs.existsSync(FALLBACK_IMAGE)) {
      log(`Imagem padrão não encontrada: ${FALLBACK_IMAGE}`);
      return res.status(404).json({
        success: false,
        message: 'Imagem não encontrada e fallback indisponível'
      });
    }
    
    const mimeType = mime.lookup(FALLBACK_IMAGE) || 'image/png';
    res.set('Content-Type', mimeType);
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hora
    
    log(`✓ Servindo fallback: ${FALLBACK_IMAGE}`);
    const fileStream = fs.createReadStream(FALLBACK_IMAGE);
    fileStream.pipe(res);
  } catch (err) {
    logError(`Erro ao servir fallback: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: 'Erro ao servir imagem'
    });
  }
}

module.exports = router;
