/**
 * SAI INDIRABALA FURNITURE - ADMIN OUR WORK GALLERY MODULE
 * Full CRUD, real-site project showcase, image preview, reordering, and publishing.
 * Strictly adheres to public.our_work_gallery database schema and RLS policies.
 */

import { getSupabase, isConfigured } from './adminClient.js';
import { setupImageUploader } from './imageUpload.js';

// Module State
let galleryData = [];
let editingGalleryId = null;
let deletingGalleryItem = null;
let galleryUploader = null;


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
 * Validates HTTPS Image URL.
 * @param {string} url 
 * @returns {boolean}
 */
function isValidImageUrl(url) {
    if (!url) return false;
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
    const box = document.getElementById('gallery-notification-box');
    const text = document.getElementById('gallery-notification-text');
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
    const box = document.getElementById('gallery-notification-box');
    if (box) box.style.display = 'none';
}

/**
 * Updates summary stats bar.
 */
function updateStatsBar() {
    const totalEl = document.getElementById('stat-total-gallery');
    const publishedEl = document.getElementById('stat-published-gallery');
    const draftEl = document.getElementById('stat-draft-gallery');

    const total = galleryData.length;
    const published = galleryData.filter(g => g.is_published).length;
    const drafts = total - published;

    if (totalEl) totalEl.textContent = total;
    if (publishedEl) publishedEl.textContent = published;
    if (draftEl) draftEl.textContent = drafts;
}

/**
 * Populates dynamic category filter options from distinct gallery categories.
 */
function populateGalleryCategoryFilter() {
    const filterSelect = document.getElementById('gallery-category-filter');
    if (!filterSelect) return;

    const currentVal = filterSelect.value;
    const categoriesSet = new Set();
    galleryData.forEach(item => {
        if (item.category && item.category.trim()) {
            categoriesSet.add(item.category.trim());
        }
    });

    const sortedCats = Array.from(categoriesSet).sort();
    filterSelect.innerHTML = `
        <option value="all">All Categories</option>
        ${sortedCats.map(cat => `
            <option value="${escapeHtml(cat)}" ${currentVal === cat ? 'selected' : ''}>
                ${escapeHtml(cat)}
            </option>
        `).join('')}
    `;
}

/**
 * Fetches gallery records from Supabase database.
 */
export async function loadGallery() {
    const container = document.getElementById('gallery-list-container');
    if (!container) return;

    if (!isConfigured()) {
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">⚙️</div>
                <h4 class="empty-state-title">Supabase Credentials Required</h4>
                <p class="empty-state-text">
                    Configure your live Supabase credentials in <code>js/config.js</code> to manage portfolio gallery items.
                </p>
            </div>
        `;
        updateStatsBar();
        return;
    }

    container.innerHTML = `
        <div class="banners-loading-state">
            <div class="loader-spinner" style="margin: 0 auto 1rem;"></div>
            <p style="color: var(--charcoal-muted); font-size: 0.88rem;">Fetching portfolio projects from database...</p>
        </div>
    `;

    try {
        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client could not be initialized.');

        const { data, error } = await supabase
            .from('our_work_gallery')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;

        galleryData = data || [];
        updateStatsBar();
        populateGalleryCategoryFilter();
        renderGalleryList();

    } catch (err) {
        console.error('[Admin Gallery] Error fetching gallery:', err.message);
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h4 class="empty-state-title">Unable to Load Gallery</h4>
                <p class="empty-state-text">${escapeHtml(err.message)}</p>
                <button type="button" class="btn btn-secondary" id="btn-retry-gallery">Retry Loading</button>
            </div>
        `;
        const retryBtn = document.getElementById('btn-retry-gallery');
        if (retryBtn) retryBtn.addEventListener('click', loadGallery);
    }
}

/**
 * Filters gallery based on search query, category, and publication status.
 */
function getFilteredGallery() {
    const searchInput = document.getElementById('gallery-search-input');
    const categoryFilter = document.getElementById('gallery-category-filter');
    const statusFilter = document.getElementById('gallery-status-filter');

    const query = (searchInput?.value || '').toLowerCase().trim();
    const cat = categoryFilter?.value || 'all';
    const status = statusFilter?.value || 'all';

    return galleryData.filter(item => {
        // Category filter
        if (cat !== 'all' && (item.category || '').trim() !== cat) return false;

        // Status filter
        if (status === 'published' && !item.is_published) return false;
        if (status === 'draft' && item.is_published) return false;

        // Search query
        if (query) {
            const matchTitle = (item.title || '').toLowerCase().includes(query);
            const matchDesc = (item.description || '').toLowerCase().includes(query);
            const matchCat = (item.category || '').toLowerCase().includes(query);
            return matchTitle || matchDesc || matchCat;
        }

        return true;
    });
}

