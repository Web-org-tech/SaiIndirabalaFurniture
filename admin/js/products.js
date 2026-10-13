/**
 * SAI INDIRABALA FURNITURE - ADMIN PRODUCT CATALOG MODULE
 * Full CRUD, category binding, global unique slug validation,
 * gallery images array JSONB, specifications object JSONB, reordering and publishing.
 * Strictly adheres to public.products database schema and RLS policies.
 */

import { getSupabase, isConfigured } from './adminClient.js';
import { slugify } from './categories.js';
import { setupImageUploader, uploadImageToStorage, validateImageFile } from './imageUpload.js';

// Module State
let productsData = [];
let categoriesList = [];
let editingProductId = null;
let deletingProduct = null;
let previewDebounceTimer = null;
let slugManuallyEdited = false;
let productCoverUploader = null;

// Dynamic Form Sub-State
let activeGalleryItems = []; // Array of { url?: string, file?: File, objectUrl?: string, isNewFile: boolean }
let activeSpecifications = []; // Array of { key: string, value: string }

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
 * Validates slug format against database check constraint.
 * @param {string} slug 
 * @returns {boolean}
 */
function isValidSlug(slug) {
    if (!slug) return false;
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
}

/**
 * Validates HTTPS Image URL.
 * @param {string} url 
 * @returns {boolean}
 */
