/**
 * SAI INDIRABALA FURNITURE - ADMIN CATEGORY MANAGEMENT MODULE
 * Full CRUD, slug validation, order shifting, publish toggling, and ON DELETE RESTRICT protection.
 * Strictly adheres to public.categories database schema and RLS policies.
 */

import { getSupabase, isConfigured } from './adminClient.js';

// Module State
let categoriesData = [];
let editingCategoryId = null;
let deletingCategory = null;
let previewDebounceTimer = null;
let slugManuallyEdited = false;

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
 * Generates a URL-friendly lowercase slug from a name string.
 * Enforces schema regex: ^[a-z0-9]+(?:-[a-z0-9]+)*$
 * @param {string} text 
 * @returns {string}
 */
export function slugify(text) {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-')   // Replace spaces and non-word chars with hyphen
        .replace(/^-+|-+$/g, '');     // Trim leading and trailing hyphens
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
    if (!url) return true; // nullable field in categories
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
    const box = document.getElementById('category-notification-box');
    const text = document.getElementById('category-notification-text');
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
    const box = document.getElementById('category-notification-box');
    if (box) box.style.display = 'none';
}

/**
 * Updates summary stats bar.
 */
function updateStatsBar() {
    const totalEl = document.getElementById('stat-total-categories');
    const publishedEl = document.getElementById('stat-published-categories');
    const draftEl = document.getElementById('stat-draft-categories');

    const total = categoriesData.length;
    const published = categoriesData.filter(c => c.is_published).length;
    const drafts = total - published;

    if (totalEl) totalEl.textContent = total;
    if (publishedEl) publishedEl.textContent = published;
    if (draftEl) draftEl.textContent = drafts;
}

/**
 * Fetches categories along with dependent product counts from Supabase.
 */
export async function loadCategories() {
    const container = document.getElementById('categories-list-container');
    if (!container) return;

    if (!isConfigured()) {
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">⚙️</div>
                <h4 class="empty-state-title">Supabase Credentials Required</h4>
                <p class="empty-state-text">
                    Configure your live Supabase credentials in <code>js/config.js</code> to manage categories.
                </p>
            </div>
        `;
        updateStatsBar();
        return;
    }

    container.innerHTML = `
        <div class="banners-loading-state">
            <div class="loader-spinner" style="margin: 0 auto 1rem;"></div>
            <p style="color: var(--charcoal-muted); font-size: 0.88rem;">Fetching categories from database...</p>
        </div>
    `;

    try {
        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client could not be initialized.');

        // 01. Fetch categories
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (catError) throw catError;

        // 02. Fetch product counts grouped by category_id to enforce RESTRICT rules
        let countsMap = {};
        try {
            const { data: prodRows, error: prodError } = await supabase
                .from('products')
                .select('category_id');

            if (!prodError && prodRows) {
                prodRows.forEach(p => {
                    if (p.category_id) {
                        countsMap[p.category_id] = (countsMap[p.category_id] || 0) + 1;
                    }
                });
            }
        } catch (e) {
            console.warn('[Admin Categories] Product counts query skipped:', e.message);
        }

        // Attach product count to each category
        categoriesData = (categories || []).map(cat => ({
            ...cat,
            product_count: countsMap[cat.id] || 0
        }));

        updateStatsBar();
        renderCategoriesList();

    } catch (err) {
        console.error('[Admin Categories] Error fetching categories:', err.message);
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h4 class="empty-state-title">Unable to Load Categories</h4>
                <p class="empty-state-text">${escapeHtml(err.message)}</p>
                <button type="button" class="btn btn-secondary" id="btn-retry-categories">Retry Loading</button>
            </div>
        `;
        const retryBtn = document.getElementById('btn-retry-categories');
        if (retryBtn) retryBtn.addEventListener('click', loadCategories);
    }
}

/**
 * Filters categories by search query and publication status.
 */
