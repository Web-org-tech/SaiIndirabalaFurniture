/**
 * SAI INDIRABALA FURNITURE - PUBLIC OUR WORK GALLERY CONTROLLER
 * Native ES6 JavaScript Module.
 * Connects securely to Supabase (read-only) via public anon key.
 * Queries published records only (public.our_work_gallery where is_published = true).
 * Strictly excludes drafts and does not invent client claims.
 */

import { getSupabase, isConfigured } from './supabaseClient.js';
import { initPublicCommon } from './publicCommon.js';

// Module State
let galleryData = [];
let categoriesList = [];
let activeCategory = 'all';
let searchQuery = '';
let currentLightboxItem = null;

// Fallback SVG icon for missing images
const PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120' width='120' height='120'%3E%3Crect width='120' height='120' fill='%23f5f1e8'/%3E%3Cpath d='M35 30 C35 24, 85 24, 85 30 L85 65 L35 65 Z' fill='none' stroke='%236a422a' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M28 65 C28 60, 92 60, 92 65 L92 78 C92 82, 28 82, 28 78 Z' fill='none' stroke='%236a422a' stroke-width='4'/%3E%3Cpath d='M32 82 L24 100 M88 82 L96 100' stroke='%23c49a5b' stroke-width='4' stroke-linecap='round'/%3E%3Ccircle cx='60' cy='48' r='5' fill='%23c49a5b'/%3E%3C/svg%3E";

/**
 * Escapes HTML characters for safe DOM interpolation.
 * @param {string} str 
 * @returns {string}
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', () => {
    initPublicCommon();
    initOurWork();
});

async function initOurWork() {
    setupSearchAndFilterEvents();
    setupLightboxEvents();

    if (!isConfigured()) {
        renderOfflineNotice();
        return;
    }

    await loadGalleryData();
}

/**
 * Loads published gallery items from Supabase.
 */
async function loadGalleryData() {
    const gridEl = document.getElementById('gallery-grid');
    if (!gridEl) return;

    gridEl.innerHTML = `
        <div class="gallery-state-box" style="grid-column: 1 / -1;">
            <div class="state-spinner" aria-hidden="true"></div>
            <div class="gallery-state-title">Loading Completed Projects</div>
            <div class="gallery-state-text">Fetching authentic client installations across Madurai and Tamil Nadu...</div>
        </div>
    `;

    try {
        const supabase = await getSupabase();
        if (!supabase) {
            renderOfflineNotice();
            return;
        }

        // Fetch ONLY published gallery records
        const { data, error } = await supabase
            .from('our_work_gallery')
            .select('id, title, description, image_url, category, display_order, created_at')
            .eq('is_published', true)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;

        galleryData = data || [];

        // Extract unique categories from published items
        const rawCats = galleryData
            .map(item => item.category)
            .filter(c => c && typeof c === 'string' && c.trim().length > 0);
        categoriesList = Array.from(new Set(rawCats)).sort();

        // Render UI
        renderCategoryPills();
        renderGalleryGrid();

    } catch (err) {
        console.warn('[SIB Gallery] Data retrieval error:', err.message);
        renderErrorState(err.message);
    }
}

/**
 * Renders category filter pills dynamically.
 */
function renderCategoryPills() {
    const container = document.getElementById('category-pills-wrap');
    if (!container) return;

    const totalCount = galleryData.length;

    let html = `
        <button type="button" class="cat-pill-btn ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">
            <span>All Projects</span>
            <span class="cat-pill-count">${totalCount}</span>
        </button>
    `;

    categoriesList.forEach(cat => {
        const count = galleryData.filter(item => item.category === cat).length;
        const isActive = activeCategory === cat ? 'active' : '';
        html += `
            <button type="button" class="cat-pill-btn ${isActive}" data-cat="${escapeHtml(cat)}">
                <span>${escapeHtml(cat)}</span>
                <span class="cat-pill-count">${count}</span>
            </button>
        `;
    });

    container.innerHTML = html;

    // Attach pill click listeners
    container.querySelectorAll('.cat-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.cat-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.getAttribute('data-cat');
            renderGalleryGrid();
        });
    });
}

/**
 * Filters and renders gallery cards.
 */
