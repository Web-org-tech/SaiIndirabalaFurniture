/**
 * SAI INDIRABALA FURNITURE - ADMIN CONSULTATION ENQUIRIES MODULE
 * Full lead viewer, status management, contact actions, search, and filtering.
 * Strictly confidential: accessible only to verified administrators via Supabase RLS.
 * Zero customer PII written to browser storage or console logs.
 */

import { getSupabase, isConfigured } from './adminClient.js';

// Module State
let enquiriesData = [];
let viewingEnquiry = null;
let deletingEnquiryId = null;

// Permitted Database Statuses (Strictly enforces schema check constraint)
export const PERMITTED_STATUSES = [
    { value: 'new', label: 'New Lead', badgeClass: 'status-new' },
    { value: 'contacted', label: 'Contacted', badgeClass: 'status-contacted' },
    { value: 'in_progress', label: 'In Progress', badgeClass: 'status-in_progress' },
    { value: 'converted', label: 'Converted Client', badgeClass: 'status-converted' },
    { value: 'closed', label: 'Closed / Inactive', badgeClass: 'status-closed' },
    { value: 'spam', label: 'Spam / Junk', badgeClass: 'status-spam' }
];

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
 * Formats ISO timestamp into readable local date and time.
 * @param {string} isoString 
 * @returns {string}
 */
function formatDate(isoString) {
    if (!isoString) return '—';
    try {
        const d = new Date(isoString);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return isoString;
    }
}

/**
 * Strips phone number to numeric digits for tel / WhatsApp links.
 * @param {string} phone 
 * @returns {string}
 */
function cleanPhoneNumber(phone) {
    if (!phone) return '';
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length === 10) return `91${digits}`;
    return digits;
}

/**
 * Returns status badge HTML.
 * @param {string} status 
 * @returns {string}
 */
function getStatusBadge(status) {
    const found = PERMITTED_STATUSES.find(s => s.value === status) || {
        label: status || 'Unknown',
        badgeClass: 'status-closed'
    };
    return `<span class="badge-status ${found.badgeClass}">${escapeHtml(found.label)}</span>`;
}

/**
 * Displays notification alert banner.
 * @param {string} message 
 * @param {'success'|'error'|'info'} type 
 */
function showNotification(message, type = 'info') {
    const box = document.getElementById('enquiry-notification-box');
    const text = document.getElementById('enquiry-notification-text');
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
    const box = document.getElementById('enquiry-notification-box');
    if (box) box.style.display = 'none';
}

/**
 * Updates summary stats bar.
 */
function updateStatsBar() {
    const totalEl = document.getElementById('stat-total-enquiries');
    const newEl = document.getElementById('stat-new-enquiries');
    const inProgressEl = document.getElementById('stat-inprogress-enquiries');
    const convertedEl = document.getElementById('stat-converted-enquiries');

    const total = enquiriesData.length;
    const newCount = enquiriesData.filter(e => e.status === 'new').length;
    const inProgCount = enquiriesData.filter(e => e.status === 'in_progress').length;
    const convertedCount = enquiriesData.filter(e => e.status === 'converted').length;

    if (totalEl) totalEl.textContent = total;
    if (newEl) newEl.textContent = newCount;
    if (inProgressEl) inProgressEl.textContent = inProgCount;
    if (convertedEl) convertedEl.textContent = convertedCount;
}

/**
 * Populates dynamic service type filter dropdown from existing records.
 */
function populateServiceTypeFilter() {
    const filterSelect = document.getElementById('enquiries-service-filter');
    if (!filterSelect) return;

    const currentVal = filterSelect.value;
    const servicesSet = new Set();
    enquiriesData.forEach(e => {
        if (e.service_type && e.service_type.trim()) {
            servicesSet.add(e.service_type.trim());
        }
    });

    const sortedServices = Array.from(servicesSet).sort();
    filterSelect.innerHTML = `
        <option value="all">All Service Types</option>
        ${sortedServices.map(srv => `
            <option value="${escapeHtml(srv)}" ${currentVal === srv ? 'selected' : ''}>
                ${escapeHtml(srv)}
            </option>
        `).join('')}
    `;
}

/**
 * Fetches consultation enquiries from Supabase database.
 * Enforces admin authorization check before calling.
 */