function isValidImageUrl(url) {
    if (!url) return true; // nullable field in products
    const trimmed = url.trim();
    if (!trimmed.startsWith('https://')) return false;
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Displays notification alert banner.
 * @param {string} message 
 * @param {'success'|'error'|'info'} type 
 */
function showNotification(message, type = 'info') {
    const box = document.getElementById('product-notification-box');
    const text = document.getElementById('product-notification-text');
    if (!box || !text) return;

    box.className = `admin-alert-banner alert-${type}`;
    text.textContent = message;
    box.style.display = 'flex';

    if (type !== 'error') {
        setTimeout(() => {
            box.style.display = 'none';
        }, 5000);
    }
}

/**
 * Hides notification alert banner.
 */
function hideNotification() {
    const box = document.getElementById('product-notification-box');
    if (box) box.style.display = 'none';
}

/**
 * Updates summary stats bar.
 */
function updateStatsBar() {
    const totalEl = document.getElementById('stat-total-products');
    const publishedEl = document.getElementById('stat-published-products');
    const draftEl = document.getElementById('stat-draft-products');

    const total = productsData.length;
    const published = productsData.filter(p => p.is_published).length;
    const drafts = total - published;

    if (totalEl) totalEl.textContent = total;
    if (publishedEl) publishedEl.textContent = published;
    if (draftEl) draftEl.textContent = drafts;
}

/**
 * Loads categories for product category selector and filter dropdowns.
 */
export async function loadCategoriesForProducts() {
    if (!isConfigured()) return;
    try {
        const supabase = await getSupabase();
        if (!supabase) return;

        const { data, error } = await supabase
            .from('categories')
            .select('id, name, is_published')
            .order('display_order', { ascending: true });

        if (!error && data) {
            categoriesList = data;
            populateCategoryDropdowns();
        }
    } catch (err) {
        console.warn('[Admin Products] Failed to preload categories:', err.message);
    }
}

/**
 * Populates category dropdown options in filter bar and product modal.
 */
function populateCategoryDropdowns() {
    const filterSelect = document.getElementById('products-category-filter');
    const formSelect = document.getElementById('product-field-category-id');

    if (filterSelect) {
        const currentVal = filterSelect.value;
        filterSelect.innerHTML = `
            <option value="all">All Categories</option>
            ${categoriesList.map(c => `
                <option value="${c.id}" ${currentVal === c.id ? 'selected' : ''}>
                    ${escapeHtml(c.name)}${c.is_published ? '' : ' (Draft)'}
                </option>
            `).join('')}
        `;
    }

    if (formSelect) {
        const currentFormVal = formSelect.value;
        formSelect.innerHTML = `
            <option value="">-- Select a Category --</option>
            ${categoriesList.map(c => `
                <option value="${c.id}" ${currentFormVal === c.id ? 'selected' : ''}>
                    ${escapeHtml(c.name)}${c.is_published ? '' : ' (Draft)'}
                </option>
            `).join('')}
        `;
    }
}

/**
 * Fetches products from Supabase database with resolved category names.
 */
export async function loadProducts() {
    const container = document.getElementById('products-list-container');
    if (!container) return;

    if (!isConfigured()) {
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">⚙️</div>
                <h4 class="empty-state-title">Supabase Credentials Required</h4>
                <p class="empty-state-text">
                    Configure your live Supabase credentials in <code>js/config.js</code> to manage products.
                </p>
            </div>
        `;
        updateStatsBar();
        return;
    }

    container.innerHTML = `
        <div class="banners-loading-state">
            <div class="loader-spinner" style="margin: 0 auto 1rem;"></div>
            <p style="color: var(--charcoal-muted); font-size: 0.88rem;">Fetching product catalog from database...</p>
        </div>
    `;

    try {
        // Preload categories list
        await loadCategoriesForProducts();

        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client could not be initialized.');

        // Fetch products with joined category name
        const { data: products, error } = await supabase
            .from('products')
            .select('*, categories(id, name, slug)')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;

        productsData = products || [];
        updateStatsBar();
        renderProductsList();

    } catch (err) {
        console.error('[Admin Products] Error fetching products:', err.message);
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h4 class="empty-state-title">Unable to Load Products</h4>
                <p class="empty-state-text">${escapeHtml(err.message)}</p>
                <button type="button" class="btn btn-secondary" id="btn-retry-products">Retry Loading</button>
            </div>
        `;
        const retryBtn = document.getElementById('btn-retry-products');
        if (retryBtn) retryBtn.addEventListener('click', loadProducts);
    }
}

/**
 * Filters products based on search query, category, and publication status.
 */
function getFilteredProducts() {
    const searchInput = document.getElementById('products-search-input');
    const categoryFilter = document.getElementById('products-category-filter');
    const statusFilter = document.getElementById('products-status-filter');

    const query = (searchInput?.value || '').toLowerCase().trim();
    const categoryId = categoryFilter?.value || 'all';
    const status = statusFilter?.value || 'all';

    return productsData.filter(p => {
        // Category filter
        if (categoryId !== 'all' && p.category_id !== categoryId) return false;

        // Status filter
        if (status === 'published' && !p.is_published) return false;
        if (status === 'draft' && p.is_published) return false;

        // Search filter
        if (query) {
            const matchName = (p.name || '').toLowerCase().includes(query);
            const matchSlug = (p.slug || '').toLowerCase().includes(query);
            const matchShort = (p.short_description || '').toLowerCase().includes(query);
            const matchCategory = (p.categories?.name || '').toLowerCase().includes(query);
            return matchName || matchSlug || matchShort || matchCategory;
        }

        return true;
    });
}

/**
 * Renders products list or empty state.
 */
export function renderProductsList() {
    const container = document.getElementById('products-list-container');
    if (!container) return;

    const filtered = getFilteredProducts();

    if (productsData.length === 0) {
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">🪑</div>
                <h4 class="empty-state-title">No Products in Catalog</h4>
                <p class="empty-state-text">
                    Add handcrafted custom furniture pieces, office workstations, reception counters, or institutional desks.
                </p>
                <button type="button" class="btn btn-primary" id="btn-empty-add-product">
                    + Add Your First Product
                </button>
            </div>
        `;
        const emptyBtn = document.getElementById('btn-empty-add-product');
        if (emptyBtn) emptyBtn.addEventListener('click', () => openProductModal(null));
        return;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">🔍</div>
                <h4 class="empty-state-title">No Matching Products</h4>
                <p class="empty-state-text">No products match your active search, category, and status filters.</p>
                <button type="button" class="btn btn-secondary" id="btn-clear-product-filters">Clear Filters</button>
            </div>
        `;
        const clearBtn = document.getElementById('btn-clear-product-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const searchInput = document.getElementById('products-search-input');
                const catFilter = document.getElementById('products-category-filter');
                const statFilter = document.getElementById('products-status-filter');
                if (searchInput) searchInput.value = '';
                if (catFilter) catFilter.value = 'all';
                if (statFilter) statFilter.value = 'all';
                renderProductsList();
            });
        }
        return;
    }

    container.innerHTML = `
        <div class="banners-grid">
            ${filtered.map(p => {
                const catName = p.categories?.name || 'Uncategorized';
                const galleryCount = Array.isArray(p.gallery_images) ? p.gallery_images.length : 0;
                const specKeys = p.specifications && typeof p.specifications === 'object' ? Object.keys(p.specifications) : [];

                return `
                    <div class="banner-card" data-id="${p.id}">
                        <div class="banner-card-media">
                            <img src="${escapeHtml(p.image_url || '../images/hero/hero_furniture.png')}" 
                                 alt="${escapeHtml(p.name)}" 
                                 class="banner-card-thumb"
                                 loading="lazy"
                                 onerror="this.src='../images/hero/hero_furniture.png';">
                            <div class="banner-card-badges">
                                <span class="${p.is_published ? 'badge-published' : 'badge-draft'}">
                                    ${p.is_published ? '● Live' : '○ Draft'}
                                </span>
                                <span class="badge-order">Order #${p.display_order}</span>
                            </div>
                        </div>

                        <div class="banner-card-body">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; gap: 0.5rem;">
                                <span class="badge-category">📁 ${escapeHtml(catName)}</span>
                                ${galleryCount > 0 ? `
                                    <span class="badge-count" title="${galleryCount} additional gallery image(s)">
                                        🖼️ +${galleryCount}
                                    </span>
                                ` : ''}
                            </div>

                            <h4 class="banner-card-title">${escapeHtml(p.name)}</h4>
                            <span class="slug-preview-text">/${escapeHtml(p.slug)}</span>

                            <p class="banner-card-subtitle" style="margin-top: 0.5rem;">
                                ${escapeHtml(p.short_description || p.description || 'No description provided.')}
                            </p>

                            <!-- Specifications Preview Chips -->
                            ${specKeys.length > 0 ? `
                                <div class="banner-card-meta">
                                    ${specKeys.slice(0, 3).map(k => `
                                        <span class="meta-chip" title="${escapeHtml(k)}: ${escapeHtml(p.specifications[k])}">
                                            <strong>${escapeHtml(k)}:</strong> ${escapeHtml(p.specifications[k])}
                                        </span>
                                    `).join('')}
                                    ${specKeys.length > 3 ? `<span class="meta-chip">+${specKeys.length - 3} more</span>` : ''}
                                </div>
                            ` : ''}

                            <div class="banner-card-actions">
                                <button type="button" class="btn-action-icon btn-toggle-prod-publish ${p.is_published ? 'is-published' : 'is-draft'}" data-id="${p.id}" title="${p.is_published ? 'Click to Unpublish' : 'Click to Publish'}">
                                    ${p.is_published ? `
                                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                        <span>Live (Unpublish)</span>
                                    ` : `
                                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                        <span>Draft (Publish)</span>
                                    `}
                                </button>
                                <button type="button" class="btn-action-icon btn-prod-move-up" data-id="${p.id}" title="Move Order Up" aria-label="Move Order Up">
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                                    <span>Up</span>
                                </button>
                                <button type="button" class="btn-action-icon btn-prod-move-down" data-id="${p.id}" title="Move Order Down" aria-label="Move Order Down">
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                                    <span>Down</span>
                                </button>
                                <button type="button" class="btn-action-icon btn-edit-product" data-id="${p.id}" title="Edit Product">
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    <span>Edit</span>
                                </button>
                                <button type="button" class="btn-action-icon danger btn-delete-product" data-id="${p.id}" title="Delete Product">
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    attachProductCardListeners();
}