function getFilteredCategories() {
    const searchInput = document.getElementById('categories-search-input');
    const statusFilter = document.getElementById('categories-status-filter');

    const query = (searchInput?.value || '').toLowerCase().trim();
    const status = statusFilter?.value || 'all';

    return categoriesData.filter(cat => {
        // Status filter
        if (status === 'published' && !cat.is_published) return false;
        if (status === 'draft' && cat.is_published) return false;

        // Search filter
        if (query) {
            const matchName = (cat.name || '').toLowerCase().includes(query);
            const matchSlug = (cat.slug || '').toLowerCase().includes(query);
            const matchDesc = (cat.description || '').toLowerCase().includes(query);
            return matchName || matchSlug || matchDesc;
        }

        return true;
    });
}

/**
 * Renders categories list into the container.
 */
export function renderCategoriesList() {
    const container = document.getElementById('categories-list-container');
    if (!container) return;

    const filtered = getFilteredCategories();

    if (categoriesData.length === 0) {
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">📁</div>
                <h4 class="empty-state-title">No Categories Found</h4>
                <p class="empty-state-text">
                    Organize your furniture and interior design catalog by adding categories (e.g. Office, Living Room, Modular Workstations).
                </p>
                <button type="button" class="btn btn-primary" id="btn-empty-add-category">
                    + Add Your First Category
                </button>
            </div>
        `;
        const emptyBtn = document.getElementById('btn-empty-add-category');
        if (emptyBtn) emptyBtn.addEventListener('click', () => openCategoryModal(null));
        return;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">🔍</div>
                <h4 class="empty-state-title">No Matching Categories</h4>
                <p class="empty-state-text">No categories match your active search and filter criteria.</p>
                <button type="button" class="btn btn-secondary" id="btn-clear-category-search">Clear Filters</button>
            </div>
        `;
        const clearBtn = document.getElementById('btn-clear-category-search');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const searchInput = document.getElementById('categories-search-input');
                const statusFilter = document.getElementById('categories-status-filter');
                if (searchInput) searchInput.value = '';
                if (statusFilter) statusFilter.value = 'all';
                renderCategoriesList();
            });
        }
        return;
    }

    container.innerHTML = `
        <div class="banners-grid">
            ${filtered.map(cat => `
                <div class="banner-card category-card" data-id="${cat.id}">
                    <div class="banner-card-body" style="padding: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <span class="${cat.is_published ? 'badge-published' : 'badge-draft'}">
                                    ${cat.is_published ? '● Live' : '○ Draft'}
                                </span>
                                <span class="badge-order">Order #${cat.display_order}</span>
                            </div>
                            <span class="badge-count" title="${cat.product_count} product(s) linked">
                                🪑 ${cat.product_count} ${cat.product_count === 1 ? 'Product' : 'Products'}
                            </span>
                        </div>

                        <h4 class="banner-card-title" style="font-size: 1.15rem; margin-bottom: 0.25rem;">${escapeHtml(cat.name)}</h4>
                        <span class="slug-preview-text">/${escapeHtml(cat.slug)}</span>

                        <p class="banner-card-subtitle" style="margin-top: 0.5rem;">
                            ${escapeHtml(cat.description || 'No catalog summary description set.')}
                        </p>

                        <div class="banner-card-actions">
                            <button type="button" class="btn-action-icon btn-toggle-cat-publish ${cat.is_published ? 'is-published' : 'is-draft'}" data-id="${cat.id}" title="${cat.is_published ? 'Click to Unpublish' : 'Click to Publish'}">
                                ${cat.is_published ? `
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    <span>Live (Unpublish)</span>
                                ` : `
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                    <span>Draft (Publish)</span>
                                `}
                            </button>
                            <button type="button" class="btn-action-icon btn-cat-move-up" data-id="${cat.id}" title="Move Order Up" aria-label="Move Order Up">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                                <span>Up</span>
                            </button>
                            <button type="button" class="btn-action-icon btn-cat-move-down" data-id="${cat.id}" title="Move Order Down" aria-label="Move Order Down">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                                <span>Down</span>
                            </button>
                            <button type="button" class="btn-action-icon btn-edit-category" data-id="${cat.id}" title="Edit Category">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                <span>Edit</span>
                            </button>
                            <button type="button" class="btn-action-icon danger btn-delete-category" data-id="${cat.id}" title="Delete Category">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    attachCategoryCardListeners();
}

