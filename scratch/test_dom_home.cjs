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

function createStaticServer(port = 3337) {
    const server = http.createServer((req, res) => {
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/') reqPath = '/index.html';
        const safeSuffix = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
        const filePath = path.join(rootDir, safeSuffix);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(404);
            res.end();
        }
    });
    return new Promise(r => server.listen(port, () => r(server)));
}

async function test() {
    const server = await createStaticServer(3337);
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        await page.goto('http://localhost:3337/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(800); // exact baseline timing

        const domStructure = await page.evaluate(() => {
            function serializeNode(node) {
                if (node.nodeType !== 1) return null;
                const tag = node.tagName.toLowerCase();
                if (['script', 'style', 'noscript', 'template'].includes(tag)) return null;

                const classes = node.className && typeof node.className === 'string'
                    ? node.className.trim().split(/\s+/).filter(c => c !== 'active' && c !== 'revealed' && c !== 'fade-out').sort().join(' ')
                    : undefined;

                const obj = {
                    tag,
                    id: node.id || undefined,
                    class: classes || undefined
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

        // Also serialize baseline with same filter:
        const baseDom = JSON.parse(fs.readFileSync(path.join(baselineDir, 'home_dom_structure.json'), 'utf8'));
        function sanitizeBase(node) {
            if (!node) return null;
            if (node.class) {
                const filtered = node.class.split(/\s+/).filter(c => c !== 'active' && c !== 'revealed' && c !== 'fade-out').sort().join(' ');
                node.class = filtered || undefined;
            }
            if (node.children) node.children.forEach(sanitizeBase);
            return node;
        }
        sanitizeBase(baseDom);

        const currStr = JSON.stringify(domStructure);
        const baseStr = JSON.stringify(baseDom);
        console.log('Structural DOM match (filtering dynamic animation classes):', currStr === baseStr);
        if (currStr !== baseStr) {
            console.log('Length diff:', currStr.length, baseStr.length);
        }
    } finally {
        await browser.close();
        server.close();
    }
}

test();