/**
 * Attaches event listeners to rendered product cards.
 */
function attachProductCardListeners() {
    // Publish Toggle
    document.querySelectorAll('.btn-toggle-prod-publish').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const prod = productsData.find(p => p.id === id);
            if (prod) await toggleProductPublish(prod);
        });
    });

    // Move Up
    document.querySelectorAll('.btn-prod-move-up').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const prod = productsData.find(p => p.id === id);
            if (prod && prod.display_order > 0) {
                await updateProductOrder(prod.id, prod.display_order - 1);
            }
        });
    });

    // Move Down
    document.querySelectorAll('.btn-prod-move-down').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const prod = productsData.find(p => p.id === id);
            if (prod) {
                await updateProductOrder(prod.id, prod.display_order + 1);
            }
        });
    });

    // Edit Product
    document.querySelectorAll('.btn-edit-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const prod = productsData.find(p => p.id === id);
            if (prod) openProductModal(prod);
        });
    });

    // Delete Product
    document.querySelectorAll('.btn-delete-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const prod = productsData.find(p => p.id === id);
            if (prod) openDeleteProductModal(prod);
        });
    });
}

/**
 * Toggles a product's published status in Supabase.
 * @param {object} prod 
 */
async function toggleProductPublish(prod) {
    try {
        const supabase = await getSupabase();
        const newStatus = !prod.is_published;

        const { error } = await supabase
            .from('products')
            .update({ 
                is_published: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', prod.id);

        if (error) throw error;

        prod.is_published = newStatus;
        updateStatsBar();
        renderProductsList();
        showNotification(
            `Product "${prod.name}" is now ${newStatus ? 'Published (Live)' : 'Draft (Hidden)'}.`,
            'success'
        );

        // Notify dependent modules and overview dashboard
        window.dispatchEvent(new CustomEvent('admin:product-changed', { detail: { action: 'toggle_publish', productId: prod.id } }));
        window.dispatchEvent(new CustomEvent('admin:data-changed'));
    } catch (err) {
        console.error('[Admin Products] Error toggling publish status:', err.message);
        showNotification(`Failed to update publish status: ${err.message}`, 'error');
    }
}

/**
 * Updates a product's display order.
 * @param {string} prodId 
 * @param {number} newOrder 
 */
async function updateProductOrder(prodId, newOrder) {
    if (newOrder < 0) newOrder = 0;
    try {
        const supabase = await getSupabase();
        const { error } = await supabase
            .from('products')
            .update({ 
                display_order: newOrder,
                updated_at: new Date().toISOString()
            })
            .eq('id', prodId);

        if (error) throw error;

        await loadProducts();
        showNotification(`Product order updated to #${newOrder}.`, 'success');

        // Notify dependent modules and overview dashboard
        window.dispatchEvent(new CustomEvent('admin:product-changed', { detail: { action: 'reorder', productId: prodId } }));
        window.dispatchEvent(new CustomEvent('admin:data-changed'));
    } catch (err) {
        console.error('[Admin Products] Error updating order:', err.message);
        showNotification(`Failed to update order: ${err.message}`, 'error');
    }
}


/**
 * Renders gallery images builder rows inside the product modal.
 */
function renderGalleryBuilder() {
    const container = document.getElementById('product-gallery-thumbs-grid');
    if (!container) return;

    if (activeGalleryItems.length === 0) {
        container.innerHTML = `
            <div class="gallery-empty-hint">
                <span>No additional gallery photos added yet. Tap "Choose Photos from Device" below.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = activeGalleryItems.map((item, idx) => {
        const displaySrc = item.objectUrl || item.url || '../images/hero/hero_furniture.png';
        const label = item.isNewFile ? 'New Photo' : 'Gallery Photo';
        return `
            <div class="gallery-thumb-chip" data-idx="${idx}">
                <img src="${escapeHtml(displaySrc)}" class="gallery-chip-img" alt="${label} ${idx + 1}" onerror="this.src='../images/hero/hero_furniture.png';">
                <button type="button" class="btn-remove-gallery-chip" data-idx="${idx}" title="Remove photo" aria-label="Remove photo ${idx + 1}">✕</button>
            </div>
        `;
    }).join('');

    // Attach listeners
    container.querySelectorAll('.btn-remove-gallery-chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
            activeGalleryItems.splice(idx, 1);
            renderGalleryBuilder();
        });
    });
}

/**
 * Renders specifications builder rows inside the product modal.
 */
function renderSpecificationsBuilder() {
    const container = document.getElementById('product-specs-rows-container');
    if (!container) return;

    if (activeSpecifications.length === 0) {
        container.innerHTML = `
            <p style="font-size: 0.78rem; color: var(--charcoal-muted); text-align: center; padding: 0.5rem;">
                No specifications defined yet. Click presets or "+ Add Specification" below.
            </p>
        `;
        return;
    }

    container.innerHTML = activeSpecifications.map((spec, idx) => `
        <div class="dynamic-row" data-idx="${idx}">
            <input type="text" 
                   class="spec-key-input" 
                   data-idx="${idx}" 
                   placeholder="e.g. Material" 
                   value="${escapeHtml(spec.key)}">
            <input type="text" 
                   class="spec-val-input" 
                   data-idx="${idx}" 
                   placeholder="e.g. Teak Wood" 
                   value="${escapeHtml(spec.value)}">
            <button type="button" class="btn-row-remove btn-remove-spec-row" data-idx="${idx}" title="Remove specification">&times;</button>
        </div>
    `).join('');

    // Attach listeners
    container.querySelectorAll('.spec-key-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
            const idx = parseInt(e.target.getAttribute('data-idx'), 10);
            activeSpecifications[idx].key = e.target.value;
        });
    });

    container.querySelectorAll('.spec-val-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
            const idx = parseInt(e.target.getAttribute('data-idx'), 10);
            activeSpecifications[idx].value = e.target.value;
        });
    });

    container.querySelectorAll('.btn-remove-spec-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
            activeSpecifications.splice(idx, 1);
            renderSpecificationsBuilder();
        });
    });
}

/**
 * Adds a specification preset.
 * @param {string} keyName 
 */
function addSpecificationPreset(keyName) {
    const exists = activeSpecifications.some(s => s.key.toLowerCase() === keyName.toLowerCase());
    if (exists) {
        showNotification(`Specification "${keyName}" already added.`, 'info');
        return;
    }
    activeSpecifications.push({ key: keyName, value: '' });
    renderSpecificationsBuilder();
}

/**
 * Opens Add / Edit Product modal.
 * @param {object|null} product 
 */
async function openProductModal(product = null) {
    const modal = document.getElementById('product-form-modal');
    const form = document.getElementById('product-editor-form');
    const titleEl = document.getElementById('product-modal-title');
    const errorEl = document.getElementById('product-form-error');
    const slugPreview = document.getElementById('product-slug-preview');
    const slugCustomWrap = document.getElementById('product-custom-slug-wrap');

    if (!modal || !form) return;

    form.reset();
    slugManuallyEdited = false;
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
    if (slugCustomWrap) slugCustomWrap.style.display = 'none';

    // Always fetch latest categories from database before opening modal
    await loadCategoriesForProducts();
    populateCategoryDropdowns();

    // Ensure uploader instance
    ensureProductCoverUploader();

    if (product) {
        editingProductId = product.id;
        if (titleEl) titleEl.textContent = 'Edit Product';

        document.getElementById('product-field-id').value = product.id;
        document.getElementById('product-field-category-id').value = product.category_id || '';
        document.getElementById('product-field-name').value = product.name || '';
        document.getElementById('product-field-slug').value = product.slug || '';
        document.getElementById('product-field-short-desc').value = product.short_description || '';
        document.getElementById('product-field-desc').value = product.description || '';
        document.getElementById('product-field-image-url').value = product.image_url || '';
        document.getElementById('product-field-display-order').value = product.display_order ?? 0;
        document.getElementById('product-field-is-published').checked = Boolean(prodIsPublished(product));

        if (slugPreview) slugPreview.textContent = product.slug ? `/${product.slug}` : 'auto-generated';

        // Unpack gallery images array safely
        activeGalleryItems = (Array.isArray(product.gallery_images) ? product.gallery_images : []).map(url => ({
            url,
            isNewFile: false
        }));

        // Unpack specifications object safely into key-value array
        activeSpecifications = [];
        if (product.specifications && typeof product.specifications === 'object') {
            for (const [key, value] of Object.entries(product.specifications)) {
                activeSpecifications.push({ key, value: String(value) });
            }
        }

        if (productCoverUploader) {
            productCoverUploader.setInitialUrl(product.image_url || '');
        }
    } else {
        editingProductId = null;
        if (titleEl) titleEl.textContent = 'Add New Product';

        document.getElementById('product-field-id').value = '';
        const maxOrder = productsData.reduce((max, p) => Math.max(max, p.display_order || 0), -1);
        document.getElementById('product-field-display-order').value = maxOrder + 1;
        document.getElementById('product-field-is-published').checked = true;

        if (slugPreview) slugPreview.textContent = 'auto-generated';

        activeGalleryItems = [];
        activeSpecifications = [
            { key: 'Material', value: '' },
            { key: 'Dimensions', value: '' }
        ];

        if (productCoverUploader) {
            productCoverUploader.setInitialUrl('');
        }
    }

    renderGalleryBuilder();
    renderSpecificationsBuilder();

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function ensureProductCoverUploader() {
    if (!productCoverUploader) {
        productCoverUploader = setupImageUploader({
            dropzoneEl: document.getElementById('product-dropzone'),
            fileInputEl: document.getElementById('product-file-input'),
            previewImgEl: document.getElementById('product-preview-img'),
            previewWrapEl: document.getElementById('product-preview-wrap'),
            placeholderEl: document.getElementById('product-dropzone-placeholder'),
            clearBtnEl: document.getElementById('product-clear-image-btn'),
            urlFallbackInputEl: document.getElementById('product-field-image-url'),
            fallbackToggleBtnEl: document.getElementById('product-fallback-toggle-btn'),
            fallbackWrapEl: document.getElementById('product-fallback-wrap'),
            folder: 'products'
        });
    }
}

function prodIsPublished(product) {
    return product.is_published !== undefined ? product.is_published : true;
}

/**
 * Closes Product modal.
 */
function closeProductModal() {
    const modal = document.getElementById('product-form-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    if (productCoverUploader) {
        productCoverUploader.reset();
    }
    editingProductId = null;
}

/**
 * Opens Delete Confirmation modal for a product.
 * @param {object} product 
 */
function openDeleteProductModal(product) {
    deletingProduct = product;
    const modal = document.getElementById('product-delete-modal');
    const titleEl = document.getElementById('delete-product-name');
    const catEl = document.getElementById('delete-product-category');
    const thumbEl = document.getElementById('delete-product-thumb');

    if (!modal) return;

    if (titleEl) titleEl.textContent = product.name;
    if (catEl) catEl.textContent = `Category: ${product.categories?.name || 'Uncategorized'}`;
    if (thumbEl) {
        thumbEl.src = product.image_url || '../images/hero/hero_furniture.png';
        thumbEl.onerror = () => { thumbEl.src = '../images/hero/hero_furniture.png'; };
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Closes Delete Product modal.
 */
function closeDeleteProductModal() {
    const modal = document.getElementById('product-delete-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    deletingProduct = null;
}

/**
 * Submits Add or Edit Product form.
 * @param {Event} e 
 */
async function handleProductFormSubmit(e) {
    e.preventDefault();

    const errorEl = document.getElementById('product-form-error');
    const saveBtn = document.getElementById('btn-save-product');
    const saveBtnText = document.getElementById('btn-save-product-text');

    function showError(msg) {
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
        }
    }

    if (errorEl) errorEl.style.display = 'none';

    // 01. Extract and sanitize inputs
    const categoryId = document.getElementById('product-field-category-id')?.value;
    const name = document.getElementById('product-field-name')?.value?.trim();
    let slug = document.getElementById('product-field-slug')?.value?.trim().toLowerCase();
    const shortDesc = document.getElementById('product-field-short-desc')?.value?.trim() || null;
    const desc = document.getElementById('product-field-desc')?.value?.trim() || null;
    const displayOrderInput = document.getElementById('product-field-display-order')?.value;
    const isPublished = Boolean(document.getElementById('product-field-is-published')?.checked);

    // 02. Validations
    if (!categoryId) {
        showError('Please select a category for this product.');
        return;
    }

    if (!name || name.length < 2) {
        showError('Product name is required and must be at least 2 characters.');
        return;
    }

    if (!slug) {
        slug = slugify(name);
    }
    if (!isValidSlug(slug)) {
        showError('Slug must contain only lowercase alphanumeric characters and hyphens (e.g. modular-office-desk).');
        return;
    }

    // Auto-resolve slug collision by appending increment suffix
    let candidateSlug = slug;
    let counter = 2;
    while (productsData.some(p => p.slug === candidateSlug && p.id !== editingProductId)) {
        candidateSlug = `${slug}-${counter}`;
        counter++;
    }
    slug = candidateSlug;

    const displayOrder = parseInt(displayOrderInput, 10);
    if (isNaN(displayOrder) || displayOrder < 0) {
        showError('Display order must be an integer 0 or greater.');
        return;
    }

    // 03. Format JSONB specifications object
    const cleanSpecifications = {};
    for (const s of activeSpecifications) {
        const k = s.key?.trim();
        const v = s.value?.trim();
        if (k && v) {
            cleanSpecifications[k] = v;
        }
    }

    // 04. Upload / Resolve images
    try {
        if (saveBtn) saveBtn.disabled = true;
        if (saveBtnText) saveBtnText.textContent = 'Saving...';

        ensureProductCoverUploader();
        let finalCoverUrl = '';
        try {
            finalCoverUrl = await productCoverUploader.resolveFinalUrl();
        } catch (uploadErr) {
            showError(uploadErr.message || 'Failed to upload cover photo.');
            if (saveBtn) saveBtn.disabled = false;
            if (saveBtnText) saveBtnText.textContent = 'Save Product';
            return;
        }

        // Upload any newly selected gallery photos
        const finalGalleryUrls = [];
        for (const item of activeGalleryItems) {
            if (item.isNewFile && item.file) {
                try {
                    const uploadedUrl = await uploadImageToStorage(item.file, 'products');
                    finalGalleryUrls.push(uploadedUrl);
                } catch (gErr) {
                    showError(`Gallery photo "${item.file.name}" upload failed: ${gErr.message}`);
                    if (saveBtn) saveBtn.disabled = false;
                    if (saveBtnText) saveBtnText.textContent = 'Save Product';
                    return;
                }
            } else if (item.url && item.url.trim()) {
                finalGalleryUrls.push(item.url.trim());
            }
        }

        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client is not available.');

        const payload = {
            category_id: categoryId,
            name,
            slug,
            short_description: shortDesc,
            description: desc,
            image_url: finalCoverUrl || null,
            gallery_images: finalGalleryUrls,
            specifications: cleanSpecifications,
            display_order: displayOrder,
            is_published: isPublished
        };

        if (editingProductId) {
            payload.updated_at = new Date().toISOString();
            const { error } = await supabase
                .from('products')
                .update(payload)
                .eq('id', editingProductId);

            if (error) {
                if (error.code === '23505') {
                    throw new Error(`The slug "${slug}" is already taken by another product.`);
                }
                throw error;
            }
            showNotification(`Product "${name}" successfully updated.`, 'success');
        } else {
            const { error } = await supabase
                .from('products')
                .insert([payload]);

            if (error) {
                if (error.code === '23505') {
                    throw new Error(`The slug "${slug}" already exists. Please choose a unique product slug.`);
                }
                throw error;
            }
            showNotification(`New product "${name}" added to catalog.`, 'success');
        }

        closeProductModal();
        await loadProducts();

        // Notify dependent modules (Categories count, Overview cards)
        window.dispatchEvent(new CustomEvent('admin:product-changed', { 
            detail: { action: editingProductId ? 'updated' : 'created' } 
        }));
        window.dispatchEvent(new CustomEvent('admin:data-changed'));
    } catch (err) {
        console.error('[Admin Products] Save error:', err.message);
        showError(err.message);
    } finally {
        if (saveBtn) saveBtn.disabled = false;
        if (saveBtnText) saveBtnText.textContent = 'Save Product';
    }
}

/**
 * Handles confirmed deletion of a product.
 */
async function handleConfirmDeleteProduct() {
    if (!deletingProduct) return;

    const confirmBtn = document.getElementById('btn-confirm-delete-product');
    const confirmBtnText = document.getElementById('btn-confirm-delete-prod-text');

    try {
        if (confirmBtn) confirmBtn.disabled = true;
        if (confirmBtnText) confirmBtnText.textContent = 'Deleting...';

        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client is not available.');

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', deletingProduct.id);

        if (error) throw error;

        showNotification(`Product "${deletingProduct.name}" permanently deleted.`, 'success');
        closeDeleteProductModal();
        await loadProducts();

        // Notify dependent modules (Categories count, Overview cards)
        window.dispatchEvent(new CustomEvent('admin:product-changed', { 
            detail: { action: 'deleted', productId: deletingProduct?.id } 
        }));
        window.dispatchEvent(new CustomEvent('admin:data-changed'));
    } catch (err) {
        console.error('[Admin Products] Delete error:', err.message);
        showNotification(`Failed to delete product: ${err.message}`, 'error');
    } finally {
        if (confirmBtn) confirmBtn.disabled = false;
        if (confirmBtnText) confirmBtnText.textContent = 'Delete Product';
    }
}

/**
 * Initializes Product Catalog module listeners and triggers initial fetch.
 */
export function initProductsModule() {
    // 01. Refresh
    const refreshBtn = document.getElementById('btn-refresh-products');
    if (refreshBtn) refreshBtn.addEventListener('click', loadProducts);

    // 02. Add Product button
    const addBtn = document.getElementById('btn-open-add-product-modal');
    if (addBtn) addBtn.addEventListener('click', () => openProductModal(null));

    // 03. Close Add/Edit Modal
    const closeBtn = document.getElementById('btn-close-product-modal');
    const cancelBtn = document.getElementById('btn-cancel-product-modal');
    const backdrop = document.getElementById('product-modal-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeProductModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeProductModal);
    if (backdrop) backdrop.addEventListener('click', closeProductModal);

    // 04. Close Delete Modal
    const closeDelBtn = document.getElementById('btn-close-prod-del-modal');
    const cancelDelBtn = document.getElementById('btn-cancel-prod-del-modal');
    const delBackdrop = document.getElementById('product-del-modal-backdrop');
    const confirmDelBtn = document.getElementById('btn-confirm-delete-product');
    if (closeDelBtn) closeDelBtn.addEventListener('click', closeDeleteProductModal);
    if (cancelDelBtn) cancelDelBtn.addEventListener('click', closeDeleteProductModal);
    if (delBackdrop) delBackdrop.addEventListener('click', closeDeleteProductModal);
    if (confirmDelBtn) confirmDelBtn.addEventListener('click', handleConfirmDeleteProduct);

    // 05. Auto-Slug Generation on Name typing & Edit slug toggle
    const nameInput = document.getElementById('product-field-name');
    const slugInput = document.getElementById('product-field-slug');
    const slugPreview = document.getElementById('product-slug-preview');
    const toggleSlugBtn = document.getElementById('btn-toggle-product-custom-slug');
    const customSlugWrap = document.getElementById('product-custom-slug-wrap');

    if (nameInput && slugInput) {
        nameInput.addEventListener('input', () => {
            if (!slugManuallyEdited && !editingProductId) {
                const s = slugify(nameInput.value);
                slugInput.value = s;
                if (slugPreview) slugPreview.textContent = s ? `/${s}` : 'auto-generated';
            }
        });
        slugInput.addEventListener('input', () => {
            slugManuallyEdited = true;
            if (slugPreview) slugPreview.textContent = slugInput.value ? `/${slugInput.value}` : 'auto-generated';
        });
    }

    if (toggleSlugBtn && customSlugWrap) {
        toggleSlugBtn.addEventListener('click', () => {
            const isHidden = customSlugWrap.style.display === 'none';
            customSlugWrap.style.display = isHidden ? 'block' : 'none';
            toggleSlugBtn.textContent = isHidden ? 'Hide custom slug' : 'Edit slug';
            if (isHidden && slugInput) slugInput.focus();
        });
    }

    // 06. Ensure Cover Uploader
    ensureProductCoverUploader();

    // 07. Gallery Device Upload Picker
    const addGalleryFileBtn = document.getElementById('btn-add-gallery-file');
    const galleryFileInput = document.getElementById('product-gallery-file-input');
    if (addGalleryFileBtn && galleryFileInput) {
        addGalleryFileBtn.addEventListener('click', () => {
            galleryFileInput.click();
        });
        galleryFileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files || []);
            for (const file of files) {
                const check = validateImageFile(file);
                if (!check.valid) {
                    showNotification(check.error, 'error');
                    continue;
                }
                activeGalleryItems.push({
                    file,
                    objectUrl: URL.createObjectURL(file),
                    isNewFile: true
                });
            }
            galleryFileInput.value = '';
            renderGalleryBuilder();
        });
    }

    // 08. Gallery Fallback URL Toggle & Submit
    const toggleGalleryUrlBtn = document.getElementById('btn-toggle-gallery-url-input');
    const galleryUrlWrap = document.getElementById('product-gallery-url-wrap');
    const submitGalleryUrlBtn = document.getElementById('btn-submit-gallery-url');
    const galleryUrlField = document.getElementById('product-gallery-url-field');

    if (toggleGalleryUrlBtn && galleryUrlWrap) {
        toggleGalleryUrlBtn.addEventListener('click', () => {
            const isHidden = galleryUrlWrap.style.display === 'none';
            galleryUrlWrap.style.display = isHidden ? 'block' : 'none';
            if (isHidden && galleryUrlField) galleryUrlField.focus();
        });
    }

    if (submitGalleryUrlBtn && galleryUrlField) {
        submitGalleryUrlBtn.addEventListener('click', () => {
            const val = galleryUrlField.value.trim();
            if (!val) return;
            if (!val.startsWith('https://')) {
                showNotification('Gallery photo URL must start with https://', 'error');
                return;
            }
            activeGalleryItems.push({
                url: val,
                isNewFile: false
            });
            galleryUrlField.value = '';
            renderGalleryBuilder();
        });
    }

    // 09. Specifications Builder
    const addSpecBtn = document.getElementById('btn-add-spec-row');
    if (addSpecBtn) {
        addSpecBtn.addEventListener('click', () => {
            activeSpecifications.push({ key: '', value: '' });
            renderSpecificationsBuilder();
        });
    }

    // 10. Preset Buttons for Specifications
    document.querySelectorAll('.btn-preset-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            const keyName = e.currentTarget.getAttribute('data-preset');
            if (keyName) addSpecificationPreset(keyName);
        });
    });

    // 11. Form Submit
    const form = document.getElementById('product-editor-form');
    if (form) form.addEventListener('submit', handleProductFormSubmit);

    // 12. Search and Filter listeners
    const searchInput = document.getElementById('products-search-input');
    const catFilter = document.getElementById('products-category-filter');
    const statFilter = document.getElementById('products-status-filter');
    if (searchInput) searchInput.addEventListener('input', renderProductsList);
    if (catFilter) catFilter.addEventListener('change', renderProductsList);
    if (statFilter) statFilter.addEventListener('change', renderProductsList);

    // 13. Notification Close
    const notifClose = document.getElementById('btn-close-product-notification');
    if (notifClose) notifClose.addEventListener('click', hideNotification);

    // 14. Reactive synchronization: update category dropdowns, filter & fresh products when categories change
    window.addEventListener('admin:category-changed', async () => {
        await loadCategoriesForProducts();
        await loadProducts();
    });

    // 15. Initial load
    loadProducts();
}