function renderGalleryGrid() {
    const gridEl = document.getElementById('gallery-grid');
    const countEl = document.getElementById('gallery-results-count');
    if (!gridEl) return;

    let filtered = galleryData.slice();

    // Filter by Category
    if (activeCategory !== 'all') {
        filtered = filtered.filter(item => item.category === activeCategory);
    }

    // Filter by Search
    if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(item => {
            const titleMatch = item.title && item.title.toLowerCase().includes(query);
            const descMatch = item.description && item.description.toLowerCase().includes(query);
            const catMatch = item.category && item.category.toLowerCase().includes(query);
            return titleMatch || descMatch || catMatch;
        });
    }

    // Update count indicator
    if (countEl) {
        countEl.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${galleryData.length}</strong> project installations`;
    }

    // Empty State
    if (filtered.length === 0) {
        gridEl.innerHTML = `
            <div class="gallery-state-box" style="grid-column: 1 / -1;">
                <div class="gallery-state-title">No Projects Found</div>
                <div class="gallery-state-text">
                    ${searchQuery ? `No installation records matched your search for "${escapeHtml(searchQuery)}".` : 'There are currently no published projects in this category.'}
                </div>
                <button type="button" class="btn btn-outline" id="btn-reset-gallery-filter" style="margin: 0 auto;">
                    Reset Filters &amp; View All
                </button>
            </div>
        `;

        const resetBtn = document.getElementById('btn-reset-gallery-filter');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                activeCategory = 'all';
                searchQuery = '';
                const searchInput = document.getElementById('gallery-search-input');
                if (searchInput) searchInput.value = '';
                renderCategoryPills();
                renderGalleryGrid();
            });
        }
        return;
    }

    // Render Cards
    gridEl.innerHTML = filtered.map(item => {
        const catName = item.category || 'Woodcraft Installation';
        const imgSrc = item.image_url ? escapeHtml(item.image_url) : PLACEHOLDER_SVG;
        const waText = encodeURIComponent(`Hi Sai Indirabala Furniture, I saw your completed project "${item.title}" (${catName}) in your Our Work portfolio. Could you share details for a similar installation for our space?`);

        return `
            <article class="work-card" data-work-id="${escapeHtml(item.id)}">
                <div class="work-card-img-wrap" data-action="inspect">
                    <img src="${imgSrc}" 
                         alt="${escapeHtml(item.title)}" 
                         class="work-card-img" 
                         loading="lazy" 
                         onerror="this.onerror=null; this.src='${PLACEHOLDER_SVG}';">
                    <span class="work-card-badge">${escapeHtml(catName)}</span>
                    <span class="work-card-zoom-indicator" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                        <span>Inspect</span>
                    </span>
                </div>
                <div class="work-card-body">
                    <h2 class="work-card-title" data-action="inspect">${escapeHtml(item.title)}</h2>
                    <p class="work-card-desc">${escapeHtml(item.description || 'Authentic client project manufactured and installed by Sai Indirabala Furniture.')}</p>
                    <div class="work-card-actions">
                        <button type="button" class="btn-card-inspect" data-action="inspect">
                            <span>View Full Project</span>
                            <span aria-hidden="true">→</span>
                        </button>
                        <a href="https://wa.me/917418494994?text=${waText}" 
                           target="_blank" 
                           rel="noopener" 
                           class="btn-card-wa" 
                           aria-label="Enquire about ${escapeHtml(item.title)} on WhatsApp">
                            <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.842L.057 23.453a.75.75 0 00.918.919l5.651-1.458A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 01-4.961-1.357l-.356-.211-3.683.95.978-3.584-.232-.369A9.721 9.721 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
                        </a>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // Attach card click handlers
    gridEl.querySelectorAll('.work-card').forEach(card => {
        const itemId = card.getAttribute('data-work-id');
        const item = galleryData.find(g => g.id === itemId);
        if (!item) return;

        card.querySelectorAll('[data-action="inspect"]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                openLightbox(item);
            });
        });
    });
}

let lastFocusedElement = null;

/**
 * Opens accessible project lightbox viewer.
 * @param {object} item 
 */
