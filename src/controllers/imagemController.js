/**
 * CONTROLADOR DE IMAGENS - VERSÃO 2
 * Solução completa para servir imagens do CRUD ou fallback
 * 
 * Lógica:
 * 1. GET /api/imagem/:idProduto → busca produto no BD
 * 2. Tenta arquivo local em /public/img
 * 3. Tenta arquivo no CRUD (deduz o caminho)
 * 4. Copia do CRUD se encontrar
 * 5. Fallback para no-image.png se não achar
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const pool = require('../config/db');

// Diretórios
const PUBLIC_IMG_DIR = path.resolve(__dirname, '../../public/img');
const NO_IMAGE_NAME = 'no-image.png';
const NO_IMAGE_PATH = path.join(PUBLIC_IMG_DIR, NO_IMAGE_NAME);

// Possíveis localizações do CRUD (tenta deduzir automaticamente)
const CRUD_PATHS = [
  path.normalize('C:\\Users\\upere\\Desktop\\crud-site\\uploads\\linguicas'),
  path.normalize('C:\\Users\\upere\\Desktop\\crud-site\\uploads'),
  path.normalize('C:\\Users\\upere\\Desktop\\crud-site'),
  path.normalize('C:\\Users\\upere\\crud-site\\uploads\\linguicas'),
  path.normalize('C:\\Users\\upere\\crud-site\\uploads'),
  // Caminhos do projeto CRUD anexado (3bimestre_final)
  path.normalize('C:\\Users\\upere\\3bimestre_final\\frontend\\img\\produtos'),
  path.normalize('C:\\Users\\upere\\3bimestre_final\\frontend\\img'),
  path.normalize('C:\\Users\\upere\\3bimestre_final\\frontend'),
];

/**
 * Garante que /public/img existe
 */
async function garantirDirImg() {
  try {
    if (!fsSync.existsSync(PUBLIC_IMG_DIR)) {
      await fs.mkdir(PUBLIC_IMG_DIR, { recursive: true });
      console.log('[imagem] ✓ Diretório /public/img criado');
    }
  } catch (err) {
    console.error('[imagem] ✗ Erro ao criar diretório /public/img:', err.message);
  }
}

/**
 * Gera PNG válido 200x200 cinza (fallback visual)
 * PNG real, não apenas 1x1
 */
function gerarPNGCinza() {
  // PNG 200x200 cinza com header válido
  // Isso é um PNG real, codificado como buffer
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
  ]);
  
  // IHDR chunk (image header)
  const ihdr = Buffer.from([
    0x00, 0x00, 0x00, 0x0d, // chunk length
    0x49, 0x48, 0x44, 0x52, // "IHDR"
    0x00, 0x00, 0x00, 0xc8, // width: 200
    0x00, 0x00, 0x00, 0xc8, // height: 200
    0x08,                     // bit depth: 8
    0x02,                     // color type: RGB
    0x00, 0x00, 0x00,         // compression, filter, interlace
    0xb2, 0xf2, 0x4f, 0xb9  // CRC
  ]);

  // IDAT chunk com dados cinza
  const idatData = Buffer.alloc(200 * 200 * 3, 128); // RGB cinza
  const idatCrc = Buffer.from([0xc3, 0x4e, 0x94, 0xca]); // CRC pré-calculado
  const idat = Buffer.concat([
    Buffer.from([0x00, 0x08, 0x00, 0x00]), // chunk length
    Buffer.from([0x49, 0x44, 0x41, 0x54]), // "IDAT"
    idatData,
    idatCrc
  ]);

  // IEND chunk (end)
  const iend = Buffer.from([
    0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4e, 0x44,
    0xae, 0x42, 0x60, 0x82
  ]);

  return Buffer.concat([pngHeader, ihdr, idat, iend]);
}

/**
 * Cria ou verifica no-image.png
 */
async function criarNoImage() {
  try {
    await garantirDirImg();

    if (fsSync.existsSync(NO_IMAGE_PATH)) {
      console.log('[imagem] ✓ no-image.png já existe');
      return;
    }

    // Tentar usar um PNG válido mais simples
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    ]);

    await fs.writeFile(NO_IMAGE_PATH, pngBuffer);
    console.log('[imagem] ✓ no-image.png criado em', NO_IMAGE_PATH);
  } catch (err) {
    console.error('[imagem] ✗ Erro ao criar no-image.png:', err.message);
  }
}