export async function loadEnquiries() {
    const container = document.getElementById('enquiries-list-container');
    if (!container) return;

    if (!isConfigured()) {
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">⚙️</div>
                <h4 class="empty-state-title">Supabase Credentials Required</h4>
                <p class="empty-state-text">
                    Configure your live Supabase credentials in <code>js/config.js</code> to view consultation leads. Customer submissions remain secure and confidential.
                </p>
            </div>
        `;
        updateStatsBar();
        return;
    }

    container.innerHTML = `
        <div class="banners-loading-state">
            <div class="loader-spinner" style="margin: 0 auto 1rem;"></div>
            <p style="color: var(--charcoal-muted); font-size: 0.88rem;">Securely fetching consultation enquiries...</p>
        </div>
    `;

    try {
        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client could not be initialized.');

        const sortOrder = document.getElementById('enquiries-sort-order')?.value === 'asc';

        const { data, error } = await supabase
            .from('enquiries')
            .select('*')
            .order('created_at', { ascending: sortOrder });

        if (error) throw error;

        enquiriesData = data || [];
        updateStatsBar();
        populateServiceTypeFilter();
        renderEnquiriesList();

    } catch (err) {
        console.error('[Admin Enquiries] Fetch failed (Details withheld for privacy).');
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h4 class="empty-state-title">Unable to Load Enquiries</h4>
                <p class="empty-state-text">
                    ${escapeHtml(err.message || 'Authorization or network failure occurred.')}
                </p>
                <button type="button" class="btn btn-secondary" id="btn-retry-enquiries">Retry Loading</button>
            </div>
        `;
        const retryBtn = document.getElementById('btn-retry-enquiries');
        if (retryBtn) retryBtn.addEventListener('click', loadEnquiries);
    }
}

/**
 * Filters enquiries based on search query, status, and service type.
 */
function getFilteredEnquiries() {
    const searchInput = document.getElementById('enquiries-search-input');
    const statusFilter = document.getElementById('enquiries-status-filter');
    const serviceFilter = document.getElementById('enquiries-service-filter');

    const query = (searchInput?.value || '').toLowerCase().trim();
    const status = statusFilter?.value || 'all';
    const service = serviceFilter?.value || 'all';

    return enquiriesData.filter(e => {
        // Status filter
        if (status !== 'all' && e.status !== status) return false;

        // Service filter
        if (service !== 'all' && (e.service_type || '').trim() !== service) return false;

        // Search query (customer name, phone, email)
        if (query) {
            const matchName = (e.customer_name || '').toLowerCase().includes(query);
            const matchPhone = (e.phone || '').toLowerCase().includes(query);
            const matchEmail = (e.email || '').toLowerCase().includes(query);
            return matchName || matchPhone || matchEmail;
        }

        return true;
    });
}

/**
 * Renders enquiries table or empty state.
 */
export function renderEnquiriesList() {
    const container = document.getElementById('enquiries-list-container');
    if (!container) return;

    const filtered = getFilteredEnquiries();

    if (enquiriesData.length === 0) {
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">📬</div>
                <h4 class="empty-state-title">No Enquiries Received Yet</h4>
                <p class="empty-state-text">
                    Customer consultation requests submitted through the website consultation form will appear here in real time.
                </p>
            </div>
        `;
        return;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="banners-empty-state">
                <div class="empty-state-icon">🔍</div>
                <h4 class="empty-state-title">No Matching Enquiries</h4>
                <p class="empty-state-text">No consultation records match your active search, status, and service filters.</p>
                <button type="button" class="btn btn-secondary" id="btn-clear-enquiry-filters">Clear Filters</button>
            </div>
        `;
        const clearBtn = document.getElementById('btn-clear-enquiry-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const sInp = document.getElementById('enquiries-search-input');
                const stFilt = document.getElementById('enquiries-status-filter');
                const srvFilt = document.getElementById('enquiries-service-filter');
                if (sInp) sInp.value = '';
                if (stFilt) stFilt.value = 'all';
                if (srvFilt) srvFilt.value = 'all';
                renderEnquiriesList();
            });
        }
        return;
    }

    container.innerHTML = `
        <div class="enquiries-table-wrap">
            <table class="enquiries-table" role="table">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Customer</th>
                        <th>Phone / Contact</th>
                        <th>Service Requested</th>
                        <th>Message Preview</th>
                        <th>Date Received</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(e => `
                        <tr data-id="${e.id}">
                            <td>${getStatusBadge(e.status)}</td>
                            <td>
                                <span class="enquiry-customer-name">${escapeHtml(e.customer_name)}</span>
                            </td>
                            <td>
                                <a href="tel:${cleanPhoneNumber(e.phone)}" class="enquiry-contact-link" title="Call Customer">
                                    📞 ${escapeHtml(e.phone)}
                                </a>
                                ${e.email ? `
                                    <br>
                                    <a href="mailto:${escapeHtml(e.email)}" class="enquiry-contact-link" style="font-size: 0.76rem;" title="Email Customer">
                                        ✉️ ${escapeHtml(e.email)}
                                    </a>
                                ` : ''}
                            </td>
                            <td>
                                <span class="enquiry-service-badge">
                                    ${escapeHtml(e.service_type || 'General Consultation')}
                                </span>
                            </td>
                            <td>
                                <div class="enquiry-msg-snippet" title="${escapeHtml(e.message || '')}">
                                    ${escapeHtml(e.message || '—')}
                                </div>
                            </td>
                            <td>
                                <span class="enquiry-date-text">${formatDate(e.created_at)}</span>
                            </td>
                            <td>
                                <div style="display: flex; gap: 0.4rem;">
                                    <button type="button" class="btn-action-icon btn-view-enquiry" data-id="${e.id}">
                                        👁️ View
                                    </button>
                                    <button type="button" class="btn-action-icon danger btn-delete-enquiry" data-id="${e.id}" title="Delete Lead">
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    attachEnquiryListeners();
}

