/**
 * SAI INDIRABALA FURNITURE - PUBLIC CATALOG CONTROLLER
 * Native ES6 JavaScript Module.
 * Connects securely to Supabase (read-only) via public anon key.
 * Strictly adheres to published categories and published products.
 * Never invents prices, specifications, or unpublished products.
 */

import { getSupabase, isConfigured } from './supabaseClient.js';
import { initPublicCommon } from './publicCommon.js';

// Module State
let categoriesData = [];
let productsData = [];
let activeCategoryId = 'all';
let searchQuery = '';
let currentModalProduct = null;

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

/**
 * Initializes the Catalog page.
 */
document.addEventListener('DOMContentLoaded', () => {
    initPublicCommon();
    initCatalog();
});

async function initCatalog() {
    setupSearchAndFilterEvents();
    setupModalEvents();
    setupPopStateListener();

    if (!isConfigured()) {
        renderOfflineNotice();
        return;
    }

    await loadCatalogData();
}

/**
 * Loads published categories and products from Supabase.
 */
async function loadCatalogData() {
    const gridEl = document.getElementById('products-grid');
    if (!gridEl) return;

    gridEl.innerHTML = `
        <div class="catalog-state-box" style="grid-column: 1 / -1;">
            <div class="state-spinner" aria-hidden="true"></div>
            <div class="catalog-state-title">Loading Workshop Catalog</div>
            <div class="catalog-state-text">Fetching authentic handcrafted collections manufactured at our Madurai workshop...</div>
        </div>
    `;

    try {
        const supabase = await getSupabase();
        if (!supabase) {
            renderOfflineNotice();
            return;
        }

        // 01. Fetch Published Categories
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('id, name, slug, description, image_url, display_order')
            .eq('is_published', true)
            .order('display_order', { ascending: true });

        if (catError) throw catError;
        categoriesData = categories || [];

        // 02. Fetch Published Products
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('id, category_id, name, slug, short_description, description, image_url, gallery_images, specifications, display_order')
            .eq('is_published', true)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (prodError) throw prodError;

        // 03. Strictly filter products: Only include items whose category is currently published
        const publishedCategoryIds = new Set(categoriesData.map(c => c.id));
        productsData = (products || []).filter(p => publishedCategoryIds.has(p.category_id));

        // Render UI
        renderCategoryPills();
        renderProducts();

        // 04. Check URL Parameter for deep-linking (?product=...)
        checkUrlProductParam();

    } catch (err) {
        console.warn('[SIB Catalog] Data retrieval error:', err.message);
        renderErrorState(err.message);
    }
}

/**
 * Renders category filter pills dynamically.
 */
