const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('./node_modules/playwright-core');

const rootDir = path.resolve(__dirname, '..');
const baselineDir = path.join(rootDir, 'docs', 'zero-change-baseline');

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

function createStaticServer(port = 3336) {
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
        server.listen(port, () => resolve(server));
    });
}

async function debug() {
    const server = await createStaticServer(3336);
    const browser = await chromium.launch({ channel: 'msedge', headless: true });

    try {
        for (const pageName of ['home', 'our-work']) {
            const route = pageName === 'home' ? '/' : `/${pageName}`;
            const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
            const page = await context.newPage();
            await page.goto(`http://localhost:3336${route}`, { waitUntil: 'domcontentloaded' });
            
            if (pageName === 'our-work') {
                await page.waitForSelector('#category-pills-wrap .category-pill', { timeout: 10000 }).catch(() => {});
                await page.waitForTimeout(500);
            } else if (pageName === 'home') {
                // In baseline, waitForTimeout(800) was used
                await page.waitForTimeout(800);
            }

            const visibleText = await page.evaluate(() => {
                const clone = document.body.cloneNode(true);
                const removeSelectors = ['script', 'style', 'noscript', 'template', 'svg'];
                removeSelectors.forEach(sel => {
                    clone.querySelectorAll(sel).forEach(el => el.remove());
                });

                const allElements = clone.querySelectorAll('*');
                allElements.forEach(el => {
                    el.removeAttribute('alt');
                    el.removeAttribute('aria-label');
                    el.removeAttribute('aria-description');
                    el.removeAttribute('title');
                });

                return clone.innerText.replace(/\r\n/g, '\n').trim();
            });

            const domStructure = await page.evaluate(() => {
                function serializeNode(node) {
                    if (node.nodeType !== 1) return null;
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

            // Compare with baseline
            const baseText = fs.readFileSync(path.join(baselineDir, `${pageName}_visible_text.txt`), 'utf8');
            const baseDom = fs.readFileSync(path.join(baselineDir, `${pageName}_dom_structure.json`), 'utf8');

            console.log(`\n================== DEBUG ${pageName.toUpperCase()} ==================`);
            if (baseText === visibleText) {
                console.log(`[VISIBLE TEXT] EXACT MATCH! Length: ${baseText.length}`);
            } else {
                console.log(`[VISIBLE TEXT] MISMATCH! Base length: ${baseText.length}, Current: ${visibleText.length}`);
            }

            const currDomJson = JSON.stringify(domStructure, null, 2);
            if (baseDom === currDomJson) {
                console.log(`[DOM STRUCTURE] EXACT MATCH!`);
            } else {
                console.log(`[DOM STRUCTURE] MISMATCH! Base length: ${baseDom.length}, Current: ${currDomJson.length}`);
                const baseLines = baseDom.split('\n');
                const currLines = currDomJson.split('\n');
                for (let i = 0; i < Math.max(baseLines.length, currLines.length); i++) {
                    if (baseLines[i] !== currLines[i]) {
                        console.log(`First DOM diff at line ${i + 1}:`);
                        console.log(`  BASELINE: "${baseLines[i]}"`);
                        console.log(`  CURRENT : "${currLines[i]}"`);
                        break;
                    }
                }
            }

            await context.close();
        }
    } finally {
        await browser.close();
        server.close();
    }
}

debug().catch(console.error);
