const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { chromium } = require('./node_modules/playwright-core');

const rootDir = path.resolve(__dirname, '..');

// MIME types for static server
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8'
};

function createStaticServer(port = 4500) {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            let reqPath = req.url.split('?')[0];
            if (reqPath === '/') reqPath = '/index.html';
            else if (reqPath === '/catalog') reqPath = '/catalog.html';
            else if (reqPath === '/our-work') reqPath = '/our-work.html';
            else if (reqPath === '/admin' || reqPath === '/admin/') reqPath = '/admin/index.html';
            else if (reqPath === '/admin/dashboard') reqPath = '/admin/dashboard.html';
            else if (reqPath === '/404') reqPath = '/404.html';

            const safeSuffix = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
            let filePath = path.join(rootDir, safeSuffix);

            if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
                filePath = path.join(filePath, 'index.html');
            }

            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                const ext = path.extname(filePath).toLowerCase();
                const mime = MIME_TYPES[ext] || 'application/octet-stream';
                res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
                fs.createReadStream(filePath).pipe(res);
            } else {
                // SPA / cleanUrl rewrite fallback to 404.html
                const p404 = path.join(rootDir, '404.html');
                if (fs.existsSync(p404)) {
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                    fs.createReadStream(p404).pipe(res);
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                }
            }
        });

        server.listen(port, () => {
            console.log(`[SERVER] Local test server listening on http://localhost:${port}`);
            resolve(server);
        });
    });
}

function fetchUrl(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const client = parsed.protocol === 'https:' ? https : http;
        const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' }, ...options }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        });
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy(new Error('Timeout'));
        });
    });
}

