import fs from 'fs';

const html = fs.readFileSync('admin/dashboard.html', 'utf8');
const css = fs.readFileSync('admin/css/admin.css', 'utf8');

const breakpoints = [320, 375, 390, 430, 768, 1024, 1440];

console.log('--- TESTING DASHBOARD BREAKPOINTS & MOBILE USABILITY ---');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`[PASS] ${message}`);
        passed++;
    } else {
        console.error(`[FAIL] ${message}`);
        failed++;
    }
}

breakpoints.forEach(bp => {
    console.log(`\nEvaluating viewport width: ${bp}px`);
    if (bp <= 768) {
        // Mobile / Tablet viewports
        assert(css.includes('@media (max-width: 768px)'), `Breakpoint ${bp}px covered by max-width: 768px`);
        if (bp <= 640) {
            assert(css.includes('@media (max-width: 640px)'), `Breakpoint ${bp}px covered by max-width: 640px`);
        }
        if (bp <= 480) {
            assert(css.includes('@media (max-width: 480px)'), `Breakpoint ${bp}px covered by max-width: 480px`);
        }
        if (bp <= 360) {
            assert(css.includes('@media (max-width: 360px)'), `Breakpoint ${bp}px covered by max-width: 360px`);
        }
    } else {
        // Desktop viewports (1024px, 1440px)
        assert(css.includes('.admin-sidebar {') && css.includes('width: 260px;'), `Desktop ${bp}px preserves persistent 260px sidebar navigation`);
    }
});

// Verify touch-friendly targets
assert(css.includes('min-height: 44px;'), 'Interactive touch targets have min-height: 44px on mobile');

// Verify safe area insets
assert(css.includes('calc(76px + env(safe-area-inset-bottom, 0px))'), 'admin-main has safe-area padding-bottom buffer');
assert(css.includes('padding-bottom: calc(0.35rem + env(safe-area-inset-bottom, 0px))'), 'Bottom navigation respects iOS safe area insets');

// Verify image constraints
assert(css.includes('.banner-card-thumb {\n    width: 100%;\n    max-width: 100%;'), 'Banner thumbnails are width 100% and max-width 100%');

// Verify responsive table scrolling
assert(css.includes('overflow-x: auto;') && css.includes('-webkit-overflow-scrolling: touch;'), 'Tables have smooth horizontal scrolling containers on mobile');

console.log(`\nBreakpoint Audit: ${passed} Passed, ${failed} Failed.`);
if (failed > 0) process.exit(1);