function renderCategoryPills() {
    const container = document.getElementById('category-pills-wrap');
    if (!container) return;

    const totalCount = productsData.length;

    let html = `
        <button type="button" class="cat-pill-btn ${activeCategoryId === 'all' ? 'active' : ''}" data-cat-id="all">
            <span>All Collections</span>
            <span class="cat-pill-count">${totalCount}</span>
        </button>
    `;

    categoriesData.forEach(cat => {
        const count = productsData.filter(p => p.category_id === cat.id).length;
        const isActive = activeCategoryId === cat.id ? 'active' : '';
        html += `
            <button type="button" class="cat-pill-btn ${isActive}" data-cat-id="${escapeHtml(cat.id)}">
                <span>${escapeHtml(cat.name)}</span>
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
            activeCategoryId = btn.getAttribute('data-cat-id');
            renderProducts();
        });
    });
}

/**
 * Filters and renders products according to search input and active category.
 */
function renderProducts() {
    const gridEl = document.getElementById('products-grid');
    const countEl = document.getElementById('catalog-results-count');
    if (!gridEl) return;

    let filtered = productsData.slice();

    // Filter by Category
    if (activeCategoryId !== 'all') {
        filtered = filtered.filter(p => p.category_id === activeCategoryId);
    }

    // Filter by Search
    if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(p => {
            const nameMatch = p.name && p.name.toLowerCase().includes(query);
            const descMatch = p.short_description && p.short_description.toLowerCase().includes(query);
            const longDescMatch = p.description && p.description.toLowerCase().includes(query);
            return nameMatch || descMatch || longDescMatch;
        });
    }

    // Update count indicator
    if (countEl) {
        countEl.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${productsData.length}</strong> products`;
    }

    // Empty State
    if (filtered.length === 0) {
        gridEl.innerHTML = `
            <div class="catalog-state-box" style="grid-column: 1 / -1;">
                <div class="catalog-state-title">No Products Found</div>
                <div class="catalog-state-text">
                    ${searchQuery ? `No catalog items matched your search for "${escapeHtml(searchQuery)}".` : 'There are currently no published products in this category.'}
                </div>
                <button type="button" class="btn btn-outline" id="btn-reset-catalog-filter" style="margin: 0 auto;">
                    Reset Filters &amp; View All
                </button>
            </div>
        `;

        const resetBtn = document.getElementById('btn-reset-catalog-filter');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                activeCategoryId = 'all';
                searchQuery = '';
                const searchInput = document.getElementById('catalog-search-input');
                if (searchInput) searchInput.value = '';
                renderCategoryPills();
                renderProducts();
            });
        }
        return;
    }

    // Map Category IDs to Names
    const catMap = new Map();
    categoriesData.forEach(c => catMap.set(c.id, c.name));

    // Render Cards
    gridEl.innerHTML = filtered.map(prod => {
        const catName = catMap.get(prod.category_id) || 'Furniture';
        const imgSrc = prod.image_url ? escapeHtml(prod.image_url) : PLACEHOLDER_SVG;
        const waText = encodeURIComponent(`Hi Sai Indirabala Furniture, I am interested in "${prod.name}" from your catalog. Could you please share the specifications and direct factory pricing?`);

        // Render up to 2 key specification chips if present
        let specsHtml = '';
        if (prod.specifications && typeof prod.specifications === 'object') {
            const entries = Object.entries(prod.specifications)
                .filter(([_, v]) => v !== null && v !== undefined && String(v).trim().length > 0)
                .slice(0, 2);

            if (entries.length > 0) {
                specsHtml = `<div class="product-specs-chips">` + entries.map(([k, v]) => `
                    <span class="spec-chip"><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v))}</span>
                `).join('') + `</div>`;
            }
        }

        return `
            <article class="product-card" data-product-id="${escapeHtml(prod.id)}">
                <div class="product-card-img-wrap" data-action="view-details">
                    <img src="${imgSrc}" 
                         alt="${escapeHtml(prod.name)}" 
                         class="product-card-img" 
                         loading="lazy" 
                         onerror="this.onerror=null; this.src='${PLACEHOLDER_SVG}';">
                    <span class="product-card-badge">${escapeHtml(catName)}</span>
                </div>
                <div class="product-card-body">
                    <h2 class="product-card-title" data-action="view-details">${escapeHtml(prod.name)}</h2>
                    <p class="product-card-desc">${escapeHtml(prod.short_description || prod.description || '')}</p>
                    ${specsHtml}
                    <div class="product-card-actions">
                        <button type="button" class="btn-card-details" data-action="view-details">
                            <span>View Details</span>
                            <span aria-hidden="true">→</span>
                        </button>
                        <a href="https://wa.me/917418494994?text=${waText}" 
                           target="_blank" 
                           rel="noopener" 
                           class="btn-card-wa" 
                           aria-label="Enquire about ${escapeHtml(prod.name)} on WhatsApp">
                            <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.842L.057 23.453a.75.75 0 00.918.919l5.651-1.458A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 01-4.961-1.357l-.356-.211-3.683.95.978-3.584-.232-.369A9.721 9.721 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
                        </a>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // Attach card click listeners to open detail modal
    gridEl.querySelectorAll('.product-card').forEach(card => {
        const prodId = card.getAttribute('data-product-id');
        const prod = productsData.find(p => p.id === prodId);
        if (!prod) return;

        card.querySelectorAll('[data-action="view-details"]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                openProductModal(prod);
            });
        });
    });
}

let lastFocusedElement = null;

/**
 * Opens accessible product details modal.
 * @param {object} prod 
 * @param {boolean} updateUrl - whether to sync URL parameter
 */
function openProductModal(prod, updateUrl = true) {
    currentModalProduct = prod;
    lastFocusedElement = document.activeElement;
    const modal = document.getElementById('product-detail-modal');
    if (!modal) return;

    // Resolve Category Name
    const cat = categoriesData.find(c => c.id === prod.category_id);
    const catName = cat ? cat.name : 'Custom Furniture';

    // Elements
    const titleEl = document.getElementById('modal-prod-title');
    const catEl = document.getElementById('modal-prod-cat');
    const descEl = document.getElementById('modal-prod-desc');
    const mainImgEl = document.getElementById('modal-main-img');
    const thumbsStrip = document.getElementById('modal-thumbnails-strip');
    const specsWrap = document.getElementById('modal-specs-wrap');
    const specsTable = document.getElementById('modal-specs-table');
    const waBtn = document.getElementById('modal-btn-wa');
    const callBtn = document.getElementById('modal-btn-call');

    if (titleEl) titleEl.textContent = prod.name;
    if (catEl) catEl.textContent = catName;
    if (descEl) descEl.textContent = prod.description || prod.short_description || 'Detailed specifications available on direct inquiry from our Madurai factory.';

    // Main Image
    const primaryImg = prod.image_url || PLACEHOLDER_SVG;
    if (mainImgEl) {
        mainImgEl.src = primaryImg;
        mainImgEl.alt = prod.name;
        mainImgEl.onerror = () => { mainImgEl.src = PLACEHOLDER_SVG; };
    }

    // Gallery Thumbnails
    if (thumbsStrip) {
        const allImages = [];
        if (prod.image_url) allImages.push(prod.image_url);
        if (Array.isArray(prod.gallery_images)) {
            prod.gallery_images.forEach(img => {
                if (img && typeof img === 'string' && img !== prod.image_url) {
                    allImages.push(img);
                }
            });
        }

        if (allImages.length > 1) {
            thumbsStrip.innerHTML = allImages.map((img, idx) => `
                <button type="button" class="modal-thumb-btn ${idx === 0 ? 'active' : ''}" data-img-url="${escapeHtml(img)}" aria-label="View photo ${idx + 1}">
                    <img src="${escapeHtml(img)}" alt="${escapeHtml(prod.name)} view ${idx + 1}" onerror="this.src='${PLACEHOLDER_SVG}'">
                </button>
            `).join('');
            thumbsStrip.style.display = 'flex';

            thumbsStrip.querySelectorAll('.modal-thumb-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    thumbsStrip.querySelectorAll('.modal-thumb-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const targetSrc = btn.getAttribute('data-img-url');
                    if (mainImgEl) mainImgEl.src = targetSrc;
                });
            });
        } else {
            thumbsStrip.style.display = 'none';
            thumbsStrip.innerHTML = '';
        }
    }

    // Specifications Table
    if (specsWrap && specsTable) {
        if (prod.specifications && typeof prod.specifications === 'object') {
            const validEntries = Object.entries(prod.specifications)
                .filter(([_, v]) => v !== null && v !== undefined && String(v).trim().length > 0);

            if (validEntries.length > 0) {
                specsTable.innerHTML = validEntries.map(([key, val]) => `
                    <tr>
                        <th>${escapeHtml(key)}</th>
                        <td>${escapeHtml(String(val))}</td>
                    </tr>
                `).join('');
                specsWrap.style.display = 'block';
            } else {
                specsWrap.style.display = 'none';
            }
        } else {
            specsWrap.style.display = 'none';
        }
    }

    // WhatsApp Action CTA
    if (waBtn) {
        const waText = encodeURIComponent(`Hi Sai Indirabala Furniture, I am reviewing "${prod.name}" (${catName}) from your online catalog. I would like to request an authentic quote and schedule a consultation.`);
        waBtn.href = `https://wa.me/917418494994?text=${waText}`;
    }

    // Call Action CTA
    if (callBtn) {
        callBtn.href = 'tel:+917418494994';
    }

    // Show modal & prevent background scroll
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Focus close button for accessibility
    const closeBtn = document.getElementById('btn-close-product-modal');
    if (closeBtn) closeBtn.focus();

    // Update URL parameter
    if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set('product', prod.slug || prod.id);
        window.history.pushState({ productId: prod.id }, '', url.toString());
    }
}

