/**
 * SAI INDIRABALA FURNITURE - ADMIN HERO BANNERS MODULE
 * Manages public.hero_banners: list, add, edit, preview, reorder, publish toggle, delete.
 * Strictly adheres to 0/1/many behavioral engine rules and database schema.
 */

import { getSupabase, isConfigured } from './adminClient.js';
import { setupImageUploader } from './imageUpload.js';

// Module State
let bannersData = [];
let editingBannerId = null;
let deletingBannerId = null;
let previewDebounceTimer = null;
let bannerImageUploader = null;

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
 * Validates a safe URL destination (https:// or anchor #...).
 * @param {string} url 
 * @returns {boolean}
 */
function isValidDestination(url) {
    if (!url) return true; // optional field
    const trimmed = url.trim();
    if (trimmed.startsWith('#')) return true;
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
        return false;
    }
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
    const box = document.getElementById('banner-notification-box');
    const text = document.getElementById('banner-notification-text');
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
    const box = document.getElementById('banner-notification-box');
    if (box) box.style.display = 'none';
}

/**
 * Updates summary stats bar.
 */
function updateStatsBar() {
    const totalEl = document.getElementById('stat-total-banners');
    const publishedEl = document.getElementById('stat-published-banners');
    const draftEl = document.getElementById('stat-draft-banners');
    const modeEl = document.getElementById('stat-engine-mode');

    const total = bannersData.length;
    const published = bannersData.filter(b => b.is_published).length;
    const drafts = total - published;

    if (totalEl) totalEl.textContent = total;
    if (publishedEl) publishedEl.textContent = published;
    if (draftEl) draftEl.textContent = drafts;

    if (modeEl) {
        if (published === 0) {
            modeEl.innerHTML = 'Engine Mode: <strong>0 (Fallback Local Hero)</strong>';
        } else if (published === 1) {
            modeEl.innerHTML = 'Engine Mode: <strong>1 (Static Single Banner)</strong>';
        } else {
            modeEl.innerHTML = `Engine Mode: <strong>${published} (Circular Sliding Carousel)</strong>`;
        }
    }
}

/**
 * Fetches hero banners from Supabase database.
 */
export async function loadBanners() {
    const container = document.getElementById('banners-list-container');
    if (!container) return;

    if (!isConfigured()) {
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">⚙️</div>
                <h4 class="empty-state-title">Supabase Credentials Required</h4>
                <p class="empty-state-text">
                    Configure your live Supabase project URL and Anon Key in <code>js/config.js</code> to connect banner management. The public site safely defaults to the local fallback render.
                </p>
            </div>
        `;
        updateStatsBar();
        return;
    }

    container.innerHTML = `
        <div class="banners-loading-state">
            <div class="loader-spinner" style="margin: 0 auto 1rem;"></div>
            <p style="color: var(--charcoal-muted); font-size: 0.88rem;">Connecting to Supabase and fetching banners...</p>
        </div>
    `;

    try {
        const supabase = await getSupabase();
        if (!supabase) {
            throw new Error('Supabase client could not be initialized.');
        }

        const { data, error } = await supabase
            .from('hero_banners')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        bannersData = data || [];
        updateStatsBar();
        renderBannersList();

    } catch (err) {
        console.error('[Admin Banners] Error fetching banners:', err.message);
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h4 class="empty-state-title">Unable to Load Banners</h4>
                <p class="empty-state-text">${escapeHtml(err.message)}</p>
                <button type="button" class="btn btn-secondary" id="btn-retry-banners">Retry Loading</button>
            </div>
        `;
        const retryBtn = document.getElementById('btn-retry-banners');
        if (retryBtn) retryBtn.addEventListener('click', loadBanners);
    }
}

/**
 * Renders banners cards list or empty state.
 */
