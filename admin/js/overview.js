/**
 * SAI INDIRABALA FURNITURE - ADMIN OVERVIEW CONTROLLER
 * Simplified, real-time database-driven content summary dashboard.
 * Answers immediately: "How much content have we added to our website?"
 */

import { getSupabase, isConfigured } from './adminClient.js';

// Module State
let isLoadingOverview = false;

/**
 * Initializes the Overview Summary Module.
 */
export function initOverviewModule() {
    setupCardClicks();

    const refreshBtn = document.getElementById('btn-refresh-overview');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadOverviewData(true);
        });
    }

    const retryBtn = document.getElementById('btn-retry-overview');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            loadOverviewData(true);
        });
    }

    // Reactive Synchronization: Listen for data mutations across other modules
    window.addEventListener('admin:data-changed', () => {
        loadOverviewData(true);
    });
    window.addEventListener('admin:category-changed', () => {
        loadOverviewData(true);
    });
    window.addEventListener('admin:product-changed', () => {
        loadOverviewData(true);
    });
    window.addEventListener('admin-data-changed', () => {
        loadOverviewData(true);
    });

    // Load summary metrics initially
    loadOverviewData();
}

/**
 * Sets up click navigation for each summary card to open its respective management section.
 */
function setupCardClicks() {
    const cards = [
        { id: 'kpi-card-categories', hash: 'categories' },
        { id: 'kpi-card-products', hash: 'products' },
        { id: 'kpi-card-gallery', hash: 'gallery' },
        { id: 'kpi-card-banners', hash: 'banners' },
        { id: 'kpi-card-enquiries', hash: 'enquiries' }
    ];

    cards.forEach(({ id, hash }) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', () => {
                window.location.hash = hash;
            });
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.hash = hash;
                }
            });
        }
    });
}

/**
 * Loads real summary counts from Supabase database.
 * @param {boolean} forceRefresh 
 */
export async function loadOverviewData(forceRefresh = false) {
    if (isLoadingOverview) return;
    isLoadingOverview = true;

    const errorBanner = document.getElementById('overview-error-banner');
    if (errorBanner) errorBanner.style.display = 'none';

    // Show skeletons if initial load or forced refresh
    setLoadingState(true);

    if (!isConfigured()) {
        renderPlaceholderState();
        isLoadingOverview = false;
        return;
    }

    try {
        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client is not available.');

        // Concurrent database queries using efficient select counts
        const [catRes, prodRes, galRes, banRes, enqRes] = await Promise.all([
            supabase.from('categories').select('id, is_published'),
            supabase.from('products').select('id, is_published'),
            supabase.from('our_work_gallery').select('id, is_published'),
            supabase.from('hero_banners').select('id, is_published'),
            supabase.from('enquiries').select('id, status')
        ]);

        if (catRes.error) throw catRes.error;
        if (prodRes.error) throw prodRes.error;
        if (galRes.error) throw galRes.error;
        if (banRes.error) throw banRes.error;
        if (enqRes.error) throw enqRes.error;

        const categories = catRes.data || [];
        const products = prodRes.data || [];
        const gallery = galRes.data || [];
        const banners = banRes.data || [];
        const enquiries = enqRes.data || [];

        // 01. Categories counts
        const catTotal = categories.length;
        const catPublished = categories.filter(c => c.is_published).length;
        updateCardValue('kpi-total-categories', catTotal);
        updateTextContent('kpi-published-categories', catPublished);

        // 02. Products counts
        const prodTotal = products.length;
        const prodPublished = products.filter(p => p.is_published).length;
        updateCardValue('kpi-total-products', prodTotal);
        updateTextContent('kpi-published-products', prodPublished);

        // 03. Our Work Gallery counts
        const galTotal = gallery.length;
        const galPublished = gallery.filter(g => g.is_published).length;
        updateCardValue('kpi-total-gallery', galTotal);
        updateTextContent('kpi-published-gallery', galPublished);

        // 04. Hero Banners counts
        const banTotal = banners.length;
        const banPublished = banners.filter(b => b.is_published).length;
        updateCardValue('kpi-total-banners', banTotal);
        updateTextContent('kpi-published-banners', banPublished);

        // 05. Consultation Enquiries counts
        const enqTotal = enquiries.length;
        const enqNew = enquiries.filter(e => e.status === 'new').length;
        updateCardValue('kpi-total-enquiries', enqTotal);
        updateTextContent('kpi-new-enquiries', enqNew);

        // Update timestamp
        const timeEl = document.getElementById('overview-last-updated');
        if (timeEl) {
            const now = new Date();
            timeEl.textContent = `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

    } catch (err) {
        console.error('[Admin Overview] Failed to fetch summary metrics:', err.message);
        if (errorBanner) errorBanner.style.display = 'flex';
    } finally {
        setLoadingState(false);
        isLoadingOverview = false;
    }
}

/**
 * Updates text content of an element safely.
 */
function updateTextContent(elementId, val) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = val;
}

/**
 * Updates a large count element.
 */
function updateCardValue(elementId, val) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = String(val);
    }
}

/**
 * Toggles skeleton shimmer loading animation.
 */
function setLoadingState(loading) {
    const countIds = [
        'kpi-total-categories',
        'kpi-total-products',
        'kpi-total-gallery',
        'kpi-total-banners',
        'kpi-total-enquiries'
    ];

    countIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && loading && el.textContent === '--') {
            el.innerHTML = '<span class="summary-skeleton-pulse"></span>';
        }
    });
}

/**
 * Displays unconfigured state when Supabase credentials are not set.
 */
function renderPlaceholderState() {
    ['kpi-total-categories', 'kpi-total-products', 'kpi-total-gallery', 'kpi-total-banners', 'kpi-total-enquiries'].forEach(id => {
        updateCardValue(id, '0');
    });
}
