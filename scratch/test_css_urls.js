const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const cssDirs = [path.join(rootDir, 'css'), path.join(rootDir, 'admin', 'css')];

let totalIssues = 0;

cssDirs.forEach(cssDir => {
    if (!fs.existsSync(cssDir)) return;
    const files = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    files.forEach(f => {
        const fullPath = path.join(cssDir, f);
        const content = fs.readFileSync(fullPath, 'utf8');
        const urlMatches = content.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi);
        for (const match of urlMatches) {
            const relUrl = match[1];
            if (relUrl.startsWith('http://') || relUrl.startsWith('https://') || relUrl.startsWith('data:') || relUrl.startsWith('#')) continue;
            // remove query params or hash
            const cleanUrl = relUrl.split('?')[0].split('#')[0];
            const resolved = path.resolve(cssDir, cleanUrl);
            if (!fs.existsSync(resolved)) {
                console.error(`[${f}] BROKEN CSS URL: ${relUrl} -> ${resolved}`);
                totalIssues++;
            }
        }
    });
});

console.log('--- CSS URL AUDIT REPORT ---');
console.log('Total Broken CSS URLs:', totalIssues);
if (totalIssues === 0) {
    console.log('All CSS url(...) assets resolve to existing files!');
}
