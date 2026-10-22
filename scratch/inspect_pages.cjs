const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = ['index.html', 'catalog.html', 'our-work.html', '404.html'];

files.forEach(file => {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    console.log('====================================================');
    console.log(`FILE: ${file} (Length: ${content.length})`);
    
    // Title
    const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
    console.log('Title:', titleMatch ? titleMatch[1] : 'NONE');

    // Meta description
    const descMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    console.log('Description:', descMatch ? descMatch[1] : 'NONE');

    // Canonical
    const canonMatch = content.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    console.log('Canonical:', canonMatch ? canonMatch[1] : 'NONE');

    // Meta robots
    const robotsMatch = content.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    console.log('Robots:', robotsMatch ? robotsMatch[1] : 'NONE');

    // Sections
    const sections = [...content.matchAll(/<section[^>]*id=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
    console.log('Sections with IDs:', sections);

    // Headings
    const headings = [...content.matchAll(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi)].map(m => ({
        tag: m[1].toLowerCase(),
        text: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    }));
    console.log('Headings Count:', headings.length);
    console.log('Headings:', headings);

    // Images without alt or with empty alt
    const images = [...content.matchAll(/<img([^>]*)>/gi)].map(m => {
        const raw = m[1];
        const srcMatch = raw.match(/src=["']([^"']+)["']/i);
        const altMatch = raw.match(/alt=["']([^"']*)["']/i);
        return {
            src: srcMatch ? srcMatch[1] : 'NONE',
            alt: altMatch ? altMatch[1] : null
        };
    });
    console.log(`Images total: ${images.length}`);
    const missingAlt = images.filter(img => img.alt === null);
    console.log(`Images missing alt attribute: ${missingAlt.length}`, missingAlt);
});
