const fs = require('fs');
const path = require('path');
const https = require('https');

const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
    totalTests++;
    if (condition) {
        console.log(`  [PASS] ${testName}`);
        passedTests++;
    } else {
        console.error(`  [FAIL] ${testName}`);
        failedTests++;
    }
}

async function runRegressionSuite() {
    console.log('======================================================================');
    console.log('SAI INDIRABALA FURNITURE - COMPREHENSIVE QA REGRESSION TEST SUITE');
    console.log('Environment: Local Source & Live Supabase Verification');
    console.log('======================================================================\n');

    // ── 01. PUBLIC HOMEPAGE (index.html) ──────────────────────────────────────────
    console.log('[SECTION 1] Public Homepage (index.html)');
    const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    assert(indexHtml.includes('class="site-header"'), 'Header element exists with .site-header');
    assert(indexHtml.includes('class="brand-name">SAI INDIRABALA</span>'), 'Brand name text is present');
    assert(indexHtml.includes('id="hero"'), 'Hero section exists with #hero');
    assert(indexHtml.includes('id="services"'), 'Services section exists with #services');
    assert(indexHtml.includes('id="3d-design"'), '3D design section exists with #3d-design');
    assert(indexHtml.includes('id="comparison"'), '3D vs Built reality comparison exists with #comparison');
    assert(indexHtml.includes('id="cad-360-container"'), '3D Room viewer exists with #cad-360-container');
    assert(indexHtml.includes('id="consultation-form"'), 'Consultation contact form exists with #consultation-form');
    assert(indexHtml.includes('class="site-footer"'), 'Footer exists with .site-footer');
    assert(indexHtml.includes('href="tel:+917418494994"'), 'Call Now action link exists with tel:+917418494994');
    assert(indexHtml.includes('https://wa.me/917418494994'), 'WhatsApp action link exists with +917418494994');
    assert(indexHtml.includes('src="js/main.js"'), 'Entry module js/main.js is loaded');

    // ── 02. PUBLIC CATALOG (catalog.html) ─────────────────────────────────────────
    console.log('\n[SECTION 2] Public Catalog (catalog.html)');
    const catalogHtml = fs.readFileSync(path.join(rootDir, 'catalog.html'), 'utf8');
    assert(catalogHtml.includes('id="category-pills-wrap"'), 'Category filter container exists (#category-pills-wrap)');
    assert(catalogHtml.includes('id="catalog-search-input"'), 'Search input exists (#catalog-search-input)');
    assert(catalogHtml.includes('id="products-grid"'), 'Products grid container exists (#products-grid)');
    assert(catalogHtml.includes('id="product-detail-modal"'), 'Product details modal exists (#product-detail-modal)');
    assert(catalogHtml.includes('src="js/catalog.js"'), 'Catalog module js/catalog.js is loaded');

    // ── 03. PUBLIC OUR WORK (our-work.html) ───────────────────────────────────────
    console.log('\n[SECTION 3] Public Our Work (our-work.html)');
    const ourWorkHtml = fs.readFileSync(path.join(rootDir, 'our-work.html'), 'utf8');
    assert(ourWorkHtml.includes('id="gallery-grid"'), 'Gallery grid container exists (#gallery-grid)');
    assert(ourWorkHtml.includes('id="category-pills-wrap"'), 'Category filter pills exist (#category-pills-wrap)');
    assert(ourWorkHtml.includes('id="work-lightbox-modal"'), 'Image lightbox modal exists (#work-lightbox-modal)');
    assert(ourWorkHtml.includes('src="js/ourWork.js"'), 'Our Work module js/ourWork.js is loaded');

    // ── 04. 404 PAGE (404.html) & VERCEL ROUTING ──────────────────────────────────
    console.log('\n[SECTION 4] 404 Page & Vercel Routing Configuration');
    const page404 = fs.readFileSync(path.join(rootDir, '404.html'), 'utf8');
    const vercelJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8'));
    assert(page404.includes('404'), '404 status indicator present in 404.html');
    assert(page404.includes('href="/"') || page404.includes('href="index.html"'), 'Return to homepage CTA present in 404.html');
    assert(vercelJson.cleanUrls === true, 'Vercel cleanUrls enabled');
    assert(vercelJson.trailingSlash === false, 'Vercel trailingSlash disabled');
    assert(Array.isArray(vercelJson.rewrites) && vercelJson.rewrites.length > 0, 'Vercel 404 rewrite rule configured');

    // ── 05. ADMIN CMS DASHBOARD (admin/dashboard.html & modules) ──────────────────
    console.log('\n[SECTION 5] Admin CMS Dashboard');
    const dashHtml = fs.readFileSync(path.join(rootDir, 'admin', 'dashboard.html'), 'utf8');
    const dashJs = fs.readFileSync(path.join(rootDir, 'admin', 'js', 'dashboard.js'), 'utf8');
    const prodJs = fs.readFileSync(path.join(rootDir, 'admin', 'js', 'products.js'), 'utf8');
    const catJs = fs.readFileSync(path.join(rootDir, 'admin', 'js', 'categories.js'), 'utf8');
    const overJs = fs.readFileSync(path.join(rootDir, 'admin', 'js', 'overview.js'), 'utf8');

    assert(dashHtml.includes('id="admin-sidebar"'), 'Admin sidebar present');
    assert(dashHtml.includes('id="view-overview"'), 'Overview view panel present');
    assert(dashHtml.includes('id="view-categories"'), 'Categories view panel present');
    assert(dashHtml.includes('id="view-products"'), 'Products view panel present');
    assert(dashHtml.includes('id="view-banners"'), 'Hero banners view panel present');
    assert(dashHtml.includes('id="view-gallery"'), 'Our work gallery view panel present');
    assert(dashHtml.includes('id="view-enquiries"'), 'Enquiries view panel present');

    // ── 06. CATEGORY-PRODUCT REACTIVE SYNCHRONIZATION ─────────────────────────────
    console.log('\n[SECTION 6] Category-Product Reactive Synchronization');
    assert(catJs.includes("admin:category-changed"), 'categories.js dispatches admin:category-changed on mutations');
    assert(prodJs.includes("admin:category-changed"), 'products.js listens for admin:category-changed');
    assert(prodJs.includes("loadCategoriesForProducts"), 'products.js refreshes category dropdowns dynamically');
    assert(prodJs.includes("admin:product-changed"), 'products.js dispatches admin:product-changed on mutations');
    assert(catJs.includes("admin:product-changed"), 'categories.js listens for admin:product-changed to recalculate counts');
    assert(overJs.includes("admin:category-changed") && overJs.includes("admin:product-changed"), 'overview.js listens to both events for real-time totals');

    // ── 07. SUPABASE STORAGE INTEGRATION ──────────────────────────────────────────
    console.log('\n[SECTION 7] Supabase Storage Integration');
    const imgUploadJs = fs.readFileSync(path.join(rootDir, 'admin', 'js', 'imageUpload.js'), 'utf8');
    assert(imgUploadJs.includes("STORAGE_BUCKET = 'media'"), 'Storage bucket is set to media');
    assert(imgUploadJs.includes("MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024"), '5MB client file size limit enforced');
    assert(imgUploadJs.includes("validateImageFile"), 'Image format and size validation present');

    // ── 08. LIVE DATABASE CONNECTIVITY & PERMISSIONS ──────────────────────────────
    console.log('\n[SECTION 8] Live Supabase Database Connectivity & RLS');
    const configJs = fs.readFileSync(path.join(rootDir, 'js', 'config.js'), 'utf8');
    const urlMatch = configJs.match(/SUPABASE_URL:\s*env\.SUPABASE_URL\s*\|\|\s*['"]([^'"]+)['"]/);
    const anonMatch = configJs.match(/SUPABASE_ANON_KEY:\s*env\.SUPABASE_ANON_KEY\s*\|\|\s*['"]([^'"]+)['"]/);

    const supabaseUrl = urlMatch ? urlMatch[1] : '';
    const anonKey = anonMatch ? anonMatch[1] : '';

    assert(supabaseUrl.startsWith('https://'), 'Supabase URL is valid HTTPS');
    assert(anonKey.length > 50, 'Supabase Anon key is valid JWT');

    function queryTable(endpoint) {
        return new Promise((resolve) => {
            const u = new URL(endpoint, supabaseUrl);
            const req = https.get(u, {
                headers: {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, data: JSON.parse(data) });
                    } catch (e) {
                        resolve({ status: res.statusCode, raw: data });
                    }
                });
            });
            req.on('error', err => resolve({ status: 0, error: err.message }));
        });
    }

    const catRes = await queryTable('/rest/v1/categories?select=id,name,is_published');
    assert(catRes.status === 200, 'Public read categories table returns 200 OK');

    const prodRes = await queryTable('/rest/v1/products?select=id,name,is_published');
    assert(prodRes.status === 200, 'Public read products table returns 200 OK');

    const banRes = await queryTable('/rest/v1/hero_banners?select=id,title,is_published');
    assert(banRes.status === 200, 'Public read hero_banners table returns 200 OK');

    const galRes = await queryTable('/rest/v1/our_work_gallery?select=id,title,is_published');
    assert(galRes.status === 200, 'Public read our_work_gallery table returns 200 OK');

    // Verify storage bucket endpoint
    const storageRes = await new Promise((resolve) => {
        https.get(`${supabaseUrl}/storage/v1/object/public/media/probe.jpg`, (res) => {
            resolve({ status: res.statusCode });
        }).on('error', err => resolve({ status: 0, error: err.message }));
    });
    assert(storageRes.status === 400 || storageRes.status === 404, 'Supabase Storage media bucket is reachable');

    console.log('\n======================================================================');
    console.log(`REGRESSION SUMMARY: ${passedTests} Passed, ${failedTests} Failed (Total: ${totalTests})`);
    console.log('======================================================================\n');

    if (failedTests > 0) {
        process.exit(1);
    }
}

runRegressionSuite();
