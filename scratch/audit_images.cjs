const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pages = ['index.html', 'catalog.html', 'our-work.html'];

pages.forEach(p => {
    const content = fs.readFileSync(path.join(rootDir, p), 'utf8');
    const regex = /<img\b([^>]*)>/gi;
    let match;
    console.log(`\n=================== ${p} IMAGES ===================`);
    let count = 0;
    while ((match = regex.exec(content)) !== null) {
        count++;
        const tag = match[0];
        const srcMatch = tag.match(/src=["']([^"']+)["']/i);
        const altMatch = tag.match(/alt=["']([^"']*)["']/i);
        const src = srcMatch ? srcMatch[1] : 'NO_SRC';
        const alt = altMatch ? altMatch[1] : 'NO_ALT';
        console.log(`[${count}] src: ${src} | alt: "${alt}"`);
    }
});