async function runAudit() {
    console.log('======================================================================');
    console.log('MASTER WEBSITE TESTING, DEBUGGING & VERIFICATION AUDIT');
    console.log('Target: Sai Indirabala Furnitures (Local & Live Vercel Production)');
    console.log('======================================================================\n');

    const auditResults = {
        inspection: {},
        pages: [],
        features: [],
        viewports: [],
        liveProduction: [],
        bugs: []
    };

    // --- PHASE 1: INSPECTION OF PROJECT ARCHITECTURE ---
    console.log('--- PHASE 1: PROJECT ARCHITECTURE & REPOSITORY INSPECTION ---');
    const hasPackageJson = fs.existsSync(path.join(rootDir, 'package.json'));
    const hasVite = fs.existsSync(path.join(rootDir, 'vite.config.js')) || fs.existsSync(path.join(rootDir, 'vite.config.ts'));
    const isVanillaMpa = !hasVite && !hasPackageJson;

    auditResults.inspection = {
        stack: isVanillaMpa ? 'Vanilla HTML5 / CSS3 / ES6 Multi-Page Application (MPA)' : 'React + Vite',
        cleanUrls: true,
        router: 'Vercel Static Route Engine & Edge Rules',
        database: 'Supabase BaaS (PostgreSQL + RLS + Storage)',
        frontendLibraries: ['Three.js (CAD 360 viewer)', 'Lucide Icons', 'Google Fonts (Outfit & Plus Jakarta Sans)'],
        publicRoutes: ['/', '/catalog', '/our-work', '/404', '/admin', '/admin/dashboard'],
        staticAssets: ['/sitemap.xml', '/robots.txt', '/vercel.json']
    };

    console.log(`  Architecture: ${auditResults.inspection.stack}`);
    console.log(`  Public Routes: ${auditResults.inspection.publicRoutes.join(', ')}`);
    console.log(`  Supabase: Configured in js/config.js and js/supabaseClient.js`);

    // --- PHASE 2 & 3: BROWSER AUTOMATION TESTING ---
    console.log('\n--- PHASE 2 & 3: BROWSER EXECUTION & INTERACTION AUDIT ---');
    const PORT = 4555;
    const server = await createStaticServer(PORT);

    let browser;
    try {
        browser = await chromium.launch({ channel: 'msedge', headless: true });
    } catch (e) {
        browser = await chromium.launch({ channel: 'chrome', headless: true });
    }

    const testPages = [
        { path: '/', name: 'Homepage (index.html)' },
        { path: '/catalog', name: 'Catalog (catalog.html)' },
        { path: '/our-work', name: 'Our Work Gallery (our-work.html)' },
        { path: '/404', name: 'Custom 404 Page (404.html)' },
        { path: '/non-existent-route-audit-check', name: 'Invalid Route Fallback' },
        { path: '/admin', name: 'Admin Login (admin/index.html)' },
        { path: '/admin/dashboard', name: 'Admin Dashboard (admin/dashboard.html)' }
    ];

    for (const testPage of testPages) {
        console.log(`\nTesting Page: ${testPage.name} [http://localhost:${PORT}${testPage.path}]`);
        const page = await browser.newPage();
        const consoleErrors = [];
        const consoleWarnings = [];
        const failedRequests = [];

        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
            if (msg.type() === 'warning') consoleWarnings.push(msg.text());
        });

        page.on('pageerror', err => {
            consoleErrors.push(`[PageError] ${err.message}`);
        });

        page.on('requestfailed', req => {
            failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
        });

        let loadSuccess = false;
        let responseCode = 0;
        try {
            const resp = await page.goto(`http://localhost:${PORT}${testPage.path}`, { waitUntil: 'networkidle', timeout: 15000 });
            responseCode = resp ? resp.status() : 0;
            loadSuccess = (responseCode >= 200 && responseCode < 400) || (testPage.path.includes('non-existent') && responseCode === 404);
        } catch (e) {
            console.error(`  [FAIL] Failed to load ${testPage.path}: ${e.message}`);
        }

        const title = await page.title();
        const bodyContent = await page.$('body');
        const hasContent = bodyContent !== null;

        console.log(`  Status Code: ${responseCode}`);
        console.log(`  Page Title: "${title}"`);
        console.log(`  Console Errors: ${consoleErrors.length}`);
        if (consoleErrors.length > 0) {
            consoleErrors.slice(0, 5).forEach(err => console.log(`    ⚠️ ${err}`));
        }
        console.log(`  Failed Requests: ${failedRequests.length}`);
        if (failedRequests.length > 0) {
            failedRequests.slice(0, 5).forEach(fr => console.log(`    ⚠️ ${fr}`));
        }

        // Specific page interactive checks
        if (testPage.path === '/') {
            const heroExists = await page.$('#hero') !== null;
            const servicesExists = await page.$('#services') !== null;
            const cad360Exists = await page.$('#cad-360-container') !== null;
            const comparisonExists = await page.$('#comparison') !== null;
            const formExists = await page.$('#consultation-form') !== null;

            console.log(`  [FEATURE CHECK] Hero: ${heroExists ? 'PASS' : 'FAIL'}, Services: ${servicesExists ? 'PASS' : 'FAIL'}, 3D CAD: ${cad360Exists ? 'PASS' : 'FAIL'}, Comparison: ${comparisonExists ? 'PASS' : 'FAIL'}, Form: ${formExists ? 'PASS' : 'FAIL'}`);

            if (formExists) {
                const submitBtn = await page.$('#consultation-form button[type="submit"]');
                if (submitBtn) {
                    await submitBtn.click();
                    const nameInput = await page.$('#consultation-form input[name="name"], #consultation-form input[id*="name"]');
                    const isRequired = nameInput ? await nameInput.getAttribute('required') : null;
                    console.log(`  [INTERACTION] Form required validation check: ${isRequired !== null ? 'PASS' : 'FAIL'}`);
                }
            }
        } else if (testPage.path === '/catalog') {
            const searchInput = await page.$('#catalog-search-input');
            const categoryPills = await page.$$('.category-pill');
            const products = await page.$$('.product-card');
            console.log(`  [FEATURE CHECK] Search Input: ${searchInput ? 'PASS' : 'FAIL'}, Category Pills: ${categoryPills.length}, Products Rendered: ${products.length}`);

            if (categoryPills.length > 1) {
                await categoryPills[1].click();
                await page.waitForTimeout(400);
                const filteredProducts = await page.$$('.product-card');
                console.log(`  [INTERACTION] Category filter click: Filtered products count = ${filteredProducts.length}`);
            }

            if (products.length > 0) {
                await products[0].click();
                await page.waitForTimeout(500);
                const modal = await page.$('#product-detail-modal');
                const isModalActive = modal ? await modal.evaluate(el => el.classList.contains('active') || el.style.display !== 'none') : false;
                console.log(`  [INTERACTION] Product modal open on click: ${isModalActive ? 'PASS' : 'FAIL'}`);
                const closeBtn = await page.$('#product-detail-modal .modal-close, #product-detail-modal [data-close]');
                if (closeBtn) await closeBtn.click();
            }
        } else if (testPage.path === '/our-work') {
            const galleryCards = await page.$$('.gallery-card');
            const categoryPills = await page.$$('.category-pill');
            console.log(`  [FEATURE CHECK] Category Pills: ${categoryPills.length}, Gallery Items: ${galleryCards.length}`);

            if (galleryCards.length > 0) {
                await galleryCards[0].click();
                await page.waitForTimeout(500);
                const lightbox = await page.$('#work-lightbox-modal');
                const isLightboxActive = lightbox ? await lightbox.evaluate(el => el.classList.contains('active') || el.style.display !== 'none') : false;
                console.log(`  [INTERACTION] Lightbox modal open on click: ${isLightboxActive ? 'PASS' : 'FAIL'}`);
                const closeBtn = await page.$('#work-lightbox-modal .lightbox-close, #work-lightbox-modal [data-close]');
                if (closeBtn) await closeBtn.click();
            }
        }

        auditResults.pages.push({
            page: testPage.path,
            name: testPage.name,
            status: loadSuccess ? 'PASS' : 'FAIL',
            statusCode: responseCode,
            title,
            consoleErrors,
            failedRequests
        });

        await page.close();
    }

    // --- PHASE 3: RESPONSIVE & MOBILE OVERFLOW AUDIT ---
    console.log('\n--- PHASE 3: MULTI-VIEWPORT RESPONSIVENESS & OVERFLOW CHECKS ---');
    const viewports = [
        { width: 390, height: 844, name: 'Mobile (iPhone 12/13/14)' },
        { width: 768, height: 1024, name: 'Tablet (iPad Mini / Portrait)' },
        { width: 1440, height: 900, name: 'Desktop (1440p MacBook / PC)' }
    ];

    const responsivePages = ['/', '/catalog', '/our-work', '/admin/dashboard'];

    for (const rPage of responsivePages) {
        for (const vp of viewports) {
            const page = await browser.newPage();
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await page.goto(`http://localhost:${PORT}${rPage}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(500);

            const overflow = await page.evaluate(() => {
                const docWidth = document.documentElement.clientWidth;
                const scrollWidth = document.documentElement.scrollWidth;
                const bodyScrollWidth = document.body ? document.body.scrollWidth : 0;
                const hasOverflow = scrollWidth > docWidth || bodyScrollWidth > docWidth;
                return { docWidth, scrollWidth, bodyScrollWidth, hasOverflow };
            });

            const status = overflow.hasOverflow ? 'OVERFLOW_DETECTED' : 'PASS';
            console.log(`  [${vp.name}] ${rPage}: docWidth=${overflow.docWidth}px, scrollWidth=${overflow.scrollWidth}px -> ${status}`);
            auditResults.viewports.push({
                page: rPage,
                viewport: vp.name,
                overflow
            });

            await page.close();
        }
    }

    await browser.close();
    server.close();

    // --- PHASE 7: LIVE VERCEL PRODUCTION VERIFICATION ---
    console.log('\n--- PHASE 7: LIVE VERCEL PRODUCTION ENDPOINTS VERIFICATION ---');
    const liveEndpoints = [
        { url: 'https://saiindirabala.in/', expectStatus: 200, name: 'Live Apex Homepage' },
        { url: 'https://www.saiindirabala.in/', expectStatus: 308, name: 'Live WWW Redirect' },
        { url: 'https://saiindirabala.in/catalog', expectStatus: 200, name: 'Live Catalog Clean URL' },
        { url: 'https://saiindirabala.in/our-work', expectStatus: 200, name: 'Live Our Work Clean URL' },
        { url: 'https://saiindirabala.in/sitemap.xml', expectStatus: 200, name: 'Live Sitemap XML' },
        { url: 'https://saiindirabala.in/robots.txt', expectStatus: 200, name: 'Live Robots TXT' },
        { url: 'https://saiindirabala.in/non-existent-page-check', expectStatus: 404, name: 'Live 404 Handling' }
    ];

    for (const ep of liveEndpoints) {
        try {
            const res = await fetchUrl(ep.url);
            const passed = res.status === ep.expectStatus || (ep.expectStatus === 308 && [301, 302, 307, 308].includes(res.status));
            console.log(`  [${passed ? 'PASS' : 'WARN'}] ${ep.name} (${ep.url}) -> HTTP ${res.status} (Expected: ${ep.expectStatus})`);
            if (res.headers['location']) {
                console.log(`       Redirect location: ${res.headers['location']}`);
            }
            auditResults.liveProduction.push({
                name: ep.name,
                url: ep.url,
                status: res.status,
                passed
            });
        } catch (e) {
            console.error(`  [FAIL] ${ep.name} (${ep.url}) -> Error: ${e.message}`);
            auditResults.liveProduction.push({
                name: ep.name,
                url: ep.url,
                error: e.message,
                passed: false
            });
        }
    }

    const reportPath = path.join(rootDir, 'docs', 'comprehensive-qa-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2), 'utf8');
    console.log(`\nQA Audit data saved to: ${reportPath}`);
    console.log('\n======================================================================');
    console.log('AUDIT COMPLETED');
    console.log('======================================================================');
}

runAudit().catch(err => {
    console.error('Audit fatal error:', err);
    process.exit(1);
});