function openLightbox(item) {
    currentLightboxItem = item;
    lastFocusedElement = document.activeElement;
    const modal = document.getElementById('work-lightbox-modal');
    if (!modal) return;

    const imgEl = document.getElementById('lightbox-img');
    const titleEl = document.getElementById('lightbox-title');
    const catEl = document.getElementById('lightbox-cat');
    const descEl = document.getElementById('lightbox-desc');
    const waBtn = document.getElementById('lightbox-wa-btn');

    if (imgEl) {
        imgEl.src = item.image_url || PLACEHOLDER_SVG;
        imgEl.alt = item.title;
        imgEl.onerror = () => { imgEl.src = PLACEHOLDER_SVG; };
    }

    if (titleEl) titleEl.textContent = item.title;
    if (catEl) catEl.textContent = item.category || 'Woodcraft Installation';
    if (descEl) descEl.textContent = item.description || 'Authentic client project completed across Tamil Nadu.';

    if (waBtn) {
        const waText = encodeURIComponent(`Hi Sai Indirabala Furniture, I am inspecting your completed project "${item.title}" in your Our Work portfolio. I would like to consult on a similar installation.`);
        waBtn.href = `https://wa.me/917418494994?text=${waText}`;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Focus close button for accessibility
    const closeBtn = document.getElementById('btn-close-lightbox-modal');
    if (closeBtn) closeBtn.focus();
}

/**
 * Closes project lightbox viewer.
 */
function closeLightbox() {
    const modal = document.getElementById('work-lightbox-modal');
    if (!modal) return;

    modal.style.display = 'none';
    document.body.style.overflow = '';
    currentLightboxItem = null;

    // Restore focus to triggering card button for keyboard accessibility
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}

/**
 * Sets up search and filter events.
 */
function setupSearchAndFilterEvents() {
    const searchInput = document.getElementById('gallery-search-input');
    const clearBtn = document.getElementById('btn-clear-search');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            if (clearBtn) {
                clearBtn.style.display = searchQuery.length > 0 ? 'flex' : 'none';
            }
            renderGalleryGrid();
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearBtn.style.display = 'none';
            searchInput.focus();
            renderGalleryGrid();
        });
    }
}

/**
 * Sets up lightbox dismissal events.
 */
function setupLightboxEvents() {
    const modal = document.getElementById('work-lightbox-modal');
    const closeBtn = document.getElementById('btn-close-lightbox-modal');

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLightbox();
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentLightboxItem) {
            closeLightbox();
        }
    });
}

/**
 * Renders offline notice when Supabase is unconfigured.
 */
function renderOfflineNotice() {
    const gridEl = document.getElementById('gallery-grid');
    const toolbar = document.querySelector('.gallery-toolbar');
    if (toolbar) toolbar.style.display = 'none';

    if (gridEl) {
        gridEl.innerHTML = `
            <div class="gallery-offline-banner" style="grid-column: 1 / -1;">
                <div class="offline-banner-content">
                    <h3>Authentic Site Installations &amp; Completed Works</h3>
                    <p>Our online portfolio gallery is currently being synced by workshop managers. You can inspect verified customer photos and 3D vs Built reality case studies directly on our homepage, or message our team for immediate site photos across Tamil Nadu.</p>
                </div>
                <div class="offline-banner-actions">
                    <a href="index.html#our-work" class="btn btn-primary">
                        View 3D vs Reality on Home
                    </a>
                    <a href="https://wa.me/917418494994?text=Hi%20Sai%20Indirabala%20Furniture,%20please%20share%20photos%20of%20your%20recently%20completed%20furniture%20and%20interior%20projects." 
                       target="_blank" 
                       rel="noopener" 
                       class="btn btn-outline" 
                       style="border-color:var(--accent-light); color:var(--cream);">
                        WhatsApp Site Photos
                    </a>
                </div>
            </div>
        `;
    }
}

/**
 * Renders error state on database failure.
 * @param {string} errorMsg 
 */
function renderErrorState(errorMsg) {
    const gridEl = document.getElementById('gallery-grid');
    if (!gridEl) return;

    gridEl.innerHTML = `
        <div class="gallery-state-box" style="grid-column: 1 / -1;">
            <div class="gallery-state-title" style="color: #c92a2a;">Gallery Temporarily Unavailable</div>
            <div class="gallery-state-text">
                We encountered a connection issue retrieving project portfolio records. You can inspect our project case studies on our homepage or call our workshop directly.
            </div>
            <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem;">
                <button type="button" class="btn btn-primary" onclick="window.location.reload()">Retry</button>
                <a href="index.html#our-work" class="btn btn-outline">View Homepage Projects</a>
            </div>
        </div>
    `;
}