/**
 * Closes product detail modal and reverts URL parameter.
 * @param {boolean} revertUrl 
 */
function closeProductModal(revertUrl = true) {
    const modal = document.getElementById('product-detail-modal');
    if (!modal) return;

    modal.style.display = 'none';
    document.body.style.overflow = '';
    currentModalProduct = null;

    if (revertUrl) {
        const url = new URL(window.location.href);
        url.searchParams.delete('product');
        window.history.pushState({}, '', url.pathname);
    }

    // Restore focus to triggering element for keyboard accessibility
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}

/**
 * Sets up search and filter bar event listeners.
 */
function setupSearchAndFilterEvents() {
    const searchInput = document.getElementById('catalog-search-input');
    const clearBtn = document.getElementById('btn-clear-search');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            if (clearBtn) {
                clearBtn.style.display = searchQuery.length > 0 ? 'flex' : 'none';
            }
            renderProducts();
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearBtn.style.display = 'none';
            searchInput.focus();
            renderProducts();
        });
    }
}

/**
 * Sets up modal dismissal listeners.
 */
function setupModalEvents() {
    const modal = document.getElementById('product-detail-modal');
    const closeBtn = document.getElementById('btn-close-product-modal');

    if (closeBtn) closeBtn.addEventListener('click', () => closeProductModal(true));

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProductModal(true);
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentModalProduct) {
            closeProductModal(true);
        }
    });
}

