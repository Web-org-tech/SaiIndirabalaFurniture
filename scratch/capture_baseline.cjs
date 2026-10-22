const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('./node_modules/playwright-core');

const rootDir = path.resolve(__dirname, '..');
const baselineDir = path.join(rootDir, 'docs', 'zero-change-baseline');
const screenshotsDir = path.join(baselineDir, 'screenshots');

if (!fs.existsSync(baselineDir)) fs.mkdirSync(baselineDir, { recursive: true });
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

function createStaticServer(port = 3333) {
    const server = http.createServer((req, res) => {
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/') reqPath = '/index.html';
        else if (reqPath === '/catalog') reqPath = '/catalog.html';
        else if (reqPath === '/our-work') reqPath = '/our-work.html';

        const safeSuffix = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
        const filePath = path.join(rootDir, safeSuffix);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mime = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': mime });
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        }
    });

    return new Promise((resolve) => {
        server.listen(port, () => {
            console.log(`Local test server listening at http://localhost:${port}`);
            resolve(server);
        });
    });
}

const PAGES = [
    { name: 'home', route: '/' },
    { name: 'catalog', route: '/catalog' },
    { name: 'our-work', route: '/our-work' }
];

const VIEWPORTS = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 }
];

async function capture() {
    const port = 3333;
    const server = await createStaticServer(port);
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    const manifest = {
        timestamp: new Date().toISOString(),
        pages: {}
    };

    try {
        for (const p of PAGES) {
            console.log(`\n=== Processing baseline for page: ${p.name} (${p.route}) ===`);
            manifest.pages[p.name] = {
                route: p.route,
                screenshots: {},
                visibleTextHash: null,
                domStructureHash: null
            };

            // 1. Capture Full-Page Screenshots across 3 viewports
            for (const vp of VIEWPORTS) {
                const context = await browser.newContext({
                    viewport: { width: vp.width, height: vp.height },
                    deviceScaleFactor: 1
                });
                const page = await context.newPage();
                await page.goto(`http://localhost:${port}${p.route}`, { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(1000); // Allow CSS transitions and dynamic renders to settle

                const screenshotFileName = `${p.name}_${vp.width}px.png`;
                const screenshotFilePath = path.join(screenshotsDir, screenshotFileName);
                await page.screenshot({ path: screenshotFilePath, fullPage: true });
                console.log(`  ✓ Saved screenshot: ${screenshotFileName}`);
                manifest.pages[p.name].screenshots[vp.width] = screenshotFileName;
                await context.close();
            }

            // 2. Extract Visible Text Snapshot & Body DOM Structure
            const context = await browser.newContext({
                viewport: { width: 1440, height: 900 }
            });
            const page = await context.newPage();
            await page.goto(`http://localhost:${port}${p.route}`, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(800);

            // Extract Visible Text (strictly excluding script, style, noscript, alt text, aria attributes)
            const visibleText = await page.evaluate(() => {
                const clone = document.body.cloneNode(true);
                // Remove non-visible elements
                const removeSelectors = ['script', 'style', 'noscript', 'template', 'svg'];
                removeSelectors.forEach(sel => {
                    clone.querySelectorAll(sel).forEach(el => el.remove());
                });

                // Strip attributes that could leak metadata into text comparisons
                const allElements = clone.querySelectorAll('*');
                allElements.forEach(el => {
                    el.removeAttribute('alt');
                    el.removeAttribute('aria-label');
                    el.removeAttribute('aria-description');
                    el.removeAttribute('title');
                });

                return clone.innerText.replace(/\r\n/g, '\n').trim();
            });

            const textHash = crypto.createHash('sha256').update(visibleText, 'utf8').digest('hex');
            const textFilePath = path.join(baselineDir, `${p.name}_visible_text.txt`);
            fs.writeFileSync(textFilePath, visibleText, 'utf8');
            manifest.pages[p.name].visibleTextFile = `${p.name}_visible_text.txt`;
            manifest.pages[p.name].visibleTextHash = textHash;
            console.log(`  ✓ Saved visible text snapshot: ${p.name}_visible_text.txt (SHA256: ${textHash.substring(0, 12)}...)`);

            // Extract Body DOM Structure (tree of tag names, classes, IDs; excluding script/style/alt/aria)
            const domStructure = await page.evaluate(() => {
                function serializeNode(node) {
                    if (node.nodeType !== 1) return null; // Element nodes only
                    const tag = node.tagName.toLowerCase();
                    if (['script', 'style', 'noscript', 'template'].includes(tag)) return null;

                    const obj = {
                        tag,
                        id: node.id || undefined,
                        class: node.className && typeof node.className === 'string' ? node.className.trim().split(/\s+/).sort().join(' ') : undefined
                    };

                    const children = [];
                    for (const child of node.childNodes) {
                        const serialized = serializeNode(child);
                        if (serialized) children.push(serialized);
                    }
                    if (children.length > 0) obj.children = children;
                    return obj;
                }

                return serializeNode(document.body);
            });

            const domJson = JSON.stringify(domStructure, null, 2);
            const domHash = crypto.createHash('sha256').update(domJson, 'utf8').digest('hex');
            const domFilePath = path.join(baselineDir, `${p.name}_dom_structure.json`);
            fs.writeFileSync(domFilePath, domJson, 'utf8');
            manifest.pages[p.name].domStructureFile = `${p.name}_dom_structure.json`;
            manifest.pages[p.name].domStructureHash = domHash;
            console.log(`  ✓ Saved DOM structure snapshot: ${p.name}_dom_structure.json (SHA256: ${domHash.substring(0, 12)}...)`);

            await context.close();
        }

        const manifestPath = path.join(baselineDir, 'baseline_manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        console.log(`\n🎉 Baseline capture complete! Manifest saved to: ${manifestPath}`);

    } finally {
        await browser.close();
        server.close();
    }
}

capture().catch(err => {
    console.error('Fatal capture error:', err);
    process.exit(1);
});