/**
 * Renders gallery items list or empty state.
 */
export function renderGalleryList() {
    const container = document.getElementById('gallery-list-container');
    if (!container) return;

    const filtered = getFilteredGallery();

    if (galleryData.length === 0) {
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">📸</div>
                <h4 class="empty-state-title">No Portfolio Projects Found</h4>
                <p class="empty-state-text">
                    Showcase completed custom furniture installations, 3D vs reality case studies, and interior projects.
                </p>
                <button type="button" class="btn btn-primary" id="btn-empty-add-gallery">
                    + Add Your First Project
                </button>
            </div>
        `;
        const emptyBtn = document.getElementById('btn-empty-add-gallery');
        if (emptyBtn) emptyBtn.addEventListener('click', () => openGalleryModal(null));
        return;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">🔍</div>
                <h4 class="empty-state-title">No Matching Projects</h4>
                <p class="empty-state-text">No portfolio projects match your active search, category, and status filters.</p>
                <button type="button" class="btn btn-secondary" id="btn-clear-gallery-filters">Clear Filters</button>
            </div>
        `;
        const clearBtn = document.getElementById('btn-clear-gallery-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const searchInput = document.getElementById('gallery-search-input');
                const catFilter = document.getElementById('gallery-category-filter');
                const statFilter = document.getElementById('gallery-status-filter');
                if (searchInput) searchInput.value = '';
                if (catFilter) catFilter.value = 'all';
                if (statFilter) statFilter.value = 'all';
                renderGalleryList();
            });
        }
        return;
    }

    container.innerHTML = `
        <div class="banners-grid">
            ${filtered.map(item => `
                <div class="banner-card" data-id="${item.id}">
                    <div class="banner-card-media">
                        <img src="${escapeHtml(item.image_url)}" 
                             alt="${escapeHtml(item.title)}" 
                             class="banner-card-thumb"
                             loading="lazy"
                             onerror="this.src='../images/hero/hero_furniture.png';">
                        <div class="banner-card-badges">
                            <span class="${item.is_published ? 'badge-published' : 'badge-draft'}">
                                ${item.is_published ? '● Live' : '○ Draft'}
                            </span>
                            <span class="badge-order">Order #${item.display_order}</span>
                        </div>
                    </div>

                    <div class="banner-card-body">
                        ${item.category ? `
                            <span class="badge-category" style="margin-bottom: 0.4rem; align-self: flex-start;">
                                📍 ${escapeHtml(item.category)}
                            </span>
                        ` : ''}

                        <h4 class="banner-card-title">${escapeHtml(item.title)}</h4>

                        <p class="banner-card-subtitle">
                            ${escapeHtml(item.description || 'No project description provided.')}
                        </p>

                        <div class="banner-card-actions">
                            <button type="button" class="btn-action-icon btn-toggle-gallery-publish ${item.is_published ? 'is-published' : 'is-draft'}" data-id="${item.id}" title="${item.is_published ? 'Click to Unpublish' : 'Click to Publish'}">
                                ${item.is_published ? `
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    <span>Live (Unpublish)</span>
                                ` : `
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                    <span>Draft (Publish)</span>
                                `}
                            </button>
                            <button type="button" class="btn-action-icon btn-gallery-move-up" data-id="${item.id}" title="Move Order Up" aria-label="Move Order Up">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                                <span>Up</span>
                            </button>
                            <button type="button" class="btn-action-icon btn-gallery-move-down" data-id="${item.id}" title="Move Order Down" aria-label="Move Order Down">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                                <span>Down</span>
                            </button>
                            <button type="button" class="btn-action-icon btn-edit-gallery" data-id="${item.id}" title="Edit Project">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                <span>Edit</span>
                            </button>
                            <button type="button" class="btn-action-icon danger btn-delete-gallery" data-id="${item.id}" title="Delete Project">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    attachGalleryCardListeners();
}

/**
 * Attaches event listeners to rendered gallery cards.
 */
