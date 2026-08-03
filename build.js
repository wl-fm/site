// build.js - Merges per-entry _data/ JSON folders into combined JSON files
// Run automatically by Cloudflare Pages before each deploy: `node build.js`

const fs   = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function mergeFolder(folder, output, sortField = 'order') {
  if (!fs.existsSync(folder)) {
    ensureDir(path.dirname(output));
    fs.writeFileSync(output, '[]');
    console.log(`  (empty) ${output}`);
    return;
  }
  const entries = fs.readdirSync(folder)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(folder, f), 'utf8')); }
      catch (e) { console.warn(`  ⚠ Could not parse ${f}: ${e.message}`); return null; }
    })
    .filter(Boolean);

  entries.sort((a, b) => (a[sortField] ?? 999) - (b[sortField] ?? 999));
  fs.writeFileSync(output, JSON.stringify(entries, null, 2));
  console.log(`  ✓ ${output}  (${entries.length} entries)`);
}

console.log('Building WLFM data files…');
ensureDir('_data');
mergeFolder('_data/products', '_data/products.json', 'order');
mergeFolder('_data/events',   '_data/events.json',   'order');
mergeFolder('_data/faq',      '_data/faq.json',       'order');
console.log('Build complete ✅');