/**
 * Handles browser back/forward buttons with product URL parameter.
 */
function setupPopStateListener() {
    window.addEventListener('popstate', () => {
        checkUrlProductParam(false);
    });
}

/**
 * Reads ?product= query parameter and opens the corresponding modal.
 * @param {boolean} updateUrl 
 */
function checkUrlProductParam(updateUrl = false) {
    const params = new URLSearchParams(window.location.search);
    const prodParam = params.get('product');

    if (prodParam && productsData.length > 0) {
        const match = productsData.find(p => p.id === prodParam || p.slug === prodParam);
        if (match) {
            openProductModal(match, updateUrl);
        } else {
            closeProductModal(false);
        }
    } else if (!prodParam && currentModalProduct) {
        closeProductModal(false);
    }
}

/**
 * Renders offline / unconfigured state when Supabase credentials are not live.
 */
function renderOfflineNotice() {
    const gridEl = document.getElementById('products-grid');
    const toolbar = document.querySelector('.catalog-toolbar');
    if (toolbar) toolbar.style.display = 'none';

    if (gridEl) {
        gridEl.innerHTML = `
            <div class="catalog-offline-banner" style="grid-column: 1 / -1;">
                <div class="offline-banner-content">
                    <h3>Direct Factory Catalog &amp; Custom Work</h3>
                    <p>Our digital catalog is currently being updated by workshop administrators. You can explore our handcrafted furniture and institutional fixtures directly with our Madurai team, or request instant quotes with customized 3D design visualizations.</p>
                </div>
                <div class="offline-banner-actions">
                    <a href="https://wa.me/917418494994?text=Hi%20Sai%20Indirabala%20Furniture,%20please%20share%20your%20current%20furniture%20catalog%20and%20pricing%20details." 
                       target="_blank" 
                       rel="noopener" 
                       class="btn btn-primary" 
                       style="background:#1a8a3c; border-color:#1a8a3c;">
                        WhatsApp Factory
                    </a>
                    <a href="tel:+917418494994" class="btn btn-outline" style="border-color:var(--accent-light); color:var(--cream);">
                        Call 7418 4949 94
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
    const gridEl = document.getElementById('products-grid');
    if (!gridEl) return;

    gridEl.innerHTML = `
        <div class="catalog-state-box" style="grid-column: 1 / -1;">
            <div class="catalog-state-title" style="color: #c92a2a;">Catalog Temporarily Unavailable</div>
            <div class="catalog-state-text">
                We are experiencing a temporary network issue connecting to the catalog server. Please reach out to our Madurai workshop directly for prompt assistance.
            </div>
            <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem;">
                <button type="button" class="btn btn-primary" onclick="window.location.reload()">Retry Loading</button>
                <a href="tel:+917418494994" class="btn btn-outline">Call Workshop</a>
            </div>
        </div>
    `;
}
