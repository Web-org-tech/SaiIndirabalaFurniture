const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
        console.log(`  ✓ PASS: ${testName}`);
        passedTests++;
    } else {
        console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
        failedTests++;
    }
}

function unescapeHtml(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

console.log('======================================================');
console.log(' SAI INDIRABALA FURNITURES — EXTENDED SEO TEST SUITE');
console.log(' Scope: Invisible SEO Layers & Production Validation');
console.log('======================================================');

// ── TEST GROUP 1: ROBOTS.TXT & SITEMAP VALIDATION ───────────────────
console.log('\n--- Test Group 1: Crawl Directives & XML Sitemap ---');

const robotsPath = path.join(rootDir, 'robots.txt');
assert(fs.existsSync(robotsPath), 'robots.txt exists in root');
const robotsContent = fs.readFileSync(robotsPath, 'utf8');
assert(robotsContent.includes('Sitemap: https://saiindirabala.in/sitemap.xml'), 'robots.txt references canonical sitemap URL');
assert(robotsContent.includes('Disallow: /admin'), 'robots.txt disallows /admin');
assert(!robotsContent.includes('www.saiindirabala.in'), 'robots.txt references strictly preferred apex domain');

const sitemapPath = path.join(rootDir, 'sitemap.xml');
assert(fs.existsSync(sitemapPath), 'sitemap.xml exists in root');
const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
assert(sitemapContent.includes('<loc>https://saiindirabala.in/</loc>'), 'sitemap includes apex homepage');
assert(sitemapContent.includes('<loc>https://saiindirabala.in/catalog</loc>'), 'sitemap includes clean catalog URL');
assert(sitemapContent.includes('<loc>https://saiindirabala.in/our-work</loc>'), 'sitemap includes clean our-work URL');
assert(!sitemapContent.includes('.html'), 'sitemap uses clean extensionless URLs');
assert(!sitemapContent.includes('www.saiindirabala.in'), 'sitemap uses strictly preferred apex domain');

// Count URLs in sitemap
const locMatches = sitemapContent.match(/<loc>/g) || [];
assert(locMatches.length === 3, 'sitemap strictly contains only the 3 canonical production URLs');

// ── TEST GROUP 2: HOSTING & REDIRECT CONFIGURATION ───────────────────
console.log('\n--- Test Group 2: Hostname & URL Architecture ---');

const vercelPath = path.join(rootDir, 'vercel.json');
assert(fs.existsSync(vercelPath), 'vercel.json exists');
const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
assert(vercelConfig.cleanUrls === true, 'vercel.json has cleanUrls enabled');
assert(Array.isArray(vercelConfig.redirects), 'vercel.json contains redirect rules');
const wwwRedirect = vercelConfig.redirects.find(r => 
    (r.source && r.source.includes('www.saiindirabala.in')) || 
    (Array.isArray(r.has) && r.has.some(h => h.value === 'www.saiindirabala.in'))
);
assert(wwwRedirect && wwwRedirect.permanent === true, 'vercel.json has permanent 301 redirect for www subdomain');
assert(Array.isArray(vercelConfig.headers) && vercelConfig.headers.length >= 2, 'vercel.json has security and caching headers');

// ── TEST GROUP 3: HTML PAGE METADATA & CANONICAL AUDIT ───────────────
console.log('\n--- Test Group 3: Core Page Metadata & Open Graph ---');

const pages = [
    { file: 'index.html', canonical: 'https://saiindirabala.in/', isIndexable: true, primaryKeyword: 'interior designers in madurai' },
    { file: 'catalog.html', canonical: 'https://saiindirabala.in/catalog', isIndexable: true, primaryKeyword: 'modular kitchen' },
    { file: 'our-work.html', canonical: 'https://saiindirabala.in/our-work', isIndexable: true, primaryKeyword: 'office' },
    { file: '404.html', canonical: null, isIndexable: false, primaryKeyword: null }
];

const titles = new Set();
const descriptions = new Set();

pages.forEach(p => {
    const filePath = path.join(rootDir, p.file);
    assert(fs.existsSync(filePath), `${p.file} exists`);
    const content = fs.readFileSync(filePath, 'utf8');

    // Title Check
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    assert(titleMatch && titleMatch[1].trim().length > 10, `${p.file} has valid <title> tag`, titleMatch ? titleMatch[1] : 'missing');
    if (titleMatch) {
        const decodedTitle = unescapeHtml(titleMatch[1].trim());
        assert(!titles.has(decodedTitle), `${p.file} title is unique across site`);
        titles.add(decodedTitle);

        if (p.isIndexable) {
            assert(decodedTitle.length <= 60, `${p.file} title <= 60 characters (${decodedTitle.length} chars: "${decodedTitle}")`);
        }
    }

    // Meta Description Check
    const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    assert(descMatch && descMatch[1].trim().length >= 40, `${p.file} has descriptive meta description`, descMatch ? `${descMatch[1].length} chars` : 'missing');
    if (descMatch) {
        const decodedDesc = unescapeHtml(descMatch[1].trim());
        assert(!descriptions.has(decodedDesc), `${p.file} description is unique`);
        descriptions.add(decodedDesc);

        if (p.isIndexable) {
            assert(decodedDesc.length >= 150 && decodedDesc.length <= 160, `${p.file} meta description length is strictly 150-160 chars (${decodedDesc.length} chars)`);
            assert(decodedDesc.includes('+91 74184 94994'), `${p.file} meta description includes phone number`);
        }
    }

    // Canonical Tag Check
    const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    if (p.isIndexable) {
        assert(canonicalMatch && canonicalMatch[1] === p.canonical, `${p.file} has exact canonical tag`, canonicalMatch ? canonicalMatch[1] : 'missing');
        assert(!content.includes('<meta name="keywords"'), `${p.file} does not contain obsolete meta keywords`);
        
        const robotsMatch = content.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
        assert(robotsMatch && robotsMatch[1].includes('index') && robotsMatch[1].includes('follow'), `${p.file} has index, follow robots directive`);
        assert(robotsMatch && robotsMatch[1].includes('max-image-preview:large'), `${p.file} has max-image-preview:large directive`);
        
        // Open Graph
        assert(content.includes('property="og:site_name"'), `${p.file} has og:site_name`);
        assert(content.includes('property="og:title"'), `${p.file} has og:title`);
        assert(content.includes('property="og:description"'), `${p.file} has og:description`);
        assert(content.includes('property="og:image"'), `${p.file} has og:image`);
        assert(content.includes('property="og:url"'), `${p.file} has og:url`);

        // Twitter Card
        assert(content.includes('name="twitter:card"'), `${p.file} has twitter:card`);
        assert(content.includes('name="twitter:title"'), `${p.file} has twitter:title`);
        assert(content.includes('name="twitter:description"'), `${p.file} has twitter:description`);

        // Single H1 Check
        const h1Matches = content.match(/<h1[\s>]/gi);
        assert(h1Matches && h1Matches.length === 1, `${p.file} has exactly one <h1> element`);
    } else {
        // 404 Page Checks
        assert(!canonicalMatch, `${p.file} strictly does not contain a canonical tag`);
        assert(content.includes('noindex'), `${p.file} has noindex robots directive`);
    }
});

// ── TEST GROUP 4: STRUCTURED DATA (JSON-LD) AUDIT ───────────────────
console.log('\n--- Test Group 4: Structured Data (Schema.org JSON-LD) ---');

pages.filter(p => p.isIndexable).forEach(p => {
    const filePath = path.join(rootDir, p.file);
    const content = fs.readFileSync(filePath, 'utf8');
    const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
    let match;
    let schemaFound = false;

    while ((match = jsonLdRegex.exec(content)) !== null) {
        schemaFound = true;
        try {
            const parsed = JSON.parse(match[1]);
            assert(parsed['@context'] === 'https://schema.org', `${p.file} JSON-LD specifies valid schema.org context`);
            
            const graph = parsed['@graph'] || [parsed];
            assert(Array.isArray(graph) && graph.length > 0, `${p.file} schema contains entities`);

            // Verify LocalBusiness / FurnitureStore NAP & Stable @id
            const biz = graph.find(e => e['@type'] === 'FurnitureStore' || (Array.isArray(e['@type']) && e['@type'].includes('FurnitureStore')));
            if (biz) {
                assert(biz['@id'] === 'https://saiindirabala.in/#localbusiness', `${p.file} schema uses stable canonical @id`);
                assert(biz.name && biz.name.includes('Sai Indirabala Furnitures'), `${p.file} schema has primary brand name`);
                assert(biz.alternateName === 'Sai Indirabala Interiors', `${p.file} schema has alternateName "Sai Indirabala Interiors"`);
                assert(biz.address && biz.address.addressLocality === 'Madurai', `${p.file} schema has Madurai locality`);
                assert(biz.address && biz.address.postalCode === '625018', `${p.file} schema has verified postal code 625018`);
                assert(biz.telephone && biz.telephone.includes('+917418494994'), `${p.file} schema has verified primary telephone`);
            }

            // Verify truthful schemas per page
            if (p.file === 'index.html') {
                const faq = graph.find(e => e['@type'] === 'FAQPage');
                assert(!faq, 'index.html strictly omits non-visible FAQPage schema (truthful per guidelines)');
                assert(biz && biz.hasOfferCatalog !== undefined, 'index.html includes confirmed services OfferCatalog');
            } else if (p.file === 'catalog.html') {
                const collection = graph.find(e => e['@type'] === 'CollectionPage');
                const itemList = graph.find(e => e['@type'] === 'ItemList');
                assert(collection !== undefined, 'catalog.html includes CollectionPage schema');
                assert(collection && Array.isArray(collection.about), 'catalog.html CollectionPage includes about topics');
                assert(itemList && itemList.itemListElement.length > 0, 'catalog.html includes ItemList schema');
            } else if (p.file === 'our-work.html') {
                const collection = graph.find(e => e['@type'] === 'CollectionPage');
                const gallery = graph.find(e => e['@type'] === 'ImageGallery');
                assert(collection !== undefined, 'our-work.html includes CollectionPage schema');
                assert(gallery && Array.isArray(gallery.hasPart) && gallery.hasPart.length > 0, 'our-work.html includes ImageGallery schema');
            }

            // Ensure NO fake ratings or unverified reviews in schema
            const aggRating = graph.find(e => e['@type'] === 'AggregateRating' || (e.aggregateRating !== undefined));
            assert(!aggRating, `${p.file} strictly does not include unverified AggregateRating schema`);

        } catch (err) {
            assert(false, `${p.file} JSON-LD parses without syntax errors`, err.message);
        }
    }
    assert(schemaFound, `${p.file} contains JSON-LD structured data`);
});

// ── TEST GROUP 5: INTERNAL LINKING & CLEAN URLS ─────────────────────
console.log('\n--- Test Group 5: Internal Link Architecture & Clean URLs ---');

pages.forEach(p => {
    const filePath = path.join(rootDir, p.file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Navigation and footer should not contain .html links for primary routes
    const dirtyIndex = content.match(/href=["']index\.html["']/g);
    const dirtyCatalog = content.match(/href=["']catalog\.html["']/g);
    const dirtyOurWork = content.match(/href=["']our-work\.html["']/g);

    assert(!dirtyIndex, `${p.file} does not link to index.html (uses clean URL)`);
    assert(!dirtyCatalog, `${p.file} does not link to catalog.html (uses clean URL)`);
    assert(!dirtyOurWork, `${p.file} does not link to our-work.html (uses clean URL)`);

    // Verify phone links use correct tel: protocol
    const phoneMatches = content.match(/href=["']tel:[^"']+["']/g) || [];
    assert(phoneMatches.length > 0, `${p.file} contains click-to-call phone links`);
    phoneMatches.forEach(pm => {
        assert(pm.includes('+91'), `${p.file} phone link ${pm} includes international country code +91`);
    });

    // Verify WhatsApp links use valid format
    const waMatches = content.match(/href=["']https:\/\/wa\.me\/917418494994[^"']*["']/g) || [];
    assert(waMatches.length > 0, `${p.file} contains verified WhatsApp enquiry links`);
});

// ── TEST GROUP 6: IMAGE OPTIMIZATION & ACCESSIBILITY ────────────────
console.log('\n--- Test Group 6: Media Optimization & Accessibility ---');

const heroCompressedPath = path.join(rootDir, 'images', 'hero', 'hero_furniture.jpg');
assert(fs.existsSync(heroCompressedPath), 'Compressed hero image exists (hero_furniture.jpg)');
const heroSize = fs.statSync(heroCompressedPath).size;
assert(heroSize < 400 * 1024, `Hero image size (${Math.round(heroSize / 1024)} KB) is optimized (< 400 KB)`);

// Check index.html hero image uses <picture>
const indexContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
assert(indexContent.includes('<picture>') && indexContent.includes('hero_furniture.jpg'), 'index.html hero utilizes responsive <picture> with optimized JPG');

// Check that all <img> in index, catalog, and our-work have descriptive non-generic alt attributes
['index.html', 'catalog.html', 'our-work.html'].forEach(f => {
    const c = fs.readFileSync(path.join(rootDir, f), 'utf8');
    const imgMatches = c.match(/<img[^>]+>/g) || [];
    let allHaveAlt = true;
    let hasGenericLogoAlt = false;

    imgMatches.forEach(img => {
        if (!img.includes('alt="')) {
            if (!img.includes('aria-hidden="true"')) allHaveAlt = false;
        }
        if (img.includes('alt="Logo"') || img.includes('alt="image"')) {
            hasGenericLogoAlt = true;
        }
    });

    assert(allHaveAlt, `${f} all content images have non-empty alt attributes`);
    assert(!hasGenericLogoAlt, `${f} does not contain generic alt="Logo" or alt="image"`);
});

// ── TEST GROUP 7: RESILIENT CLIENT-SIDE FALLBACKS ───────────────────
console.log('\n--- Test Group 7: Resilient JavaScript Data Fallbacks ---');

const catalogJsPath = path.join(rootDir, 'js', 'catalog.js');
const catalogJs = fs.readFileSync(catalogJsPath, 'utf8');
assert(catalogJs.includes('DEFAULT_WORKSHOP_PRODUCTS'), 'catalog.js defines verified workshop products fallback');
assert(catalogJs.includes('DEFAULT_WORKSHOP_CATEGORIES'), 'catalog.js defines verified workshop categories fallback');

const ourWorkJsPath = path.join(rootDir, 'js', 'ourWork.js');
const ourWorkJs = fs.readFileSync(ourWorkJsPath, 'utf8');
assert(ourWorkJs.includes('DEFAULT_WORKSHOP_PROJECTS'), 'ourWork.js defines verified workshop projects fallback');

const commonJsPath = path.join(rootDir, 'js', 'publicCommon.js');
const commonJs = fs.readFileSync(commonJsPath, 'utf8');
assert(commonJs.includes('export function trackEvent'), 'publicCommon.js exports privacy-safe trackEvent');

const formJsPath = path.join(rootDir, 'js', 'form.js');
const formJs = fs.readFileSync(formJsPath, 'utf8');
assert(formJs.includes('generate_lead'), 'form.js dispatches generate_lead on successful submission');
assert(formJs.includes('form_submit'), 'form.js dispatches form_submit');

// ── TEST GROUP 8: TRUTHFULNESS & UNVERIFIED CLAIMS AUDIT ────────────
console.log('\n--- Test Group 8: Truthfulness & Unverified Claims Audit ---');

['index.html', 'catalog.html', 'our-work.html'].forEach(f => {
    const c = fs.readFileSync(path.join(rootDir, f), 'utf8').toLowerCase();
    assert(!c.includes('best interior designer in india'), `${f} does not make unverified claim 'best in india'`);
    assert(!c.includes('#1 interior designer'), `${f} does not make unverified '#1' claim`);
    assert(!c.includes('5000+ happy clients') && !c.includes('10000+ completed projects'), `${f} does not include fabricated metric claims`);
});

// ====================================================================
console.log('\n======================================================');
console.log(` SEO TEST SUITE FINISHED: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('======================================================\n');

if (failedTests > 0) {
    console.error(`❌ TEST SUITE FAILED with ${failedTests} failure(s).`);
    process.exit(1);
} else {
    console.log('🎉 ALL EXTENDED PRODUCTION SEO CRITERIA SUCCESSFULLY VALIDATED!');
    process.exit(0);
}
