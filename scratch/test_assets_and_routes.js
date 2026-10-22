const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const htmlFiles = [
    'index.html',
    'catalog.html',
    'our-work.html',
    '404.html',
    'admin/index.html',
    'admin/dashboard.html'
];

let totalIssues = 0;
const results = {};

htmlFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) {
        console.error(`MISSING HTML FILE: ${file}`);
        totalIssues++;
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const dir = path.dirname(filePath);

    results[file] = { links: [], scripts: [], images: [] };

    // Check <link href="...">
    const linkMatches = content.matchAll(/<link[^>]+href=["']([^"']+)["']/gi);
    for (const match of linkMatches) {
        const href = match[1];
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//') || href.startsWith('data:')) continue;
        const resolved = path.resolve(dir, href);
        const exists = fs.existsSync(resolved);
        if (!exists) {
            console.error(`[${file}] BROKEN LINK: ${href} -> ${resolved}`);
            totalIssues++;
            results[file].links.push({ href, status: 'MISSING' });
        } else {
            results[file].links.push({ href, status: 'OK' });
        }
    }

    // Check <script src="...">
    const scriptMatches = content.matchAll(/<script[^>]+src=["']([^"']+)["']/gi);
    for (const match of scriptMatches) {
        const src = match[1];
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) continue;
        const resolved = path.resolve(dir, src);
        const exists = fs.existsSync(resolved);
        if (!exists) {
            console.error(`[${file}] BROKEN SCRIPT: ${src} -> ${resolved}`);
            totalIssues++;
            results[file].scripts.push({ src, status: 'MISSING' });
        } else {
            results[file].scripts.push({ src, status: 'OK' });
        }
    }

    // Check <img src="...">
    const imgMatches = content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
    for (const match of imgMatches) {
        const src = match[1];
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//') || src.startsWith('data:')) continue;
        const resolved = path.resolve(dir, src);
        const exists = fs.existsSync(resolved);
        if (!exists) {
            console.error(`[${file}] BROKEN IMAGE: ${src} -> ${resolved}`);
            totalIssues++;
            results[file].images.push({ src, status: 'MISSING' });
        } else {
            results[file].images.push({ src, status: 'OK' });
        }
    }
});

console.log('--- ASSET AUDIT REPORT ---');
console.log('Total Broken Local Assets in HTML:', totalIssues);
if (totalIssues === 0) {
    console.log('All local CSS, JS, and image references across all 6 HTML pages exist!');
}