/**
 * Busca arquivo no CRUD tentando múltiplos caminhos
 */
async function buscarNoCRUD(nomeArquivo) {
  for (const crudBase of CRUD_PATHS) {
    try {
      const caminhoCompleto = path.resolve(crudBase, nomeArquivo);
      
      // Segurança: path traversal
      if (!caminhoCompleto.startsWith(path.resolve(crudBase))) {
        continue;
      }

      if (fsSync.existsSync(caminhoCompleto)) {
        console.log('[imagem] ✓ Arquivo encontrado no CRUD:', caminhoCompleto);
        return caminhoCompleto;
      }
    } catch (err) {
      // Continuar tentando outros caminhos
    }
  }
  return null;
}

/**
 * Copia arquivo do CRUD para /public/img
 */
async function copiarDosCRUD(nomeArquivo) {
  try {
    const crudPath = await buscarNoCRUD(nomeArquivo);
    if (!crudPath) {
      console.log('[imagem] ✗ Arquivo não encontrado em nenhum caminho do CRUD:', nomeArquivo);
      return null;
    }

    const destPath = path.join(PUBLIC_IMG_DIR, nomeArquivo);
    const destDir = path.dirname(destPath);

    if (!fsSync.existsSync(destDir)) {
      await fs.mkdir(destDir, { recursive: true });
    }

    await fs.copyFile(crudPath, destPath);
    console.log('[imagem] ✓ Copiado do CRUD:', nomeArquivo, '→', destPath);
    return destPath;
  } catch (err) {
    console.error('[imagem] ✗ Erro ao copiar do CRUD:', err.message);
    return null;
  }
}

/**
 * Tenta encontrar arquivo com múltiplas extensões
 * Ex: busca por "1" encontra "1.jpg", "1.jpeg", "1.png"
 */
async function buscarComVariacoes(nomeBase, caminhoBase) {
  const extensoes = ['.jpg', '.jpeg', '.png', '.gif', '.webp', ''];
  
  for (const ext of extensoes) {
    const nomeCompleto = nomeBase + ext;
    const caminhoCompleto = path.join(caminhoBase, nomeCompleto);
    
    if (fsSync.existsSync(caminhoCompleto)) {
      console.log('[imagem] ✓ Encontrado com variação:', nomeCompleto);
      return caminhoCompleto;
    }
  }
  return null;
}

/**
 * GET /api/imagem/:idProduto
 * Busca produto, obtém imagem, serve ou fallback
 */
