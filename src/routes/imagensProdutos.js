/**
 * Rota para servir imagens de produtos guardadas em uma pasta externa.
 * Requisitos atendidos nesta versão:
 * - Usa stream (`fs.createReadStream`) para enviar bytes
 * - Loga caminho e tamanho do arquivo
 * - Define `Content-Type` corretamente baseado na extensão
 * - Retorna 404 quando o arquivo não existir (não envia fallback)
 * - Proteção contra path traversal e paths absolutos
 * - Tratamento de erros no stream e destruição ao fechar a conexão
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

function getExternalImagesDir() {
  return process.env.EXTERNAL_IMAGES_DIR || process.env.EXTERNAL_IMAGES_PATH || '';
}

const FALLBACK = path.resolve(__dirname, '../../public/img/no-image.png');

function log(msg) { console.log(`[imagens-produtos] ${msg}`); }
function logError(msg) { console.error(`[imagens-produtos] ❌ ${msg}`); }

log(`Módulo inicializado. EXTERNAL_IMAGES_DIR=${getExternalImagesDir() ? 'configurado' : 'NÃO configurado'}`);
log(`Valor: ${getExternalImagesDir()}`);
log(`FALLBACK (apenas referência): ${FALLBACK}`);

/**
 * Servir arquivo pelo nome (GET /imagens-produtos/:filename)
 */
router.get('/:filename', (req, res) => {
  try {
    const raw = req.params.filename || '';
    // Decodificar e normalizar input
    let filename = decodeURIComponent(raw);
    // Remover barras iniciais para evitar comportamento de path absoluto
    filename = filename.replace(/^[/\\]+/, '');

    // Proteção básica: não aceitar segmentos ..
    if (filename.includes('..')) {
      logError(`Nome de arquivo com tentativa de traversal: ${filename}`);
      return res.status(400).set('Content-Type', 'text/plain').end('Invalid filename');
    }

    const externalDir = getExternalImagesDir();
    if (!externalDir) {
      logError('EXTERNAL_IMAGES_DIR não configurado — não é possível servir imagens externas');
      return res.status(500).set('Content-Type', 'text/plain').end('Server configuration error');
    }

    const base = path.resolve(externalDir);

    // Normalizar barras para comparações (usar '/' no normalized)
    let filenameNormalized = filename.replace(/\\/g, '/').replace(/^\/+/, '');
    const baseNormalized = base.replace(/\\/g, '/').replace(/\/+$/, '');

    // Remover repetidamente o maior sufixo da `base` que apareça no começo
    // do filename. Ex: base termina em 'img/produtos' e filename começa com
    // 'img/produtos/img/produtos/99.jpeg' => reduzimos para '99.jpeg'.
    const baseParts = baseNormalized.split('/').filter(Boolean);
    let fnParts = filenameNormalized.split('/').filter(Boolean);

    // Função que verifica o maior k tal que os últimos k elementos de baseParts
    // correspondam aos primeiros k elementos de fnParts.
    function largestMatchPrefix(baseParts, fnParts) {
      const maxK = Math.min(baseParts.length, fnParts.length);
      for (let k = maxK; k >= 1; k--) {
        const baseSuffix = baseParts.slice(-k).join('/');
        const fnPrefix = fnParts.slice(0, k).join('/');
        if (baseSuffix === fnPrefix) return k;
      }
      return 0;
    }

    // Loop para remover múltiplas ocorrências consecutivas
    while (true) {
      const k = largestMatchPrefix(baseParts, fnParts);
      if (!k) break;
      fnParts = fnParts.slice(k);
      log(`Removido prefixo duplicado (k=${k}), filename agora: ${fnParts.join('/')}`);
    }

    filenameNormalized = fnParts.join('/');

    // Atualizar filename com o normalizado (pode ser vazio -> aponta para base)
    filename = filenameNormalized;
    const requested = path.resolve(path.join(base, filename || ''));

    // Garantir que o arquivo resolvido esteja dentro da base configurada
    if (!requested.startsWith(base + path.sep) && requested !== base) {
      logError(`Tentativa de acesso fora da pasta base: ${requested}`);
      return res.status(403).set('Content-Type', 'text/plain').end('Forbidden');
    }

    // Verificar existência e tipo
    if (!fs.existsSync(requested) || !fs.statSync(requested).isFile()) {
      log(`Arquivo não encontrado: ${requested}`);
      return res.status(404).set('Content-Type', 'text/plain').end('Not Found');
    }

    const stats = fs.statSync(requested);
    const mimeType = mime.lookup(requested) || 'application/octet-stream';

    // Cabeçalhos
    res.set('Content-Type', mimeType);
    res.set('Content-Length', String(stats.size));
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Last-Modified', stats.mtime.toUTCString());
    res.set('Accept-Ranges', 'bytes');
    // Permitir uso em canvas/cross-origin quando necessário
    res.set('Access-Control-Allow-Origin', '*');

    log(`Servindo arquivo: ${requested} (${stats.size} bytes)`);

    // HEAD: apenas enviar cabeçalhos
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    const stream = fs.createReadStream(requested);

    stream.on('open', () => {
      // stream conectado, nada especial a fazer além do log já feito
    });

    stream.on('error', (err) => {
      logError(`Erro ao ler arquivo ${requested}: ${err.message}`);
      if (!res.headersSent) {
        return res.status(500).set('Content-Type', 'text/plain').end('Error reading file');
      }
      // Se headers já enviados, apenas destruir stream
      try { stream.destroy(); } catch (e) { }
    });

    // Garantir que, se o cliente fechar a conexão, o stream seja destruído
    res.on('close', () => {
      try { stream.destroy(); } catch (e) { }
    });

    stream.pipe(res);

  } catch (err) {
    logError(`Erro ao servir arquivo: ${err && err.message ? err.message : String(err)}`);
    if (!res.headersSent) {
      return res.status(500).set('Content-Type', 'text/plain').end('Server error');
    }
  }
});

module.exports = router;