/**
 * Attaches event listeners to rendered category cards.
 */
function attachCategoryCardListeners() {
    // Publish Toggle
    document.querySelectorAll('.btn-toggle-cat-publish').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const cat = categoriesData.find(c => c.id === id);
            if (cat) await toggleCategoryPublish(cat);
        });
    });

    // Move Up
    document.querySelectorAll('.btn-cat-move-up').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const cat = categoriesData.find(c => c.id === id);
            if (cat && cat.display_order > 0) {
                await updateCategoryOrder(cat.id, cat.display_order - 1);
            }
        });
    });

    // Move Down
    document.querySelectorAll('.btn-cat-move-down').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const cat = categoriesData.find(c => c.id === id);
            if (cat) {
                await updateCategoryOrder(cat.id, cat.display_order + 1);
            }
        });
    });

    // Edit
    document.querySelectorAll('.btn-edit-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const cat = categoriesData.find(c => c.id === id);
            if (cat) openCategoryModal(cat);
        });
    });

    // Delete
    document.querySelectorAll('.btn-delete-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const cat = categoriesData.find(c => c.id === id);
            if (cat) openDeleteCategoryModal(cat);
        });
    });
}

/**
 * Toggles a category's published status in Supabase.
 * @param {object} cat 
 */
async function toggleCategoryPublish(cat) {
    try {
        const supabase = await getSupabase();
        const newStatus = !cat.is_published;

        const { error } = await supabase
            .from('categories')
            .update({ 
                is_published: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', cat.id);

        if (error) throw error;

        cat.is_published = newStatus;
        updateStatsBar();
        renderCategoriesList();
        showNotification(
            `Category "${cat.name}" is now ${newStatus ? 'Published (Live)' : 'Draft (Hidden)'}.`,
            'success'
        );

        // Notify dependent modules and overview dashboard
        window.dispatchEvent(new CustomEvent('admin:category-changed', { detail: { action: 'toggle_publish', categoryId: cat.id } }));
        window.dispatchEvent(new CustomEvent('admin:data-changed'));
    } catch (err) {
        console.error('[Admin Categories] Error toggling publish status:', err.message);
        showNotification(`Failed to update publish status: ${err.message}`, 'error');
    }
}

/**
 * Updates a category's display order.
 * @param {string} catId 
 * @param {number} newOrder 
 */
async function updateCategoryOrder(catId, newOrder) {
    if (newOrder < 0) newOrder = 0;
    try {
        const supabase = await getSupabase();
        const { error } = await supabase
            .from('categories')
            .update({ 
                display_order: newOrder,
                updated_at: new Date().toISOString()
            })
            .eq('id', catId);

        if (error) throw error;

        await loadCategories();
        showNotification(`Category display order updated to #${newOrder}.`, 'success');

        // Notify dependent modules and overview dashboard
        window.dispatchEvent(new CustomEvent('admin:category-changed', { detail: { action: 'reorder', categoryId: catId } }));
        window.dispatchEvent(new CustomEvent('admin:data-changed'));
    } catch (err) {
        console.error('[Admin Categories] Error updating display order:', err.message);
        showNotification(`Failed to update order: ${err.message}`, 'error');
    }
}


/**
 * Opens Add / Edit Category modal.
 * @param {object|null} category 
 */
function openCategoryModal(category = null) {
    const modal = document.getElementById('category-form-modal');
    const form = document.getElementById('category-editor-form');
    const titleEl = document.getElementById('category-modal-title');
    const errorEl = document.getElementById('category-form-error');

    if (!modal || !form) return;

    form.reset();
    slugManuallyEdited = false;
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }

    const slugPreview = document.getElementById('category-slug-preview');
    const customSlugWrap = document.getElementById('category-custom-slug-wrap');
    if (customSlugWrap) customSlugWrap.style.display = 'none';

    if (category) {
        editingCategoryId = category.id;
        if (titleEl) titleEl.textContent = 'Edit Category';
        document.getElementById('category-field-id').value = category.id;
        document.getElementById('category-field-name').value = category.name || '';
        document.getElementById('category-field-slug').value = category.slug || '';
        if (slugPreview) slugPreview.textContent = category.slug || 'auto-generated';
        document.getElementById('category-field-description').value = category.description || '';
        document.getElementById('category-field-display-order').value = category.display_order ?? 0;
        document.getElementById('category-field-is-published').checked = Boolean(catIsPublished(category));
    } else {
        editingCategoryId = null;
        if (titleEl) titleEl.textContent = 'Add New Category';
        document.getElementById('category-field-id').value = '';
        if (slugPreview) slugPreview.textContent = 'auto-generated';
        const maxOrder = categoriesData.reduce((max, c) => Math.max(max, c.display_order || 0), -1);
        document.getElementById('category-field-display-order').value = maxOrder + 1;
        document.getElementById('category-field-is-published').checked = true;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function catIsPublished(category) {
    return category.is_published !== undefined ? category.is_published : true;
}

/**
 * Closes Category modal.
 */
function closeCategoryModal() {
    const modal = document.getElementById('category-form-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    editingCategoryId = null;
}

/**
 * Opens Delete Confirmation modal for a category.
 * Enforces foreign key ON DELETE RESTRICT checks!
 * @param {object} category 
 */
function openDeleteCategoryModal(category) {
    deletingCategory = category;
    const modal = document.getElementById('category-delete-modal');
    const titleEl = document.getElementById('delete-category-name');
    const thumbEl = document.getElementById('delete-category-thumb');
    const countEl = document.getElementById('delete-category-count');
    const warningBox = document.getElementById('delete-category-restrict-warning');
    const warningText = document.getElementById('delete-category-restrict-desc');
    const confirmBtn = document.getElementById('btn-confirm-delete-category');
    const manageProdsBtn = document.getElementById('btn-manage-cat-products');

    if (!modal) return;

    if (titleEl) titleEl.textContent = category.name;
    if (countEl) countEl.textContent = `${category.product_count} Product(s)`;
    if (thumbEl) {
        thumbEl.src = category.image_url || '../images/hero/hero_furniture.png';
        thumbEl.onerror = () => { thumbEl.src = '../images/hero/hero_furniture.png'; };
    }

    // ON DELETE RESTRICT ENFORCEMENT:
    if (category.product_count > 0) {
        if (warningBox) warningBox.style.display = 'flex';
        if (warningText) {
            warningText.textContent = `This category currently contains ${category.product_count} dependent product(s). Under the database foreign-key ON DELETE RESTRICT policy, you cannot delete a category until its associated products have been deleted or reassigned to another category.`;
        }
        if (confirmBtn) confirmBtn.style.display = 'none'; // Block deletion
        if (manageProdsBtn) manageProdsBtn.style.display = 'inline-flex';
    } else {
        if (warningBox) warningBox.style.display = 'none';
        if (confirmBtn) {
            confirmBtn.style.display = 'inline-flex';
            confirmBtn.disabled = false;
        }
        if (manageProdsBtn) manageProdsBtn.style.display = 'none';
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Closes Delete Category modal.
 */
function closeDeleteCategoryModal() {
    const modal = document.getElementById('category-delete-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    deletingCategory = null;
}

/**
 * Submits Add or Edit Category form.
 * @param {Event} e 
 */
async function handleCategoryFormSubmit(e) {
    e.preventDefault();

    const errorEl = document.getElementById('category-form-error');
    const saveBtn = document.getElementById('btn-save-category');
    const saveBtnText = document.getElementById('btn-save-category-text');

    function showError(msg) {
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
        }
    }

    if (errorEl) errorEl.style.display = 'none';

    const name = document.getElementById('category-field-name')?.value?.trim();
    let slug = document.getElementById('category-field-slug')?.value?.trim().toLowerCase();
    const description = document.getElementById('category-field-description')?.value?.trim() || null;
    const displayOrderInput = document.getElementById('category-field-display-order')?.value;
    const isPublished = Boolean(document.getElementById('category-field-is-published')?.checked);

    // Validation 01: Name
    if (!name || name.length < 2) {
        showError('Category name is required and must be at least 2 characters.');
        return;
    }

    // Validation 02: Slug auto-fill and collision resolution
    if (!slug) {
        slug = slugify(name);
    }
    if (!slugManuallyEdited && !editingCategoryId) {
        let baseSlug = slug;
        let counter = 1;
        while (categoriesData.some(c => c.slug === slug)) {
            slug = `${baseSlug}-${counter++}`;
        }
    }
    if (!isValidSlug(slug)) {
        showError('Slug must contain only lowercase alphanumeric characters and hyphens (e.g. office-furniture).');
        return;
    }

    // Validation 04: Display order
    const displayOrder = parseInt(displayOrderInput, 10);
    if (isNaN(displayOrder) || displayOrder < 0) {
        showError('Display order must be an integer 0 or greater.');
        if (saveBtn) saveBtn.disabled = false;
        if (saveBtnText) saveBtnText.textContent = 'Save Category';
        return;
    }

    // Validation 05: Check local duplicate slug before network call
    const isDuplicate = categoriesData.some(c => c.slug === slug && c.id !== editingCategoryId);
    if (isDuplicate) {
        showError(`A category with slug "${slug}" already exists. Please choose a distinct slug.`);
        if (saveBtn) saveBtn.disabled = false;
        if (saveBtnText) saveBtnText.textContent = 'Save Category';
        return;
    }

    try {
        if (saveBtn) saveBtn.disabled = true;
        if (saveBtnText) saveBtnText.textContent = 'Saving...';

        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client is not available.');

        const payload = {
            name,
            slug,
            description,
            display_order: displayOrder,
            is_published: isPublished
        };

        if (editingCategoryId) {
            payload.updated_at = new Date().toISOString();
            const { error } = await supabase
                .from('categories')
                .update(payload)
                .eq('id', editingCategoryId);

            if (error) {
                if (error.code === '23505') {
                    throw new Error(`The slug "${slug}" is already taken by another category.`);
                }
                throw error;
            }
            showNotification(`Category "${name}" successfully updated.`, 'success');
        } else {
            const { error } = await supabase
                .from('categories')
                .insert([payload]);

            if (error) {
                if (error.code === '23505') {
                    throw new Error(`The slug "${slug}" already exists. Please use a unique slug.`);
                }
                throw error;
            }
            showNotification(`New category "${name}" added successfully.`, 'success');
        }

        closeCategoryModal();
        await loadCategories();

        // Notify dependent modules (Products dropdowns, Overview cards)
        window.dispatchEvent(new CustomEvent('admin:category-changed', { 
            detail: { action: editingCategoryId ? 'updated' : 'created' } 
        }));
        window.dispatchEvent(new CustomEvent('admin:data-changed'));
    } catch (err) {
        console.error('[Admin Categories] Save error:', err.message);
        showError(err.message);
    } finally {
        if (saveBtn) saveBtn.disabled = false;
        if (saveBtnText) saveBtnText.textContent = 'Save Category';
    }
}

/**
 * Handles confirmed deletion of an empty category.
 */
async function handleConfirmDeleteCategory() {
    if (!deletingCategory) return;

    if (deletingCategory.product_count > 0) {
        showNotification(
            `Cannot delete: Category contains ${deletingCategory.product_count} dependent product(s). Foreign key RESTRICT rule active.`,
            'error'
        );
        return;
    }

    const confirmBtn = document.getElementById('btn-confirm-delete-category');
    const confirmBtnText = document.getElementById('btn-confirm-delete-cat-text');

    try {
        if (confirmBtn) confirmBtn.disabled = true;
        if (confirmBtnText) confirmBtnText.textContent = 'Deleting...';

        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client is not available.');

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', deletingCategory.id);

        if (error) {
            if (error.code === '23503') {
                throw new Error('Database foreign key violation: This category still has linked products and cannot be deleted.');
            }
            throw error;
        }

        showNotification(`Category "${deletingCategory.name}" permanently deleted.`, 'success');
        closeDeleteCategoryModal();
        await loadCategories();

        // Notify dependent modules (Products dropdowns, Overview cards)
        window.dispatchEvent(new CustomEvent('admin:category-changed', { 
            detail: { action: 'deleted', categoryId: deletingCategory?.id } 
        }));
        window.dispatchEvent(new CustomEvent('admin:data-changed'));
    } catch (err) {
        console.error('[Admin Categories] Delete error:', err.message);
        showNotification(`Failed to delete category: ${err.message}`, 'error');
    } finally {
        if (confirmBtn) confirmBtn.disabled = false;
        if (confirmBtnText) confirmBtnText.textContent = 'Delete Category';
    }
}

/**
 * Initializes Categories module listeners and triggers initial fetch.
 */
export function initCategoriesModule() {
    // 01. Refresh
    const refreshBtn = document.getElementById('btn-refresh-categories');
    if (refreshBtn) refreshBtn.addEventListener('click', loadCategories);

    // 02. Add Category button
    const addBtn = document.getElementById('btn-open-add-category-modal');
    if (addBtn) addBtn.addEventListener('click', () => openCategoryModal(null));

    // 03. Close Add/Edit Modal
    const closeBtn = document.getElementById('btn-close-category-modal');
    const cancelBtn = document.getElementById('btn-cancel-category-modal');
    const backdrop = document.getElementById('category-modal-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeCategoryModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeCategoryModal);
    if (backdrop) backdrop.addEventListener('click', closeCategoryModal);

    // 04. Close Delete Modal
    const closeDelBtn = document.getElementById('btn-close-cat-del-modal');
    const cancelDelBtn = document.getElementById('btn-cancel-cat-del-modal');
    const delBackdrop = document.getElementById('category-del-modal-backdrop');
    const confirmDelBtn = document.getElementById('btn-confirm-delete-category');
    if (closeDelBtn) closeDelBtn.addEventListener('click', closeDeleteCategoryModal);
    if (cancelDelBtn) cancelDelBtn.addEventListener('click', closeDeleteCategoryModal);
    if (delBackdrop) delBackdrop.addEventListener('click', closeDeleteCategoryModal);
    if (confirmDelBtn) confirmDelBtn.addEventListener('click', handleConfirmDeleteCategory);

    // 05. Auto-Slug Generation & Preview
    const nameInput = document.getElementById('category-field-name');
    const slugInput = document.getElementById('category-field-slug');
    const slugPreview = document.getElementById('category-slug-preview');
    const toggleSlugBtn = document.getElementById('btn-toggle-category-custom-slug');
    const customSlugWrap = document.getElementById('category-custom-slug-wrap');

    if (toggleSlugBtn && customSlugWrap) {
        toggleSlugBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isHidden = customSlugWrap.style.display === 'none';
            customSlugWrap.style.display = isHidden ? 'block' : 'none';
            toggleSlugBtn.textContent = isHidden ? 'Hide custom slug' : 'Edit slug';
            if (isHidden) slugInput?.focus();
        });
    }

    if (nameInput && slugInput) {
        nameInput.addEventListener('input', () => {
            if (!slugManuallyEdited && !editingCategoryId) {
                const auto = slugify(nameInput.value);
                slugInput.value = auto;
                if (slugPreview) slugPreview.textContent = auto || 'auto-generated';
            }
        });
        slugInput.addEventListener('input', () => {
            slugManuallyEdited = true;
            if (slugPreview) slugPreview.textContent = slugInput.value.trim() || 'auto-generated';
        });
    }

    // 07. Form submit
    const form = document.getElementById('category-editor-form');
    if (form) form.addEventListener('submit', handleCategoryFormSubmit);

    // 08. Search and filter listeners
    const searchInput = document.getElementById('categories-search-input');
    const statusFilter = document.getElementById('categories-status-filter');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderCategoriesList();
        });
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            renderCategoriesList();
        });
    }

    // 09. Notification close
    const notifClose = document.getElementById('btn-close-category-notification');
    if (notifClose) notifClose.addEventListener('click', hideNotification);

    // 10. Reactive synchronization: update category product counts when products mutate
    window.addEventListener('admin:product-changed', () => {
        loadCategories();
    });

    // 11. Initial load
    loadCategories();
}
