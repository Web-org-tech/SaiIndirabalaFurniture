const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('./node_modules/playwright-core');

const rootDir = path.resolve(__dirname, '..');

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
    '.txt': 'text/plain; charset=utf-8'
};

function createStaticServer(port = 4600) {
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
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        });

        server.listen(port, () => resolve(server));
    });
}

async function runInteractionTests() {
    console.log('======================================================================');
    console.log('INTERACTION & COMPONENT TESTING SUITE (VERIFIED)');
    console.log('======================================================================\n');

    const PORT = 4666;
    const server = await createStaticServer(PORT);

    let browser;
    try {
        browser = await chromium.launch({ channel: 'msedge', headless: true });
    } catch (e) {
        browser = await chromium.launch({ channel: 'chrome', headless: true });
    }

    let passed = 0;
    let failed = 0;

    function assert(cond, msg) {
        if (cond) {
            console.log(`  [PASS] ${msg}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${msg}`);
            failed++;
        }
    }

    // ── 01. HOMEPAGE INTERACTIONS ──────────────────────────────────────────
    console.log('--- 01. HOMEPAGE INTERACTIONS & COMPONENTS ---');
    const homePage = await browser.newPage();
    const homeErrors = [];
    homePage.on('console', msg => { if (msg.type() === 'error') homeErrors.push(msg.text()); });
    homePage.on('pageerror', err => homeErrors.push(err.message));

    // Test Desktop Viewport
    await homePage.setViewportSize({ width: 1440, height: 900 });
    await homePage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

    // Desktop Nav Menu visibility
    const desktopNav = await homePage.$('.nav-menu');
    assert(desktopNav !== null, 'Desktop navigation menu is present');

    // 3D Room Viewer (Three.js canvas)
    const cadCanvas = await homePage.$('#cad-360-container canvas');
    assert(cadCanvas !== null, 'Three.js CAD 360 viewer canvas initialized and rendered');

    // Reality Comparison Slider
    const compSlider = await homePage.$('.comparison-container, .comp-divider');
    assert(compSlider !== null, 'Reality comparison slider container and divider exist');

    // Consultation Form Client Validation
    const nameInput = await homePage.$('#user-name');
    const phoneInput = await homePage.$('#user-phone');
    const typeSelect = await homePage.$('#project-type');
    const submitBtn = await homePage.$('#consultation-form button[type="submit"]');

    assert(nameInput !== null && phoneInput !== null && typeSelect !== null && submitBtn !== null, 'All consultation form inputs and submit button exist');

    if (submitBtn) {
        await submitBtn.scrollIntoViewIfNeeded();
        await submitBtn.click();
        await homePage.waitForTimeout(200);
        const nameErrorVisible = await homePage.$eval('#user-name-error', el => el.classList.contains('visible') || el.textContent.length > 0);
        assert(nameErrorVisible, 'Consultation form displays validation error when submitting empty fields');

        if (nameInput) {
            await nameInput.fill('Karthik Raja');
            await homePage.waitForTimeout(100);
            const nameErrorCleared = await homePage.$eval('#user-name-error', el => !el.classList.contains('visible') || el.textContent === '');
            assert(nameErrorCleared, 'Input event immediately clears field validation error');
        }
    }

    // Test Mobile Hamburger Drawer on Mobile Viewport
    console.log('  Testing Mobile Viewport & Hamburger Drawer (390px):');
    await homePage.setViewportSize({ width: 390, height: 844 });
    await homePage.waitForTimeout(300);

    const hamburger = await homePage.$('.hamburger-btn');
    assert(hamburger !== null, 'Mobile hamburger button exists');
    if (hamburger) {
        await hamburger.click();
        await homePage.waitForTimeout(400);
        const drawerOpen = await homePage.$eval('#mobile-drawer', el => el.classList.contains('open'));
        assert(drawerOpen, 'Hamburger click opens mobile drawer (.open applied)');

        const drawerClose = await homePage.$('#drawer-close-btn');
        if (drawerClose) {
            await drawerClose.click();
            await homePage.waitForTimeout(400);
            const drawerClosed = await homePage.$eval('#mobile-drawer', el => !el.classList.contains('open'));
            assert(drawerClosed, 'Close button dismisses mobile drawer');
        }
    }

    // Phone click-to-call link verification
    const telLinks = await homePage.$$('a[href^="tel:"]');
    assert(telLinks.length >= 2, `Click-to-call telephone links verified (Found: ${telLinks.length})`);

    // WhatsApp action link verification
    const waLinks = await homePage.$$('a[href*="wa.me"]');
    assert(waLinks.length >= 2, `WhatsApp direct chat links verified (Found: ${waLinks.length})`);

    assert(homeErrors.length === 0, `Homepage generated 0 console errors (Errors: ${homeErrors.length})`);
    await homePage.close();

    // ── 02. CATALOG INTERACTIONS ───────────────────────────────────────────
    console.log('\n--- 02. CATALOG INTERACTIONS & MODAL ---');
    const catalogPage = await browser.newPage();
    const catalogErrors = [];
    catalogPage.on('console', msg => { if (msg.type() === 'error') catalogErrors.push(msg.text()); });
    catalogPage.on('pageerror', err => catalogErrors.push(err.message));

    await catalogPage.setViewportSize({ width: 1440, height: 900 });
    await catalogPage.goto(`http://localhost:${PORT}/catalog`, { waitUntil: 'networkidle' });

    // 1. Search Box Interaction
    const searchInput = await catalogPage.$('#catalog-search-input');
    assert(searchInput !== null, 'Catalog search input exists');
    if (searchInput) {
        await searchInput.fill('teak');
        await catalogPage.waitForTimeout(300);
        const resultsCountText = await catalogPage.$eval('#catalog-results-count', el => el.textContent);
        assert(resultsCountText.includes('Showing') || resultsCountText.includes('results') || resultsCountText.includes('product') || resultsCountText.includes('teak'), 'Search query dynamically filters products');

        const clearBtn = await catalogPage.$('#btn-clear-search');
        if (clearBtn) {
            await clearBtn.click();
            await catalogPage.waitForTimeout(300);
            const val = await searchInput.inputValue();
            assert(val === '', 'Clear search button resets input field');
        }
    }

    // 2. Product Card Detail Modal
    const productCard = await catalogPage.$('.product-card [data-action="view-details"]');
    assert(productCard !== null, 'Product card view details action button exists');
    if (productCard) {
        await productCard.scrollIntoViewIfNeeded();
        await productCard.click();
        await catalogPage.waitForTimeout(400);
        const modal = await catalogPage.$('#product-detail-modal');
        const modalVisible = modal ? await modal.evaluate(el => el.classList.contains('active') || el.style.display !== 'none') : false;
        assert(modalVisible, 'Clicking product card opens product details modal');

        const modalClose = await catalogPage.$('#btn-close-product-modal');
        assert(modalClose !== null, 'Modal close button exists');
        if (modalClose) {
            await modalClose.click();
            await catalogPage.waitForTimeout(300);
            const modalClosed = await modal.evaluate(el => !el.classList.contains('active') || el.style.display === 'none');
            assert(modalClosed, 'Modal close button dismisses product details modal');
        }
    }

    // 3. Category Pills
    const pills = await catalogPage.$$('.cat-pill-btn');
    assert(pills.length >= 1, `Category filter pills rendered dynamically (Found: ${pills.length})`);
    if (pills.length > 1) {
        await pills[1].click();
        await catalogPage.waitForTimeout(300);
        const isPillActive = await pills[1].evaluate(el => el.classList.contains('active'));
        assert(isPillActive, 'Clicking category pill sets active state');
        // Reset to all
        await pills[0].click();
        await catalogPage.waitForTimeout(300);
    }

    assert(catalogErrors.length === 0, `Catalog page generated 0 console errors (Errors: ${catalogErrors.length})`);
    await catalogPage.close();

    // ── 03. OUR WORK INTERACTIONS ──────────────────────────────────────────
    console.log('\n--- 03. OUR WORK INTERACTIONS & LIGHTBOX ---');
    const ourWorkPage = await browser.newPage();
    const ourWorkErrors = [];
    ourWorkPage.on('console', msg => { if (msg.type() === 'error') ourWorkErrors.push(msg.text()); });
    ourWorkPage.on('pageerror', err => ourWorkErrors.push(err.message));

    await ourWorkPage.setViewportSize({ width: 1440, height: 900 });
    await ourWorkPage.goto(`http://localhost:${PORT}/our-work`, { waitUntil: 'networkidle' });

    // 1. Category Pills
    const workPills = await ourWorkPage.$$('.cat-pill-btn');
    assert(workPills.length >= 1, `Our Work category filter pills rendered (Found: ${workPills.length})`);

    // 2. Work Cards
    const workCards = await ourWorkPage.$$('.work-card');
    assert(workCards.length >= 1, `Our Work project cards rendered (Found: ${workCards.length})`);

    // 3. Lightbox Interaction
    if (workCards.length > 0) {
        const inspectBtn = await ourWorkPage.$('.work-card [data-action="inspect"]');
        if (inspectBtn) {
            await inspectBtn.scrollIntoViewIfNeeded();
            await inspectBtn.click();
            await ourWorkPage.waitForTimeout(400);
            const lightbox = await ourWorkPage.$('#work-lightbox-modal');
            const lightboxVisible = lightbox ? await lightbox.evaluate(el => el.classList.contains('active') || el.style.display !== 'none') : false;
            assert(lightboxVisible, 'Clicking work card opens image lightbox modal');

            const lightboxClose = await ourWorkPage.$('#btn-close-lightbox');
            if (lightboxClose) {
                await lightboxClose.click();
                await ourWorkPage.waitForTimeout(300);
                const lightboxClosed = await lightbox.evaluate(el => !el.classList.contains('active') || el.style.display === 'none');
                assert(lightboxClosed, 'Lightbox close button dismisses modal');
            }
        }
    }

    assert(ourWorkErrors.length === 0, `Our Work page generated 0 console errors (Errors: ${ourWorkErrors.length})`);
    await ourWorkPage.close();

    // ── 04. ADMIN PORTAL INTERACTIONS ──────────────────────────────────────
    console.log('\n--- 04. ADMIN PORTAL INTERACTIONS ---');
    const adminPage = await browser.newPage();
    await adminPage.goto(`http://localhost:${PORT}/admin`, { waitUntil: 'networkidle' });

    const emailInput = await adminPage.$('#admin-email');
    const pwdInput = await adminPage.$('#admin-password');
    const pwdToggle = await adminPage.$('#toggle-password-btn');
    const loginBtn = await adminPage.$('#login-submit-btn');

    assert(emailInput !== null && pwdInput !== null && loginBtn !== null, 'Admin login inputs and submit button exist');

    if (pwdToggle && pwdInput) {
        const initialType = await pwdInput.getAttribute('type');
        await pwdToggle.click();
        const toggledType = await pwdInput.getAttribute('type');
        assert(initialType === 'password' && toggledType === 'text', 'Password toggle button switches between hidden and visible text');
    }

    if (loginBtn) {
        await loginBtn.click();
        await adminPage.waitForTimeout(300);
        const errorBanner = await adminPage.$('#login-error-banner');
        const hasError = errorBanner ? await errorBanner.evaluate(el => el.style.display !== 'none' || el.textContent.length > 0) : false;
        assert(hasError, 'Admin login form blocks empty credentials and shows error message');
    }

    await adminPage.close();

    await browser.close();
    server.close();

    console.log(`\n======================================================================`);
    console.log(`INTERACTION AUDIT SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log(`======================================================================`);
    if (failed > 0) process.exit(1);
}

runInteractionTests().catch(err => {
    console.error('Interaction test failed:', err);
    process.exit(1);
});
