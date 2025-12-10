const fs = require('fs');
const path = require('path');

function walk(dir) {
  const res = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) res.push({ type: 'dir', path: full, children: walk(full) });
    else res.push({ type: 'file', path: full });
  }
  return res;
}

const root = path.resolve(__dirname, '..');
const tree = walk(root);
fs.writeFileSync(path.join(root, 'REPO_STRUCTURE.json'), JSON.stringify(tree, null, 2));
console.log('REPO_STRUCTURE.json gerado');