/**
 * Attaches event listeners to rendered enquiry rows.
 */
function attachEnquiryListeners() {
    // View Details Modal
    document.querySelectorAll('.btn-view-enquiry').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const enq = enquiriesData.find(item => item.id === id);
            if (enq) openEnquiryDetailModal(enq);
        });
    });

    // Delete Enquiry
    document.querySelectorAll('.btn-delete-enquiry').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const enq = enquiriesData.find(item => item.id === id);
            if (enq) openDeleteEnquiryModal(enq);
        });
    });
}

/**
 * Opens Enquiry Detail modal.
 * @param {object} enq 
 */
export function openEnquiryDetailModal(enq) {
    viewingEnquiry = enq;
    const modal = document.getElementById('enquiry-detail-modal');
    if (!modal) return;

    // Populate metadata
    document.getElementById('enquiry-detail-name').textContent = enq.customer_name;
    document.getElementById('enquiry-detail-phone').textContent = enq.phone;
    document.getElementById('enquiry-detail-email').textContent = enq.email || 'None Provided';
    document.getElementById('enquiry-detail-service').textContent = enq.service_type || 'General Consultation';
    document.getElementById('enquiry-detail-date').textContent = formatDate(enq.created_at);
    document.getElementById('enquiry-detail-id').textContent = enq.id;
    document.getElementById('enquiry-detail-message').textContent = enq.message || '(No detailed message supplied)';

    // Direct Action Links
    const cleanPhone = cleanPhoneNumber(enq.phone);
    const callBtn = document.getElementById('enquiry-action-call');
    const waBtn = document.getElementById('enquiry-action-whatsapp');
    const emailBtn = document.getElementById('enquiry-action-email');

    if (callBtn) callBtn.href = `tel:${cleanPhone}`;
    if (waBtn) waBtn.href = `https://wa.me/${cleanPhone}`;
    if (emailBtn) {
        if (enq.email) {
            emailBtn.href = `mailto:${enq.email}`;
            emailBtn.style.display = 'inline-flex';
        } else {
            emailBtn.style.display = 'none';
        }
    }

    // Status Selector dropdown
    const statusSelect = document.getElementById('enquiry-status-select');
    if (statusSelect) {
        statusSelect.innerHTML = PERMITTED_STATUSES.map(s => `
            <option value="${s.value}" ${enq.status === s.value ? 'selected' : ''}>
                ${s.label}
            </option>
        `).join('');
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Closes Enquiry Detail modal.
 */
function closeEnquiryDetailModal() {
    const modal = document.getElementById('enquiry-detail-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    viewingEnquiry = null;
}

/**
 * Updates status of an enquiry in Supabase.
 * Enforces valid status transition.
 */
async function handleStatusUpdate() {
    if (!viewingEnquiry) return;

    const statusSelect = document.getElementById('enquiry-status-select');
    const saveBtn = document.getElementById('btn-save-enquiry-status');
    const newStatus = statusSelect?.value;

    if (!newStatus || !PERMITTED_STATUSES.some(s => s.value === newStatus)) {
        showNotification('Invalid status value provided.', 'error');
        return;
    }

    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Updating...';
        }

        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client is not available.');

        const { error } = await supabase
            .from('enquiries')
            .update({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', viewingEnquiry.id);

        if (error) throw error;

        viewingEnquiry.status = newStatus;
        updateStatsBar();
        renderEnquiriesList();
        showNotification(`Lead status updated to "${newStatus.replace('_', ' ')}".`, 'success');
        closeEnquiryDetailModal();
        window.dispatchEvent(new CustomEvent('admin:data-changed'));
        window.dispatchEvent(new CustomEvent('admin-data-changed'));

    } catch (err) {
        console.error('[Admin Enquiries] Status update failed.');
        showNotification(`Failed to update status: ${err.message}`, 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Update Status';
        }
    }
}

/**
 * Opens Delete Confirmation modal for an enquiry.
 * @param {object} enq 
 */
function openDeleteEnquiryModal(enq) {
    deletingEnquiryId = enq.id;
    const modal = document.getElementById('enquiry-delete-modal');
    const titleEl = document.getElementById('delete-enquiry-customer');
    const phoneEl = document.getElementById('delete-enquiry-phone');

    if (!modal) return;

    if (titleEl) titleEl.textContent = enq.customer_name;
    if (phoneEl) phoneEl.textContent = `${enq.phone} • ${enq.service_type || 'Consultation'}`;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Closes Delete Enquiry modal.
 */
function closeDeleteEnquiryModal() {
    const modal = document.getElementById('enquiry-delete-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    deletingEnquiryId = null;
}

/**
 * Handles confirmed deletion of an enquiry.
 */
async function handleConfirmDeleteEnquiry() {
    if (!deletingEnquiryId) return;

    const confirmBtn = document.getElementById('btn-confirm-delete-enquiry');
    const confirmBtnText = document.getElementById('btn-confirm-delete-enq-text');

    try {
        if (confirmBtn) confirmBtn.disabled = true;
        if (confirmBtnText) confirmBtnText.textContent = 'Deleting...';

        const supabase = await getSupabase();
        if (!supabase) throw new Error('Supabase client is not available.');

        const { error } = await supabase
            .from('enquiries')
            .delete()
            .eq('id', deletingEnquiryId);

        if (error) throw error;

        showNotification('Consultation lead record deleted.', 'success');
        closeDeleteEnquiryModal();
        await loadEnquiries();
        window.dispatchEvent(new CustomEvent('admin:data-changed'));
        window.dispatchEvent(new CustomEvent('admin-data-changed'));

    } catch (err) {
        console.error('[Admin Enquiries] Delete error occurred.');
        showNotification(`Failed to delete enquiry: ${err.message}`, 'error');
    } finally {
        if (confirmBtn) confirmBtn.disabled = false;
        if (confirmBtnText) confirmBtnText.textContent = 'Delete Record';
    }
}

/**
 * Initializes Enquiries module listeners and triggers initial fetch.
 */
export function initEnquiriesModule() {
    // 01. Refresh
    const refreshBtn = document.getElementById('btn-refresh-enquiries');
    if (refreshBtn) refreshBtn.addEventListener('click', loadEnquiries);

    // 02. Close Detail Modal
    const closeDetailBtn = document.getElementById('btn-close-enquiry-modal');
    const backdropDetail = document.getElementById('enquiry-detail-modal-backdrop');
    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeEnquiryDetailModal);
    if (backdropDetail) backdropDetail.addEventListener('click', closeEnquiryDetailModal);

    // 03. Status Update Button in Detail Modal
    const saveStatusBtn = document.getElementById('btn-save-enquiry-status');
    if (saveStatusBtn) saveStatusBtn.addEventListener('click', handleStatusUpdate);

    // 04. Close Delete Modal
    const closeDelBtn = document.getElementById('btn-close-enq-del-modal');
    const cancelDelBtn = document.getElementById('btn-cancel-enq-del-modal');
    const delBackdrop = document.getElementById('enquiry-del-modal-backdrop');
    const confirmDelBtn = document.getElementById('btn-confirm-delete-enquiry');
    if (closeDelBtn) closeDelBtn.addEventListener('click', closeDeleteEnquiryModal);
    if (cancelDelBtn) cancelDelBtn.addEventListener('click', closeDeleteEnquiryModal);
    if (delBackdrop) delBackdrop.addEventListener('click', closeDeleteEnquiryModal);
    if (confirmDelBtn) confirmDelBtn.addEventListener('click', handleConfirmDeleteEnquiry);

    // 05. Search and Filter listeners
    const searchInput = document.getElementById('enquiries-search-input');
    const statusFilter = document.getElementById('enquiries-status-filter');
    const serviceFilter = document.getElementById('enquiries-service-filter');
    const sortOrder = document.getElementById('enquiries-sort-order');

    if (searchInput) searchInput.addEventListener('input', renderEnquiriesList);
    if (statusFilter) statusFilter.addEventListener('change', renderEnquiriesList);
    if (serviceFilter) serviceFilter.addEventListener('change', renderEnquiriesList);
    if (sortOrder) sortOrder.addEventListener('change', loadEnquiries);

    // 06. Notification Close
    const notifClose = document.getElementById('btn-close-enquiry-notification');
    if (notifClose) notifClose.addEventListener('click', hideNotification);

    // 07. Initial fetch
    loadEnquiries();
}