function attachGalleryCardListeners() {
    // Publish Toggle
    document.querySelectorAll('.btn-toggle-gallery-publish').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const item = galleryData.find(g => g.id === id);
            if (item) await toggleGalleryPublish(item);
        });
    });

    // Move Up
    document.querySelectorAll('.btn-gallery-move-up').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const item = galleryData.find(g => g.id === id);
            if (item && item.display_order > 0) {
                await updateGalleryOrder(item.id, item.display_order - 1);
            }
        });
    });

    // Move Down
    document.querySelectorAll('.btn-gallery-move-down').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const item = galleryData.find(g => g.id === id);
            if (item) {
                await updateGalleryOrder(item.id, item.display_order + 1);
            }
        });
    });

    // Edit
    document.querySelectorAll('.btn-edit-gallery').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const item = galleryData.find(g => g.id === id);
            if (item) openGalleryModal(item);
        });
    });

    // Delete
    document.querySelectorAll('.btn-delete-gallery').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const item = galleryData.find(g => g.id === id);
            if (item) openDeleteGalleryModal(item);
        });
    });
}

/**
 * Toggles a gallery project's published status.
 * @param {object} item 
 */
async function toggleGalleryPublish(item) {
    try {
        const supabase = await getSupabase();
        const newStatus = !item.is_published;

        const { error } = await supabase
            .from('our_work_gallery')
            .update({ 
                is_published: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

        if (error) throw error;

        item.is_published = newStatus;
        updateStatsBar();
        renderGalleryList();
        showNotification(
            `Project "${item.title}" is now ${newStatus ? 'Published (Live)' : 'Draft (Hidden)'}.`,
            'success'
        );
        window.dispatchEvent(new CustomEvent('admin:data-changed'));
    } catch (err) {
        console.error('[Admin Gallery] Error toggling publish status:', err.message);
        showNotification(`Failed to update publish status: ${err.message}`, 'error');
    }
}

/**
 * Updates a gallery project's display order.
 * @param {string} id 
 * @param {number} newOrder 
 */
async function updateGalleryOrder(id, newOrder) {
    if (newOrder < 0) newOrder = 0;
    try {
        const supabase = await getSupabase();
        const { error } = await supabase
            .from('our_work_gallery')
            .update({ 
                display_order: newOrder,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;

        await loadGallery();
        showNotification(`Gallery order updated to #${newOrder}.`, 'success');
        window.dispatchEvent(new CustomEvent('admin:data-changed'));
    } catch (err) {
        console.error('[Admin Gallery] Error updating order:', err.message);
        showNotification(`Failed to update order: ${err.message}`, 'error');
    }
}


function ensureGalleryUploader() {
    if (!galleryUploader) {
        galleryUploader = setupImageUploader({
            dropzoneEl: document.getElementById('gallery-dropzone'),
            fileInputEl: document.getElementById('gallery-file-input'),
            previewImgEl: document.getElementById('gallery-preview-img'),
            previewWrapEl: document.getElementById('gallery-preview-wrap'),
            placeholderEl: document.getElementById('gallery-dropzone-placeholder'),
            clearBtnEl: document.getElementById('gallery-clear-image-btn'),
            urlFallbackInputEl: document.getElementById('gallery-field-image-url'),
            fallbackToggleBtnEl: document.getElementById('gallery-fallback-toggle-btn'),
            fallbackWrapEl: document.getElementById('gallery-fallback-wrap'),
            folder: 'gallery'
        });
    }
}

/**
 * Opens Add / Edit Gallery Project modal.
 * @param {object|null} item 
 */
function openGalleryModal(item = null) {
    const modal = document.getElementById('gallery-form-modal');
    const form = document.getElementById('gallery-editor-form');
    const titleEl = document.getElementById('gallery-modal-title');
    const errorEl = document.getElementById('gallery-form-error');

    if (!modal || !form) return;

    form.reset();
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }

    ensureGalleryUploader();

    if (item) {
        editingGalleryId = item.id;
        if (titleEl) titleEl.textContent = 'Edit Project Work';
        document.getElementById('gallery-field-id').value = item.id;
        document.getElementById('gallery-field-title').value = item.title || '';
        document.getElementById('gallery-field-category').value = item.category || '';
        document.getElementById('gallery-field-image-url').value = item.image_url || '';
        document.getElementById('gallery-field-description').value = item.description || '';
        document.getElementById('gallery-field-display-order').value = item.display_order ?? 0;
        document.getElementById('gallery-field-is-published').checked = Boolean(galleryIsPublished(item));
        if (galleryUploader) galleryUploader.setInitialUrl(item.image_url || '');
    } else {
        editingGalleryId = null;
        if (titleEl) titleEl.textContent = 'Upload Project Work';
        document.getElementById('gallery-field-id').value = '';
        const maxOrder = galleryData.reduce((max, g) => Math.max(max, g.display_order || 0), -1);
        document.getElementById('gallery-field-display-order').value = maxOrder + 1;
        document.getElementById('gallery-field-is-published').checked = true;
        if (galleryUploader) galleryUploader.setInitialUrl('');
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function galleryIsPublished(item) {
    return item.is_published !== undefined ? item.is_published : true;
}

/**
 * Closes Gallery modal.
 */
function closeGalleryModal() {
    const modal = document.getElementById('gallery-form-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    if (galleryUploader) galleryUploader.reset();
    editingGalleryId = null;
}

/**
 * Opens Delete Confirmation modal for a gallery project.
 * @param {object} item 
 */
function openDeleteGalleryModal(item) {
    deletingGalleryItem = item;
    const modal = document.getElementById('gallery-delete-modal');
    const titleEl = document.getElementById('delete-gallery-title');
    const catEl = document.getElementById('delete-gallery-category');
    const thumbEl = document.getElementById('delete-gallery-thumb');

    if (!modal) return;

    if (titleEl) titleEl.textContent = item.title;
    if (catEl) catEl.textContent = `Category: ${item.category || 'General Project'}`;
    if (thumbEl) {
        thumbEl.src = item.image_url;
        thumbEl.onerror = () => { thumbEl.src = '../images/hero/hero_furniture.png'; };
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Closes Delete Gallery modal.
 */
function closeDeleteGalleryModal() {
    const modal = document.getElementById('gallery-delete-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    deletingGalleryItem = null;
}

/**
 * Submits Add or Edit Gallery form.
 * @param {Event} e 
 */
async function handleGalleryFormSubmit(e) {
    e.preventDefault();

    const errorEl = document.getElementById('gallery-form-error');
    const saveBtn = document.getElementById('btn-save-gallery');
    const saveBtnText = document.getElementById('btn-save-gallery-text');

    function showError(msg) {
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
        }
    }

    if (errorEl) errorEl.style.display = 'none';

    const title = document.getElementById('gallery-field-title')?.value?.trim();
    const category = document.getElementById('gallery-field-category')?.value?.trim() || null;
    const description = document.getElementById('gallery-field-description')?.value?.trim() || null;
    const displayOrderInput = document.getElementById('gallery-field-display-order')?.value;
    const isPublished = Boolean(document.getElementById('gallery-field-is-published')?.checked);

    if (!title || title.length < 2) {
        showError('Project headline / title is required (at least 2 characters).');
        return;
    }

    if (description && description.length > 300) {
        showError('Description must not exceed 300 characters.');
        return;
    }

    const displayOrder = parseInt(displayOrderInput, 10);
    if (isNaN(displayOrder) || displayOrder < 0) {
        showError('Display order must be an integer 0 or greater.');
        return;
    }

    try {
        if (saveBtn) saveBtn.disabled = true;
        if (saveBtnText) saveBtnText.textContent = 'Saving...';

        ensureGalleryUploader();
        let imageUrl = '';
        try {
            imageUrl = await galleryUploader.resolveFinalUrl();
        } catch (uploadErr) {
            showError(uploadErr.message || 'Failed to upload project photo.');
            if (saveBtn) saveBtn.disabled = false;
            if (saveBtnText) saveBtnText.textContent = 'Save Project';
            return;
        }

        if (!imageUrl) {
            showError('Project photograph is required. Please choose a photo from your device or paste an image URL.');
            if (saveBtn) saveBtn.disabled = false;
            if (saveBtnText) saveBtnText.textContent = 'Save Project';
            return;
        }

        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client is not available.');

        const payload = {
            title,
            category,
            image_url: imageUrl,
            description,
            display_order: displayOrder,
            is_published: isPublished
        };

        if (editingGalleryId) {
            payload.updated_at = new Date().toISOString();
            const { error } = await supabase
                .from('our_work_gallery')
                .update(payload)
                .eq('id', editingGalleryId);

            if (error) throw error;
            showNotification(`Gallery project "${title}" successfully updated.`, 'success');
        } else {
            const { error } = await supabase
                .from('our_work_gallery')
                .insert([payload]);

            if (error) throw error;
            showNotification(`New gallery project "${title}" added successfully.`, 'success');
        }

        closeGalleryModal();
        await loadGallery();
        window.dispatchEvent(new CustomEvent('admin:data-changed'));

    } catch (err) {
        console.error('[Admin Gallery] Save error:', err.message);
        showError(err.message);
    } finally {
        if (saveBtn) saveBtn.disabled = false;
        if (saveBtnText) saveBtnText.textContent = 'Save Project';
    }
}

/**
 * Handles confirmed deletion of a gallery project.
 */
async function handleConfirmDeleteGallery() {
    if (!deletingGalleryItem) return;

    const confirmBtn = document.getElementById('btn-confirm-delete-gallery');
    const confirmBtnText = document.getElementById('btn-confirm-delete-gal-text');

    try {
        if (confirmBtn) confirmBtn.disabled = true;
        if (confirmBtnText) confirmBtnText.textContent = 'Deleting...';

        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client is not available.');

        const { error } = await supabase
            .from('our_work_gallery')
            .delete()
            .eq('id', deletingGalleryItem.id);

        if (error) throw error;

        showNotification(`Project "${deletingGalleryItem.title}" permanently deleted.`, 'success');
        closeDeleteGalleryModal();
        await loadGallery();
        window.dispatchEvent(new CustomEvent('admin:data-changed'));

    } catch (err) {
        console.error('[Admin Gallery] Delete error:', err.message);
        showNotification(`Failed to delete project: ${err.message}`, 'error');
    } finally {
        if (confirmBtn) confirmBtn.disabled = false;
        if (confirmBtnText) confirmBtnText.textContent = 'Delete Project';
    }
}

/**
 * Initializes Gallery module listeners and triggers initial fetch.
 */
export function initGalleryModule() {
    // 01. Refresh
    const refreshBtn = document.getElementById('btn-refresh-gallery');
    if (refreshBtn) refreshBtn.addEventListener('click', loadGallery);

    // 02. Add Project button
    const addBtn = document.getElementById('btn-open-add-gallery-modal');
    if (addBtn) addBtn.addEventListener('click', () => openGalleryModal(null));

    // 03. Close Add/Edit Modal
    const closeBtn = document.getElementById('btn-close-gallery-modal');
    const cancelBtn = document.getElementById('btn-cancel-gallery-modal');
    const backdrop = document.getElementById('gallery-modal-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeGalleryModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeGalleryModal);
    if (backdrop) backdrop.addEventListener('click', closeGalleryModal);

    // 04. Close Delete Modal
    const closeDelBtn = document.getElementById('btn-close-gal-del-modal');
    const cancelDelBtn = document.getElementById('btn-cancel-gal-del-modal');
    const delBackdrop = document.getElementById('gallery-del-modal-backdrop');
    const confirmDelBtn = document.getElementById('btn-confirm-delete-gallery');
    if (closeDelBtn) closeDelBtn.addEventListener('click', closeDeleteGalleryModal);
    if (cancelDelBtn) cancelDelBtn.addEventListener('click', closeDeleteGalleryModal);
    if (delBackdrop) delBackdrop.addEventListener('click', closeDeleteGalleryModal);
    if (confirmDelBtn) confirmDelBtn.addEventListener('click', handleConfirmDeleteGallery);

    // 05. Ensure Image Uploader
    ensureGalleryUploader();

    // 06. Category Preset Pills in Modal
    document.querySelectorAll('.btn-gal-preset-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            const catField = document.getElementById('gallery-field-category');
            const tag = e.currentTarget.getAttribute('data-tag') || e.currentTarget.textContent.replace('+', '').trim();
            if (catField && tag) catField.value = tag;
        });
    });

    // 07. Form Submit
    const form = document.getElementById('gallery-editor-form');
    if (form) form.addEventListener('submit', handleGalleryFormSubmit);

    // 08. Search and Filter listeners
    const searchInput = document.getElementById('gallery-search-input');
    const catFilter = document.getElementById('gallery-category-filter');
    const statFilter = document.getElementById('gallery-status-filter');
    if (searchInput) searchInput.addEventListener('input', renderGalleryList);
    if (catFilter) catFilter.addEventListener('change', renderGalleryList);
    if (statFilter) statFilter.addEventListener('change', renderGalleryList);

    // 09. Notification Close
    const notifClose = document.getElementById('btn-close-gallery-notification');
    if (notifClose) notifClose.addEventListener('click', hideNotification);

    // 10. Initial load
    loadGallery();
}

