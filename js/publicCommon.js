/**
 * SAI INDIRABALA FURNITURE - PUBLIC PAGES COMMON CONTROLLER
 * Lightweight coordinator for header elevation, mobile drawer, loading screen,
 * and accessibility listeners across public multi-page views (Catalog, Our Work).
 */

export function initPublicCommon() {
    // 01. Dismiss Loading Screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loadingScreen.classList.add('fade-out');
            }, 200);
        });

        // Fast fallback dismissal
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
        }, 800);
    }

    // 02. Header Scroll Elevation (Throttled with requestAnimationFrame)
    const siteHeader = document.querySelector('.site-header');
    if (siteHeader) {
        let isScrolled = false;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const shouldScroll = window.pageYOffset > 30;
                    if (shouldScroll !== isScrolled) {
                        isScrolled = shouldScroll;
                        siteHeader.classList.toggle('scrolled', isScrolled);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // 03. Mobile Hamburger Navigation Drawer
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const mobileDrawer = document.querySelector('.mobile-drawer');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');
    const drawerBackdrop = document.getElementById('drawer-backdrop');

    function openMobileMenu() {
        if (!mobileDrawer || !hamburgerBtn) return;
        mobileDrawer.classList.add('open');
        hamburgerBtn.classList.add('active');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        if (drawerBackdrop) {
            drawerBackdrop.style.display = 'block';
            requestAnimationFrame(() => { drawerBackdrop.style.opacity = '1'; });
        }
    }

    function closeMobileMenu() {
        if (!mobileDrawer || !hamburgerBtn) return;
        mobileDrawer.classList.remove('open');
        hamburgerBtn.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        if (drawerBackdrop) {
            drawerBackdrop.style.opacity = '0';
            setTimeout(() => { drawerBackdrop.style.display = 'none'; }, 350);
        }
    }

    if (hamburgerBtn && mobileDrawer) {
        hamburgerBtn.addEventListener('click', () => {
            if (mobileDrawer.classList.contains('open')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });

        if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeMobileMenu);
        if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeMobileMenu);

        mobileNavLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    // 04. Global ESC key listener to close mobile menu or any modal
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });

    // 05. Privacy-Safe Lead & Contact Click Tracking (No PII)
    setupContactClickTracking();
}

/**
 * Dispatches privacy-safe analytics events to window.dataLayer or window.gtag if configured.
 * Strictly avoids PII.
 * @param {string} eventName
 * @param {object} params
 */
export function trackEvent(eventName, params = {}) {
    try {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, params);
        } else if (Array.isArray(window.dataLayer)) {
            window.dataLayer.push({ event: eventName, ...params });
        }
    } catch (e) {
        // Analytics failure must never impact user experience
    }
}

/**
 * Attaches delegated click listeners for phone and WhatsApp enquiries.
 */
function setupContactClickTracking() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href') || '';
        if (href.startsWith('tel:')) {
            trackEvent('phone_click', {
                link_id: link.id || 'tel_link',
                link_text: link.textContent.trim().substring(0, 30)
            });
            trackEvent('contact_click', { method: 'phone' });
        } else if (href.includes('wa.me') || href.includes('whatsapp.com')) {
            trackEvent('whatsapp_click', {
                link_id: link.id || 'wa_link',
                link_title: link.getAttribute('aria-label') || link.getAttribute('title') || 'WhatsApp'
            });
            trackEvent('contact_click', { method: 'whatsapp' });
        }
    }, { passive: true });
}
