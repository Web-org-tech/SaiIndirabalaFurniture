import fs from 'fs';

const html = fs.readFileSync('admin/dashboard.html', 'utf8');
const css = fs.readFileSync('admin/css/admin.css', 'utf8');
const js = fs.readFileSync('admin/js/dashboard.js', 'utf8');
const bannersJs = fs.readFileSync('admin/js/banners.js', 'utf8');

console.log('--- ADMIN PANEL RESPONSIVE & NAVIGATION VERIFICATION ---');

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

// 1. Verify 5-Item Bottom Navigation Bar
assert(html.includes('id="admin-bottom-nav"'), 'HTML contains #admin-bottom-nav');
assert(html.includes('id="bnav-overview"'), 'HTML contains #bnav-overview');
assert(html.includes('id="bnav-banners"'), 'HTML contains #bnav-banners');
assert(html.includes('id="bnav-catalog"'), 'HTML contains #bnav-catalog');
assert(html.includes('id="bnav-gallery"'), 'HTML contains #bnav-gallery');
assert(html.includes('id="bnav-more"'), 'HTML contains #bnav-more');

// Exactly 5 items in bottom nav
const bnavCount = (html.match(/class="bottom-nav-item/g) || []).length;
assert(bnavCount === 5, `Bottom nav has exactly 5 items (found ${bnavCount})`);

// 2. Verify Mobile More Sheet
assert(html.includes('id="mobile-more-sheet"'), 'HTML contains #mobile-more-sheet');
assert(html.includes('id="sheet-tile-enquiries"'), 'HTML contains #sheet-tile-enquiries');
assert(html.includes('id="sheet-tile-products"'), 'HTML contains #sheet-tile-products');
assert(html.includes('id="sheet-tile-categories"'), 'HTML contains #sheet-tile-categories');
assert(html.includes('id="more-sheet-avatar"'), 'HTML contains #more-sheet-avatar');
assert(html.includes('id="more-sheet-email"'), 'HTML contains #more-sheet-email');
assert(html.includes('id="more-sheet-role"'), 'HTML contains #more-sheet-role');

// 3. Verify Responsive Header Controls
assert(html.includes('id="admin-mobile-profile-toggle"'), 'HTML contains #admin-mobile-profile-toggle');
assert(html.includes('id="admin-avatar-initials-mobile"'), 'HTML contains #admin-avatar-initials-mobile');
assert(html.includes('id="admin-menu-toggle"'), 'HTML contains #admin-menu-toggle');
assert(html.includes('id="admin-mobile-back-btn"'), 'HTML contains #admin-mobile-back-btn');
assert(html.includes('id="current-section-title"'), 'HTML contains #current-section-title');

// 4. Verify Sidebar User Card & Website Link
assert(html.includes('id="sidebar-user-card"'), 'HTML contains #sidebar-user-card');
assert(html.includes('id="sidebar-user-email"'), 'HTML contains #sidebar-user-email');
assert(html.includes('id="sidebar-user-role"'), 'HTML contains #sidebar-user-role');
assert(html.includes('id="sidebar-avatar-initials"'), 'HTML contains #sidebar-avatar-initials');
assert(html.includes('class="btn-sidebar-website"'), 'HTML contains .btn-sidebar-website');

// 5. Verify Consistent Admin Footer
assert(html.includes('class="admin-footer"'), 'HTML contains .admin-footer');
assert(html.includes('id="admin-footer-year"'), 'HTML contains #admin-footer-year');
assert(html.includes('class="admin-footer-link"'), 'HTML contains .admin-footer-link');

// 6. Verify CSS Responsive Rules
assert(css.includes('.admin-mobile-bottom-nav'), 'CSS styles .admin-mobile-bottom-nav');
assert(css.includes('env(safe-area-inset-bottom'), 'CSS handles iOS safe-area-inset-bottom');
assert(css.includes('.mobile-more-sheet'), 'CSS styles .mobile-more-sheet');
assert(css.includes('.admin-footer'), 'CSS styles .admin-footer');
assert(css.includes('@media (max-width: 768px)'), 'CSS contains @media (max-width: 768px)');
assert(css.includes('@media (max-width: 640px)'), 'CSS contains @media (max-width: 640px)');
assert(css.includes('@media (max-width: 480px)'), 'CSS contains @media (max-width: 480px)');
assert(css.includes('@media (max-width: 360px)'), 'CSS contains @media (max-width: 360px)');

// 7. Verify Hero Banners Page & Cards
assert(css.includes('.banner-card-actions'), 'CSS styles .banner-card-actions');
assert(css.includes('.banners-stat-bar'), 'CSS styles .banners-stat-bar');
assert(bannersJs.includes('btn-move-up'), 'banners.js contains Move Up button');
assert(bannersJs.includes('btn-move-down'), 'banners.js contains Move Down button');
assert(bannersJs.includes('btn-edit-banner'), 'banners.js contains Edit button');
assert(bannersJs.includes('btn-delete-banner'), 'banners.js contains Delete button');
assert(bannersJs.includes('btn-toggle-publish'), 'banners.js contains Publish toggle button');

// 8. Verify JS Logic in dashboard.js
assert(js.includes('admin-footer-year'), 'dashboard.js populates admin-footer-year');
assert(js.includes('bnav-overview'), 'dashboard.js handles bnav-overview');
assert(js.includes('bnav-banners'), 'dashboard.js handles bnav-banners');
assert(js.includes('bnav-catalog'), 'dashboard.js handles bnav-catalog');
assert(js.includes('bnav-gallery'), 'dashboard.js handles bnav-gallery');
assert(js.includes('bnav-more'), 'dashboard.js handles bnav-more');
assert(js.includes('more-sheet-email'), 'dashboard.js populates more-sheet-email');
assert(js.includes('sidebar-user-email'), 'dashboard.js populates sidebar-user-email');

console.log(`\nVerification Summary: ${passed} Passed, ${failed} Failed.`);
if (failed > 0) process.exit(1);