function renderBannersList() {
    const container = document.getElementById('banners-list-container');
    if (!container) return;

    if (bannersData.length === 0) {
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">🖼️</div>
                <h4 class="empty-state-title">No Hero Banners Created</h4>
                <p class="empty-state-text">
                    Your homepage hero currently displays the default local fallback image (<code>images/hero/hero_furniture.png</code>). Add your first banner to activate dynamic hero displays.
                </p>
                <button type="button" class="btn btn-primary" id="btn-empty-add-banner">
                    + Add Your First Banner
                </button>
            </div>
        `;
        const emptyBtn = document.getElementById('btn-empty-add-banner');
        if (emptyBtn) emptyBtn.addEventListener('click', () => openBannerModal(null));
        return;
    }

    container.innerHTML = `
        <div class="banners-grid">
            ${bannersData.map(banner => `
                <div class="banner-card" data-id="${banner.id}">
                    <div class="banner-card-media">
                        <img src="${escapeHtml(banner.image_url)}" 
                             alt="${escapeHtml(banner.title || 'Hero Banner')}" 
                             class="banner-card-thumb"
                             loading="lazy"
                             onerror="this.src='../images/hero/hero_furniture.png';">
                        <div class="banner-card-badges">
                            <span class="${banner.is_published ? 'badge-published' : 'badge-draft'}">
                                ${banner.is_published ? '● Live' : '○ Draft'}
                            </span>
                            <span class="badge-order">Order #${banner.display_order}</span>
                        </div>
                    </div>

                    <div class="banner-card-body">
                        <h4 class="banner-card-title">${escapeHtml(banner.title || '(No Title Set)')}</h4>
                        <p class="banner-card-subtitle">${escapeHtml(banner.subtitle || 'No subtitle description provided.')}</p>

                        <div class="banner-card-meta">
                            <span class="meta-chip meta-chip-btn-preview" title="Hero CTA Button Preview (Matches Website Style)">
                                <strong>${escapeHtml(banner.button_text || 'Get Free Consultation')}</strong> ▶
                            </span>
                            ${banner.button_link ? `
                                <span class="meta-chip" title="CTA Destination Link">
                                    🔗 ${escapeHtml(banner.button_link)}
                                </span>
                            ` : `
                                <span class="meta-chip" title="Default Link">
                                    🔗 #contact
                                </span>
                            `}
                        </div>

                        <div class="banner-card-actions">
                            <button type="button" class="btn-action-icon btn-toggle-publish ${banner.is_published ? 'is-published' : 'is-draft'}" data-id="${banner.id}" title="${banner.is_published ? 'Click to Unpublish' : 'Click to Publish'}" aria-label="${banner.is_published ? 'Unpublish Banner' : 'Publish Banner'}">
                                ${banner.is_published ? `
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    <span>Live (Unpublish)</span>
                                ` : `
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                    <span>Draft (Publish)</span>
                                `}
                            </button>
                            <button type="button" class="btn-action-icon btn-move-up" data-id="${banner.id}" title="Move Order Up" aria-label="Move Order Up">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                                <span>Up</span>
                            </button>
                            <button type="button" class="btn-action-icon btn-move-down" data-id="${banner.id}" title="Move Order Down" aria-label="Move Order Down">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                                <span>Down</span>
                            </button>
                            <button type="button" class="btn-action-icon btn-edit-banner" data-id="${banner.id}" aria-label="Edit Banner Details">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                <span>Edit</span>
                            </button>
                            <button type="button" class="btn-action-icon danger btn-delete-banner" data-id="${banner.id}" aria-label="Delete Banner">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Attach card event listeners
    attachCardListeners();
}

/**
 * Attaches event listeners to rendered banner cards.
 */
function attachCardListeners() {
    // Quick Toggle Publish
    document.querySelectorAll('.btn-toggle-publish').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const banner = bannersData.find(b => b.id === id);
            if (!banner) return;
            await toggleBannerPublish(banner);
        });
    });

    // Move Up
    document.querySelectorAll('.btn-move-up').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const banner = bannersData.find(b => b.id === id);
            if (!banner || banner.display_order <= 0) return;
            await updateBannerOrder(banner.id, banner.display_order - 1);
        });
    });

    // Move Down
    document.querySelectorAll('.btn-move-down').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const banner = bannersData.find(b => b.id === id);
            if (!banner) return;
            await updateBannerOrder(banner.id, banner.display_order + 1);
        });
    });

    // Edit Banner
    document.querySelectorAll('.btn-edit-banner').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const banner = bannersData.find(b => b.id === id);
            if (banner) openBannerModal(banner);
        });
    });

    // Delete Banner
    document.querySelectorAll('.btn-delete-banner').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const banner = bannersData.find(b => b.id === id);
            if (banner) openDeleteModal(banner);
        });
    });
}

/**
 * Toggles a banner's published status in Supabase.
 * @param {object} banner 
 */
async function toggleBannerPublish(banner) {
    try {
        const supabase = await getSupabase();
        const newStatus = !banner.is_published;

        const { error } = await supabase
            .from('hero_banners')
            .update({ 
                is_published: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', banner.id);

        if (error) throw error;

        banner.is_published = newStatus;
        updateStatsBar();
        renderBannersList();
        showNotification(
            `Banner "${banner.title || 'Untitled'}" is now ${newStatus ? 'Published (Live)' : 'Draft (Hidden)'}.`,
            'success'
        );
        window.dispatchEvent(new CustomEvent('admin:data-changed'));
    } catch (err) {
        console.error('[Admin Banners] Error toggling publish status:', err.message);
        showNotification(`Failed to update publish status: ${err.message}`, 'error');
    }
}

/**
 * Updates a banner's display order.
 * @param {string} bannerId 
 * @param {number} newOrder 
 */
async function updateBannerOrder(bannerId, newOrder) {
    if (newOrder < 0) newOrder = 0;
    try {
        const supabase = await getSupabase();
        const { error } = await supabase
            .from('hero_banners')
            .update({ 
                display_order: newOrder,
                updated_at: new Date().toISOString()
            })
            .eq('id', bannerId);

        if (error) throw error;

        await loadBanners();
        showNotification(`Display order updated to #${newOrder}.`, 'success');
        window.dispatchEvent(new CustomEvent('admin:data-changed'));
    } catch (err) {
        console.error('[Admin Banners] Error updating display order:', err.message);
        showNotification(`Failed to update display order: ${err.message}`, 'error');
    }
}

/**
 * Handles live preview of image URL inside the editor modal.
 * @param {string} url 

/**
 * Opens Add / Edit Banner modal.
 * @param {object|null} banner 
 */
function openBannerModal(banner = null) {
    const modal = document.getElementById('banner-form-modal');
    const form = document.getElementById('banner-editor-form');
    const titleEl = document.getElementById('banner-modal-title');
    const errorEl = document.getElementById('banner-form-error');

    if (!modal || !form) return;

    // Reset Form & Error
    form.reset();
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }

    if (banner) {
        // Edit Mode
        editingBannerId = banner.id;
        if (titleEl) titleEl.textContent = 'Edit Hero Banner';
        document.getElementById('banner-field-id').value = banner.id;
        document.getElementById('banner-field-image-url').value = banner.image_url || '';
        document.getElementById('banner-field-title').value = banner.title || '';
        document.getElementById('banner-field-subtitle').value = banner.subtitle || '';
        document.getElementById('banner-field-button-text').value = banner.button_text || 'Get Free Consultation';
        document.getElementById('banner-field-button-link').value = banner.button_link || '#contact';
        document.getElementById('banner-field-display-order').value = banner.display_order ?? 0;
        document.getElementById('banner-field-is-published').checked = Boolean(banner.is_published);
        bannerImageUploader?.setInitialUrl(banner.image_url);
    } else {
        // Create Mode
        editingBannerId = null;
        if (titleEl) titleEl.textContent = 'Add New Hero Banner';
        document.getElementById('banner-field-id').value = '';
        document.getElementById('banner-field-title').value = '';
        document.getElementById('banner-field-subtitle').value = '';
        document.getElementById('banner-field-button-text').value = 'Get Free Consultation';
        document.getElementById('banner-field-button-link').value = '#contact';
        
        // Default display order = next available
        const maxOrder = bannersData.reduce((max, b) => Math.max(max, b.display_order || 0), -1);
        document.getElementById('banner-field-display-order').value = maxOrder + 1;
        document.getElementById('banner-field-is-published').checked = true;
        bannerImageUploader?.reset();
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Closes Add / Edit Banner modal.
 */
function closeBannerModal() {
    const modal = document.getElementById('banner-form-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    editingBannerId = null;
}

/**
 * Opens Delete Confirmation modal.
 * @param {object} banner 
 */
function openDeleteModal(banner) {
    deletingBannerId = banner.id;
    const modal = document.getElementById('banner-delete-modal');
    const titleEl = document.getElementById('delete-banner-title');
    const orderEl = document.getElementById('delete-banner-order');
    const thumbEl = document.getElementById('delete-banner-thumb');

    if (!modal) return;

    if (titleEl) titleEl.textContent = banner.title || '(Untitled Banner)';
    if (orderEl) orderEl.textContent = `Order #${banner.display_order} • ${banner.is_published ? 'Published' : 'Draft'}`;
    if (thumbEl) {
        thumbEl.src = banner.image_url;
        thumbEl.onerror = () => { thumbEl.src = '../images/hero/hero_furniture.png'; };
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Closes Delete Confirmation modal.
 */
function closeDeleteModal() {
    const modal = document.getElementById('banner-delete-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    deletingBannerId = null;
}

/**
 * Submits Add or Edit Banner form.
 * @param {Event} e 
 */
async function handleBannerFormSubmit(e) {
    e.preventDefault();

    const errorEl = document.getElementById('banner-form-error');
    const saveBtn = document.getElementById('btn-save-banner');
    const saveBtnText = document.getElementById('btn-save-banner-text');

    function showError(msg) {
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
        }
    }

    if (errorEl) errorEl.style.display = 'none';

    // 01. Resolve Banner Image (Device Photo Upload or Fallback Link)
    let imageUrl = '';
    try {
        if (saveBtn) saveBtn.disabled = true;
        if (saveBtnText) saveBtnText.textContent = 'Uploading photo...';
        imageUrl = await bannerImageUploader.resolveFinalUrl();
    } catch (upErr) {
        showError(upErr.message);
        if (saveBtn) saveBtn.disabled = false;
        if (saveBtnText) saveBtnText.textContent = 'Save Banner';
        return;
    }

    if (!imageUrl) {
        showError('Please choose a banner photo from your device or paste an image link.');
        if (saveBtn) saveBtn.disabled = false;
        if (saveBtnText) saveBtnText.textContent = 'Save Banner';
        return;
    }

    // Extract Form Values
    const title = document.getElementById('banner-field-title')?.value?.trim() || null;
    const subtitle = document.getElementById('banner-field-subtitle')?.value?.trim() || null;
    const buttonText = document.getElementById('banner-field-button-text')?.value?.trim() || 'Get Free Consultation';
    const buttonLink = document.getElementById('banner-field-button-link')?.value?.trim() || '#contact';
    const displayOrderInput = document.getElementById('banner-field-display-order')?.value;
    const isPublished = Boolean(document.getElementById('banner-field-is-published')?.checked);

    // Validation 02: Length checks
    if (title && title.length > 120) {
        showError('Title must not exceed 120 characters.');
        return;
    }
    if (subtitle && subtitle.length > 250) {
        showError('Subtitle must not exceed 250 characters.');
        return;
    }
    if (buttonText && buttonText.length > 50) {
        showError('Button label must not exceed 50 characters.');
        return;
    }

    // Validation 03: Safe Button Destination Link
    if (buttonLink && !isValidDestination(buttonLink)) {
        showError('Button destination link must start with https://, http://, or an anchor # (e.g. #contact).');
        return;
    }

    // Validation 04: Display Order
    const displayOrder = parseInt(displayOrderInput, 10);
    if (isNaN(displayOrder) || displayOrder < 0) {
        showError('Display order must be an integer 0 or greater.');
        return;
    }

    // Submission via Supabase Client
    try {
        if (saveBtn) saveBtn.disabled = true;
        if (saveBtnText) saveBtnText.textContent = 'Saving...';

        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client is not available.');

        const bannerPayload = {
            image_url: imageUrl,
            title: title,
            subtitle: subtitle,
            button_text: buttonText,
            button_link: buttonLink,
            display_order: displayOrder,
            is_published: isPublished
        };

        if (editingBannerId) {
            // Update Existing Record
            bannerPayload.updated_at = new Date().toISOString();
            const { error } = await supabase
                .from('hero_banners')
                .update(bannerPayload)
                .eq('id', editingBannerId);

            if (error) throw error;
            showNotification('Hero banner successfully updated.', 'success');
        } else {
            // Insert New Record
            const { error } = await supabase
                .from('hero_banners')
                .insert([bannerPayload]);

            if (error) throw error;
            showNotification('New hero banner added successfully.', 'success');
        }

        closeBannerModal();
        await loadBanners();
        window.dispatchEvent(new CustomEvent('admin:data-changed'));

    } catch (err) {
        console.error('[Admin Banners] Form save error:', err.message);
        showError(`Database operation failed: ${err.message}`);
    } finally {
        if (saveBtn) saveBtn.disabled = false;
        if (saveBtnText) saveBtnText.textContent = 'Save Banner';
    }
}

/**
 * Handles confirmed deletion of a banner.
 */
async function handleConfirmDelete() {
    if (!deletingBannerId) return;

    const confirmBtn = document.getElementById('btn-confirm-delete-banner');
    const confirmBtnText = document.getElementById('btn-confirm-delete-text');

    try {
        if (confirmBtn) confirmBtn.disabled = true;
        if (confirmBtnText) confirmBtnText.textContent = 'Deleting...';

        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client is not available.');

        const { error } = await supabase
            .from('hero_banners')
            .delete()
            .eq('id', deletingBannerId);

        if (error) throw error;

        showNotification('Hero banner permanently deleted.', 'success');
        closeDeleteModal();
        await loadBanners();
        window.dispatchEvent(new CustomEvent('admin:data-changed'));

    } catch (err) {
        console.error('[Admin Banners] Error deleting banner:', err.message);
        showNotification(`Failed to delete banner: ${err.message}`, 'error');
    } finally {
        if (confirmBtn) confirmBtn.disabled = false;
        if (confirmBtnText) confirmBtnText.textContent = 'Delete Banner';
    }
}

/**
 * Initializes the Hero Banners CMS module.
 */
export function initBannersModule() {
    // 00. Initialize Banner Image Uploader
    bannerImageUploader = setupImageUploader({
        dropzoneEl: document.getElementById('banner-dropzone'),
        fileInputEl: document.getElementById('banner-file-input'),
        previewImgEl: document.getElementById('banner-preview-img'),
        previewWrapEl: document.getElementById('banner-preview-wrap'),
        placeholderEl: document.getElementById('banner-dropzone-placeholder'),
        clearBtnEl: document.getElementById('banner-clear-image-btn'),
        urlFallbackInputEl: document.getElementById('banner-field-image-url'),
        fallbackToggleBtnEl: document.getElementById('banner-fallback-toggle-btn'),
        fallbackWrapEl: document.getElementById('banner-fallback-wrap'),
        folder: 'banners'
    });

    // 01. Refresh button
    const refreshBtn = document.getElementById('btn-refresh-banners');
    if (refreshBtn) refreshBtn.addEventListener('click', loadBanners);

    // 02. Open Add Modal button
    const addBtn = document.getElementById('btn-open-add-banner-modal');
    if (addBtn) addBtn.addEventListener('click', () => openBannerModal(null));

    // 03. Close Add/Edit Modal
    const closeBtn = document.getElementById('btn-close-banner-modal');
    const cancelBtn = document.getElementById('btn-cancel-banner-modal');
    const modalBackdrop = document.getElementById('banner-modal-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeBannerModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeBannerModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeBannerModal);

    // 04. Close Delete Modal
    const closeDeleteBtn = document.getElementById('btn-close-delete-modal');
    const cancelDeleteBtn = document.getElementById('btn-cancel-delete-modal');
    const deleteBackdrop = document.getElementById('delete-modal-backdrop');
    const confirmDeleteBtn = document.getElementById('btn-confirm-delete-banner');
    if (closeDeleteBtn) closeDeleteBtn.addEventListener('click', closeDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (deleteBackdrop) deleteBackdrop.addEventListener('click', closeDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleConfirmDelete);


    // 05. Preset Buttons for Hero Button Label & Destination Link
    document.querySelectorAll('.btn-banner-preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.btn-banner-preset-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const text = e.currentTarget.getAttribute('data-text');
            const link = e.currentTarget.getAttribute('data-link');
            const textInp = document.getElementById('banner-field-button-text');
            const linkInp = document.getElementById('banner-field-button-link');
            if (textInp && text) textInp.value = text;
            if (linkInp && link) linkInp.value = link;
        });
    });

    // 06. Form Submit Listener
    const form = document.getElementById('banner-editor-form');
    if (form) form.addEventListener('submit', handleBannerFormSubmit);

    // 07. Notification Close Button
    const notifClose = document.getElementById('btn-close-notification');
    if (notifClose) notifClose.addEventListener('click', hideNotification);

    // 08. Global Keyboard ESC handler for modals
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeBannerModal();
            closeDeleteModal();
        }
    });

    // 09. Load Banners Initial Call
    loadBanners();
}
