/**
 * SAI INDIRABALA FURNITURE - ADMIN DASHBOARD CONTROLLER
 * Initializes dashboard shell, navigation tabs, mobile drawer,
 * and user profile display upon verified administrator authorization.
 */

import { initRouteGuard } from './guard.js';
import { signOutAdmin } from './adminClient.js';
import { initOverviewModule, loadOverviewData } from './overview.js';
import { initBannersModule, loadBanners } from './banners.js';
import { initCategoriesModule, loadCategories } from './categories.js';
import { initProductsModule, loadProducts } from './products.js';
import { initGalleryModule, loadGallery } from './gallery.js';
import { initEnquiriesModule, loadEnquiries } from './enquiries.js';

document.addEventListener('DOMContentLoaded', () => {
    // 01. Execute Route Guard First
    initRouteGuard((user, role) => {
        initDashboardApp(user, role);
    });
});

/**
 * Initializes the dashboard shell once authorization is confirmed.
 * @param {object} user - Authenticated administrator user object
 * @param {string} role - Verified admin role
 */
function initDashboardApp(user, role) {
    // 02. Populate Admin Profile Info (Desktop Header, Mobile Header, Sidebar, & More Sheet)
    const userEmailEl = document.getElementById('admin-user-email');
    const userRoleEl = document.getElementById('admin-user-role');
    const userAvatarEl = document.getElementById('admin-avatar-initials');

    const sidebarEmailEl = document.getElementById('sidebar-user-email');
    const sidebarRoleEl = document.getElementById('sidebar-user-role');
    const sidebarAvatarEl = document.getElementById('sidebar-avatar-initials');
    const mobileAvatarEl = document.getElementById('admin-avatar-initials-mobile');

    const moreEmailEl = document.getElementById('more-sheet-email');
    const moreRoleEl = document.getElementById('more-sheet-role');
    const moreAvatarEl = document.getElementById('more-sheet-avatar');

    const emailText = user.email || 'Administrator';
    const roleText = role === 'super_admin' ? 'Super Admin' : 'Admin';
    const roleClass = `role-badge ${role === 'super_admin' ? 'role-super' : 'role-standard'}`;
    const initials = (user.email ? user.email.slice(0, 2) : 'AD').toUpperCase();

    if (userEmailEl) userEmailEl.textContent = emailText;
    if (userRoleEl) { userRoleEl.textContent = roleText; userRoleEl.className = roleClass; }
    if (userAvatarEl) userAvatarEl.textContent = initials;

    if (sidebarEmailEl) sidebarEmailEl.textContent = emailText;
    if (sidebarRoleEl) { sidebarRoleEl.textContent = roleText; sidebarRoleEl.className = roleClass; }
    if (sidebarAvatarEl) sidebarAvatarEl.textContent = initials;

    if (mobileAvatarEl) mobileAvatarEl.textContent = initials;
    if (moreEmailEl) moreEmailEl.textContent = emailText;
    if (moreRoleEl) { moreRoleEl.textContent = roleText; moreRoleEl.className = roleClass; }
    if (moreAvatarEl) moreAvatarEl.textContent = initials;

    // Dynamic Copyright Year
    const yearEl = document.getElementById('admin-footer-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // 03. Setup Logout Buttons (Header, Mobile Drawer, More Sheet, & Footer)
    const logoutBtns = document.querySelectorAll('.action-logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            btn.disabled = true;
            btn.textContent = 'Signing out...';
            await signOutAdmin();
            window.location.replace('index.html');
        });
    });

    // 04. Mobile Navigation Drawer Controls
    const mobileMenuToggle = document.getElementById('admin-menu-toggle');
    const mobileProfileToggle = document.getElementById('admin-mobile-profile-toggle');
    const sidebarEl = document.getElementById('admin-sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

    function openMobileSidebar() {
        closeMoreSheet();
        closeCatalogChoice();
        if (sidebarEl) sidebarEl.classList.add('open');
        if (sidebarBackdrop) {
            sidebarBackdrop.style.display = 'block';
            requestAnimationFrame(() => { sidebarBackdrop.style.opacity = '1'; });
        }
        document.body.style.overflow = 'hidden';
    }

    function closeMobileSidebar() {
        if (sidebarEl) sidebarEl.classList.remove('open');
        if (sidebarBackdrop) {
            sidebarBackdrop.style.opacity = '0';
            setTimeout(() => { sidebarBackdrop.style.display = 'none'; }, 250);
        }
        document.body.style.overflow = '';
    }

    if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', openMobileSidebar);
    if (mobileProfileToggle) mobileProfileToggle.addEventListener('click', openMobileSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMobileSidebar);

    // 05. Mobile More Action Sheet Controls
    const moreSheetEl = document.getElementById('mobile-more-sheet');
    const moreSheetBackdrop = document.getElementById('more-sheet-backdrop');
    const moreSheetCloseBtn = document.getElementById('btn-close-more-sheet');
    const bnavMoreBtn = document.getElementById('bnav-more');

    function openMoreSheet() {
        closeMobileSidebar();
        closeCatalogChoice();
        if (moreSheetEl) {
            moreSheetEl.style.display = 'flex';
            requestAnimationFrame(() => {
                moreSheetEl.classList.add('open');
                if (bnavMoreBtn) bnavMoreBtn.setAttribute('aria-expanded', 'true');
            });
            document.body.style.overflow = 'hidden';
        }
    }

    function closeMoreSheet() {
        if (moreSheetEl) {
            moreSheetEl.classList.remove('open');
            if (bnavMoreBtn) bnavMoreBtn.setAttribute('aria-expanded', 'false');
            setTimeout(() => {
                moreSheetEl.style.display = 'none';
                document.body.style.overflow = '';
            }, 250);
        }
    }

    if (bnavMoreBtn) {
        bnavMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (moreSheetEl && moreSheetEl.classList.contains('open')) {
                closeMoreSheet();
            } else {
                openMoreSheet();
            }
        });
    }
    if (moreSheetCloseBtn) moreSheetCloseBtn.addEventListener('click', closeMoreSheet);
    if (moreSheetBackdrop) moreSheetBackdrop.addEventListener('click', closeMoreSheet);

    // Tiles inside More Sheet
    const sheetTileEnquiries = document.getElementById('sheet-tile-enquiries');
    if (sheetTileEnquiries) {
        sheetTileEnquiries.addEventListener('click', () => {
            closeMoreSheet();
            switchView('view-enquiries');
            window.location.hash = 'enquiries';
        });
    }
    const sheetTileProducts = document.getElementById('sheet-tile-products');
    if (sheetTileProducts) {
        sheetTileProducts.addEventListener('click', () => {
            closeMoreSheet();
            switchView('view-products');
            window.location.hash = 'products';
        });
    }
    const sheetTileCategories = document.getElementById('sheet-tile-categories');
    if (sheetTileCategories) {
        sheetTileCategories.addEventListener('click', () => {
            closeMoreSheet();
            switchView('view-categories');
            window.location.hash = 'categories';
        });
    }

    // 05b. Floating Catalog Selection Popover (Mobile Speed Dial) Controls
    const catalogChoicePopover = document.getElementById('catalog-choice-popover');
    const catalogChoiceBackdrop = document.getElementById('catalog-choice-backdrop');
    const choiceBtnCategories = document.getElementById('choice-btn-categories');
    const choiceBtnProducts = document.getElementById('choice-btn-products');
    const bnavCatalog = document.getElementById('bnav-catalog');

    function openCatalogChoice() {
        closeMobileSidebar();
        closeMoreSheet();
        if (catalogChoicePopover && catalogChoiceBackdrop) {
            catalogChoicePopover.style.display = 'block';
            catalogChoiceBackdrop.style.display = 'block';
            requestAnimationFrame(() => {
                catalogChoicePopover.classList.add('open');
                catalogChoiceBackdrop.classList.add('open');
                if (bnavCatalog) bnavCatalog.setAttribute('aria-expanded', 'true');
            });
        }
    }

    function closeCatalogChoice() {
        if (catalogChoicePopover) {
            catalogChoicePopover.classList.remove('open');
            if (bnavCatalog) bnavCatalog.setAttribute('aria-expanded', 'false');
            setTimeout(() => {
                if (!catalogChoicePopover.classList.contains('open')) {
                    catalogChoicePopover.style.display = 'none';
                }
            }, 240);
        }
        if (catalogChoiceBackdrop) {
            catalogChoiceBackdrop.classList.remove('open');
            setTimeout(() => {
                if (!catalogChoiceBackdrop.classList.contains('open')) {
                    catalogChoiceBackdrop.style.display = 'none';
                }
            }, 220);
        }
    }

    if (bnavCatalog) {
        bnavCatalog.addEventListener('click', (e) => {
            e.preventDefault();
            if (catalogChoicePopover && catalogChoicePopover.classList.contains('open')) {
                closeCatalogChoice();
            } else {
                openCatalogChoice();
            }
        });
    }

    if (catalogChoiceBackdrop) {
        catalogChoiceBackdrop.addEventListener('click', closeCatalogChoice);
    }

    if (choiceBtnCategories) {
        choiceBtnCategories.addEventListener('click', () => {
            closeCatalogChoice();
            switchView('view-categories');
            window.location.hash = 'categories';
        });
    }

    if (choiceBtnProducts) {
        choiceBtnProducts.addEventListener('click', () => {
            closeCatalogChoice();
            switchView('view-products');
            window.location.hash = 'products';
        });
    }

    // Global Escape key listener to close floating drawers and popovers
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCatalogChoice();
            closeMoreSheet();
            closeMobileSidebar();
        }
    });

    // 06. Section / Tab Switching & Bottom Nav Synchronization
    const navLinks = document.querySelectorAll('.sidebar-nav-item');
    const viewSections = document.querySelectorAll('.admin-view-panel');
    const catalogGroup = document.getElementById('nav-group-catalog');
    const catalogToggleBtn = document.getElementById('btn-toggle-catalog-group');
    const mobileBackBtn = document.getElementById('admin-mobile-back-btn');
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');

    // Toggle Catalog accordion in sidebar
    if (catalogToggleBtn && catalogGroup) {
        catalogToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isOpen = catalogGroup.classList.toggle('open');
            catalogToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    // Mobile Back Button -> Jumps back to Overview
    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', () => {
            switchView('view-overview');
            window.location.hash = 'overview';
        });
    }

    function switchView(targetViewId) {
        const targetLink = document.querySelector(`.sidebar-nav-item[data-view="${targetViewId}"]`);
        if (!targetLink && !document.getElementById(targetViewId)) return;

        // Update active sidebar link styling
        navLinks.forEach(l => l.classList.remove('active'));
        if (targetLink) targetLink.classList.add('active');

        // Automatically open catalog group if a catalog sub-item is active
        if (targetViewId === 'view-categories' || targetViewId === 'view-products') {
            if (catalogGroup) {
                catalogGroup.classList.add('open');
                catalogToggleBtn?.setAttribute('aria-expanded', 'true');
            }
        }

        // Switch visible view panel
        viewSections.forEach(panel => {
            if (panel.id === targetViewId) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // Update header title
        const headerTitleEl = document.getElementById('current-section-title');
        const linkTitle = targetLink?.querySelector('.nav-label')?.textContent;
        if (headerTitleEl && linkTitle) {
            headerTitleEl.textContent = linkTitle;
        } else if (headerTitleEl) {
            if (targetViewId === 'view-overview') headerTitleEl.textContent = 'Dashboard';
            else if (targetViewId === 'view-banners') headerTitleEl.textContent = 'Hero Banners';
            else if (targetViewId === 'view-categories') headerTitleEl.textContent = 'Categories';
            else if (targetViewId === 'view-products') headerTitleEl.textContent = 'Products';
            else if (targetViewId === 'view-gallery') headerTitleEl.textContent = 'Our Work';
            else if (targetViewId === 'view-enquiries') headerTitleEl.textContent = 'Enquiries';
        }

        // Update Five-Item Bottom Navigation active highlights and load current section data
        bottomNavItems.forEach(b => b.classList.remove('active'));
        if (targetViewId === 'view-overview') {
            document.getElementById('bnav-overview')?.classList.add('active');
            loadOverviewData();
        } else if (targetViewId === 'view-banners') {
            document.getElementById('bnav-banners')?.classList.add('active');
            loadBanners();
        } else if (targetViewId === 'view-categories') {
            document.getElementById('bnav-catalog')?.classList.add('active');
            loadCategories();
        } else if (targetViewId === 'view-products') {
            document.getElementById('bnav-catalog')?.classList.add('active');
            loadProducts();
        } else if (targetViewId === 'view-gallery') {
            document.getElementById('bnav-gallery')?.classList.add('active');
            loadGallery();
        } else if (targetViewId === 'view-enquiries') {
            document.getElementById('bnav-more')?.classList.add('active');
            loadEnquiries();
        }

        // Mobile Back Button Visibility: only show when navigating away from Overview on mobile
        if (mobileBackBtn) {
            const isOverview = targetViewId === 'view-overview';
            if (isOverview || window.innerWidth > 768) {
                mobileBackBtn.style.display = 'none';
            } else {
                mobileBackBtn.style.display = 'inline-flex';
            }
        }

        // Close mobile drawer, more sheet, and floating catalog choice popover
        closeMobileSidebar();
        closeMoreSheet();
        closeCatalogChoice();

        // Smooth scroll to top of view
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Sidebar navigation click handlers
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetViewId = link.getAttribute('data-view');
            if (targetViewId) {
                switchView(targetViewId);
                const hash = targetViewId.replace('view-', '');
                window.location.hash = hash;
            }
        });
    });

    // Five-Item Bottom Navigation click handlers
    const bnavOverview = document.getElementById('bnav-overview');
    if (bnavOverview) {
        bnavOverview.addEventListener('click', () => {
            switchView('view-overview');
            window.location.hash = 'overview';
        });
    }
    const bnavBanners = document.getElementById('bnav-banners');
    if (bnavBanners) {
        bnavBanners.addEventListener('click', () => {
            switchView('view-banners');
            window.location.hash = 'banners';
        });
    }
    // Note: bnav-catalog floating choice speed dial is handled in section 05b above
    const bnavGallery = document.getElementById('bnav-gallery');
    if (bnavGallery) {
        bnavGallery.addEventListener('click', () => {
            switchView('view-gallery');
            window.location.hash = 'gallery';
        });
    }

    // Footer quick link click handlers
    document.querySelectorAll('.admin-footer-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetViewId = link.getAttribute('data-view');
            if (targetViewId) {
                switchView(targetViewId);
                const hash = targetViewId.replace('view-', '');
                window.location.hash = hash;
            }
        });
    });

    // Shortcut inside Category Delete Restrict modal to jump to Products
    const manageCatProdsBtn = document.getElementById('btn-manage-cat-products');
    if (manageCatProdsBtn) {
        manageCatProdsBtn.addEventListener('click', () => {
            const delModal = document.getElementById('category-delete-modal');
            if (delModal) delModal.style.display = 'none';
            document.body.style.overflow = '';
            switchView('view-products');
            window.location.hash = 'products';
        });
    }

    // 08. Initialize Modules
    initOverviewModule();
    initCategoriesModule();
    initProductsModule();
    initBannersModule();
    initGalleryModule();
    initEnquiriesModule();

    // 09. Initial Hash Route Support
    const hash = window.location.hash.replace('#', '');
    if (hash === 'categories') {
        switchView('view-categories');
    } else if (hash === 'products') {
        switchView('view-products');
    } else if (hash === 'banners') {
        switchView('view-banners');
    } else if (hash === 'gallery') {
        switchView('view-gallery');
    } else if (hash === 'enquiries') {
        switchView('view-enquiries');
    } else {
        switchView('view-overview');
    }

    window.addEventListener('hashchange', () => {
        const curHash = window.location.hash.replace('#', '');
        if (curHash && document.getElementById(`view-${curHash}`)) {
            switchView(`view-${curHash}`);
        }
    });
}