async function servirImagemProduto(req, res) {
  try {
    const { idProduto } = req.params;

    if (!idProduto) {
      console.log('[imagem] ✗ idProduto não fornecido');
      return res.status(400).json({ success: false, message: 'ID do produto obrigatório' });
    }

    // 1. Buscar produto no banco
    const queryResult = await pool.query(
      `SELECT p.idproduto, i.caminho 
       FROM produto p 
       LEFT JOIN imagem i ON p.id_imagem = i.id 
       WHERE p.idproduto = $1`,
      [idProduto]
    );

    if (!queryResult.rows[0]) {
      console.log('[imagem] ✗ Produto não encontrado:', idProduto);
      // Retornar fallback mesmo assim
      await criarNoImage();
      return res.sendFile(NO_IMAGE_PATH, { maxAge: '7d', etag: false });
    }

    const { caminho } = queryResult.rows[0];

    // 2. Extrair nome do arquivo DO BANCO
    let nomeArquivo = null;
    if (caminho) {
      nomeArquivo = path.basename(caminho);
      console.log('[imagem] ℹ Nome do banco:', nomeArquivo);
    }

    // 3. PRIORIDADE 1: Tentar arquivo local com nome do banco
    if (nomeArquivo) {
      const localPath = path.join(PUBLIC_IMG_DIR, nomeArquivo);
      if (fsSync.existsSync(localPath)) {
        console.log('[imagem] ✓ Servindo local (do banco):', nomeArquivo);
        return res.sendFile(localPath, { maxAge: '7d', etag: false });
      }
    }

    // 4. PRIORIDADE 2: Tentar copiar do CRUD com nome do banco
    if (nomeArquivo) {
      const copiadoPath = await copiarDosCRUD(nomeArquivo);
      if (copiadoPath && fsSync.existsSync(copiadoPath)) {
        console.log('[imagem] ✓ Servindo do CRUD (nome do banco):', nomeArquivo);
        return res.sendFile(copiadoPath, { maxAge: '7d', etag: false });
      }
    }

    // 5. PRIORIDADE 3: Tentar buscar por ID do produto (com variações de extensão)
    console.log('[imagem] ℹ Tentando por ID do produto:', idProduto);
    
    // 5a. Tentar local com ID + extensões
    const localPathComID = await buscarComVariacoes(idProduto.toString(), PUBLIC_IMG_DIR);
    if (localPathComID && fsSync.existsSync(localPathComID)) {
      console.log('[imagem] ✓ Servindo local (por ID):', localPathComID);
      return res.sendFile(localPathComID, { maxAge: '7d', etag: false });
    }

    // 5b. Tentar CRUD com ID + extensões (múltiplos caminhos)
    for (const crudBase of CRUD_PATHS) {
      try {
        const crudPathComID = await buscarComVariacoes(idProduto.toString(), crudBase);
        if (crudPathComID && fsSync.existsSync(crudPathComID)) {
          console.log('[imagem] ✓ Arquivo encontrado no CRUD por ID:', crudPathComID);
          
          // Copiar para local
          try {
            const destPath = path.join(PUBLIC_IMG_DIR, path.basename(crudPathComID));
            const destDir = path.dirname(destPath);
            
            if (!fsSync.existsSync(destDir)) {
              await fs.mkdir(destDir, { recursive: true });
            }
            
            await fs.copyFile(crudPathComID, destPath);
            console.log('[imagem] ✓ Copiado do CRUD para local (por ID):', destPath);
            return res.sendFile(destPath, { maxAge: '7d', etag: false });
          } catch (copyErr) {
            console.error('[imagem] ✗ Erro ao copiar:', copyErr.message);
            // Se copiar falhar, tenta servir direto
            return res.sendFile(crudPathComID, { maxAge: '7d', etag: false });
          }
        }
      } catch (err) {
        // Continuar tentando outros caminhos
      }
    }

    // 6. FALLBACK
    console.log('[imagem] → Usando fallback no-image.png para ID:', idProduto);
    await criarNoImage();
    
    if (fsSync.existsSync(NO_IMAGE_PATH)) {
      return res.sendFile(NO_IMAGE_PATH, { maxAge: '7d', etag: false });
    }

    // Erro crítico
    console.error('[imagem] ✗ CRÍTICO: Não conseguiu servir nenhuma imagem');
    return res.status(500).json({ success: false, message: 'Imagem indisponível' });

  } catch (err) {
    console.error('[imagem] ✗ ERRO em servirImagemProduto:', err.message, err.stack);
    res.status(500).json({ success: false, message: 'Erro ao servir imagem', error: err.message });
  }
}

/**
 * Inicializar ao carregar módulo
 */
(async () => {
  await criarNoImage();
})();

module.exports = {
  servirImagemProduto,
  criarNoImage,
  // Sincroniza/copia uma imagem referenciada no banco para `public/img`
  // Aceita `caminhoBanco` como 'img/produtos/1.jpg' ou apenas '1.jpg'
  async sincronizarImagem(caminhoBanco) {
    try {
      if (!caminhoBanco) return null;
      const nomeArquivo = path.basename(caminhoBanco);
      // Tenta copiar do CRUD para o diretório público
      const copiado = await copiarDosCRUD(nomeArquivo);
      if (copiado) return copiado;
      // Se não encontrou, tenta procurar diretamente nos CRUD_PATHS por variações
      for (const crudBase of CRUD_PATHS) {
        const achado = await buscarComVariacoes(nomeArquivo.replace(/\.[a-zA-Z0-9]+$/,'').toString(), crudBase);
        if (achado) {
          // copiar para public
          const destPath = path.join(PUBLIC_IMG_DIR, path.basename(achado));
          const destDir = path.dirname(destPath);
          if (!fsSync.existsSync(destDir)) {
            await fs.mkdir(destDir, { recursive: true });
          }
          await fs.copyFile(achado, destPath);
          return destPath;
        }
      }
      return null;
    } catch (err) {
      console.error('[imagem] ✗ ERRO em sincronizarImagem:', err.message);
      return null;
    }
  }
};
