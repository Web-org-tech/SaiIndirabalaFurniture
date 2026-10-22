const fs = require('fs');
const path = require('path');

const files = ['index.html', 'catalog.html', 'our-work.html'];

files.forEach(f => {
    const p = path.join(__dirname, '..', f);
    const content = fs.readFileSync(p, 'utf8');
    const ids = [...content.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
    console.log(`\n=== ${f} (${ids.length} IDs) ===`);
    console.log(ids.join(', '));
});
