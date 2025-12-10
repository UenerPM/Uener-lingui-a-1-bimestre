/**
 * Script de checagem estática de requires/imports
 * Procura por potenciais referências quebradas ou caminhos inválidos
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');
const publicDir = path.resolve(__dirname, '../public');
const htmlDir = path.resolve(__dirname, '../html');

const report = {
  total_files: 0,
  files_with_requires: 0,
  potential_issues: [],
  requires_by_pattern: {},
  timestamp: new Date().toISOString()
};

// Regex para encontrar requires e imports
const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
const importRegex = /import\s+.*from\s+['"`]([^'"`]+)['"`]/g;

function walkDir(dir) {
  const results = [];
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        // Ignorar node_modules, .git, sessions
        if (['node_modules', '.git', 'sessions'].includes(file.name)) continue;
        results.push(...walkDir(fullPath));
      } else if (file.name.endsWith('.js')) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    console.error(`Erro ao ler ${dir}: ${e.message}`);
  }
  return results;
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relPath = path.relative(path.resolve(__dirname, '..'), filePath);
    
    report.total_files++;
    
    const requires = [];
    let match;
    
    // Encontrar todos os requires
    while ((match = requireRegex.exec(content)) !== null) {
      requires.push(match[1]);
    }
    
    // Encontrar todos os imports
    const importRegex2 = /import\s+.*from\s+['"`]([^'"`]+)['"`]/g;
    while ((match = importRegex2.exec(content)) !== null) {
      requires.push(match[1]);
    }
    
    if (requires.length > 0) {
      report.files_with_requires++;
      
      for (const req of requires) {
        // Categorizar by pattern
        if (!report.requires_by_pattern[req]) {
          report.requires_by_pattern[req] = [];
        }
        report.requires_by_pattern[req].push(relPath);
        
        // Checagens de potencial problema
        const issues = [];
        
        // Se começa com ../, verificar se o caminho resolve
        if (req.startsWith('../')) {
          const resolved = path.resolve(path.dirname(filePath), req);
          // Não existe arquivo com essa extensão
          if (!fs.existsSync(resolved + '.js') && !fs.existsSync(resolved + '/index.js') && !fs.existsSync(resolved)) {
            issues.push(`ERRO: Arquivo não encontrado: ${resolved}`);
          }
        }
        
        // Alertas de padrão
        if (req.includes('payment.js') && !filePath.includes('payment.js')) {
          issues.push(`AVISO: Referência a 'payment.js' (arquivo fantasma?)`);
        }
        
        // Alertas sobre caminhos duplicados
        if (req.includes('controllers') && !req.includes('src/controllers')) {
          issues.push(`AVISO: Pode precisar de refatoração após mover controllers`);
        }
        
        if (issues.length > 0) {
          report.potential_issues.push({
            file: relPath,
            require: req,
            issues
          });
        }
      }
    }
  } catch (e) {
    console.error(`Erro ao processar ${filePath}: ${e.message}`);
  }
}

console.log('🔍 Analisando requires/imports...\n');

const jsFiles = [
  ...walkDir(srcDir),
  ...walkDir(publicDir),
  ...walkDir(htmlDir)
];

jsFiles.forEach(checkFile);

// Gerar relatório
console.log(`✅ Checagem completa: ${report.total_files} arquivos JS analisados`);
console.log(`📦 ${report.files_with_requires} arquivos têm requires/imports`);
console.log(`⚠️  ${report.potential_issues.length} potenciais problemas encontrados\n`);

if (report.potential_issues.length > 0) {
  console.log('📋 PROBLEMAS IDENTIFICADOS:\n');
  report.potential_issues.forEach(issue => {
    console.log(`\n  📄 ${issue.file}`);
    console.log(`     Require: ${issue.require}`);
    issue.issues.forEach(iss => {
      console.log(`     ⚠️  ${iss}`);
    });
  });
}

// Padrões de requires mais comuns
const topRequires = Object.entries(report.requires_by_pattern)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 15);

console.log('\n\n📊 TOP 15 REQUIRES MAIS USADOS:\n');
topRequires.forEach(([req, files]) => {
  console.log(`  • ${req} (${files.length} arquivo(s))`);
});

// Salvar relatório em JSON
const reportPath = path.resolve(__dirname, '../REQUIRE_ANALYSIS.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n\n✅ Relatório completo salvo em: REQUIRE_ANALYSIS.json`);
