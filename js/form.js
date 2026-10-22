/**
 * SAI INDIRABALA FURNITURE - ASYNCHRONOUS FORM HANDLER
 * Connects consultation form to Supabase Edge Function (submit-enquiry).
 * Includes duplicate submission prevention, server validation, error recovery,
 * and zero localStorage storage of sensitive customer PII.
 */

import { getSubmitEnquiryEndpoint, getSupabase, isConfigured } from './supabaseClient.js';
import { trackEvent } from './publicCommon.js';

// ── Toast Notification Helper ─────────────────────────────────────────────────
function showToast(title, desc, durationMs = 5000, isError = false) {
    const existing = document.getElementById('sib-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'sib-toast';
    toast.className = `toast-notification ${isError ? 'toast-error' : ''}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `
        <div class="toast-icon">${isError ? '✕' : '✓'}</div>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <div class="toast-desc">${desc}</div>
        </div>
        <button class="toast-close" aria-label="Dismiss notification">✕</button>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });

    toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));

    const timer = setTimeout(() => dismissToast(toast), durationMs);
    toast._timer = timer;
}

function dismissToast(toast) {
    if (!toast) return;
    clearTimeout(toast._timer);
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 380);
}

// ── Form Handler ──────────────────────────────────────────────────────────────
export function initForms() {
    const contactForm = document.getElementById('consultation-form');
    if (!contactForm) return;

    const nameInput    = contactForm.querySelector('#user-name');
    const phoneInput   = contactForm.querySelector('#user-phone');
    const typeSelect   = contactForm.querySelector('#project-type');
    const messageInput = contactForm.querySelector('#user-message');
    const statusMsgEl  = document.getElementById('form-status-msg');

    // Dynamically insert invisible honeypot field for bot deterrence
    let honeypot = contactForm.querySelector('input[name="website_hp"]');
    if (!honeypot) {
        honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = 'website_hp';
        honeypot.tabIndex = -1;
        honeypot.autocomplete = 'off';
        honeypot.style.cssText = 'position:absolute;left:-9999px;opacity:0;height:0;width:0;pointer-events:none;';
        honeypot.setAttribute('aria-hidden', 'true');
        contactForm.appendChild(honeypot);
    }

    function showError(input, errorElementId, message) {
        if (input) input.classList.add('error');
        const errEl = document.getElementById(errorElementId);
        if (errEl) {
            errEl.textContent = message;
            errEl.classList.add('visible');
        }
    }

    function clearError(input, errorElementId) {
        if (input) input.classList.remove('error');
        const errEl = document.getElementById(errorElementId);
        if (errEl) {
            errEl.textContent = '';
            errEl.classList.remove('visible');
        }
    }

    function updateStatusBanner(message, isError = false) {
        if (!statusMsgEl) return;
        if (!message) {
            statusMsgEl.textContent = '';
            statusMsgEl.className = 'form-status-msg';
            return;
        }
        statusMsgEl.textContent = message;
        statusMsgEl.className = `form-status-msg ${isError ? 'error-banner' : 'success-banner'} visible`;
    }

    // Real-time error clearing on input
    [nameInput, phoneInput, typeSelect, messageInput].forEach(el => {
        if (!el) return;
        el.addEventListener('input', () => {
            clearError(el, `${el.id}-error`);
            updateStatusBanner('');
        });
        el.addEventListener('change', () => {
            clearError(el, `${el.id}-error`);
            updateStatusBanner('');
        });
    });

    let isSubmitting = false;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Prevent duplicate concurrent submissions
        if (isSubmitting) return;

        let isValid = true;
        updateStatusBanner('');

        // 01. Client-Side Validation: Name
        const userName = nameInput.value.trim();
        if (!userName || userName.length < 2) {
            showError(nameInput, 'user-name-error', 'Please enter your full name (minimum 2 characters)');
            isValid = false;
        } else {
            clearError(nameInput, 'user-name-error');
        }

        // 02. Client-Side Validation: Phone
        const cleanPhone = phoneInput.value.replace(/[\s\-\+]/g, '');
        if (!cleanPhone || cleanPhone.length < 10 || !/^\d{10,15}$/.test(cleanPhone)) {
            showError(phoneInput, 'user-phone-error', 'Please enter a valid 10-digit mobile number');
            isValid = false;
        } else {
            clearError(phoneInput, 'user-phone-error');
        }

        // 03. Client-Side Validation: Project Type
        if (!typeSelect.value) {
            showError(typeSelect, 'project-type-error', 'Please select a furniture requirement');
            isValid = false;
        } else {
            clearError(typeSelect, 'project-type-error');
        }

        if (!isValid) return;

        // Track privacy-safe form submission initiation (strictly no PII)
        trackEvent('form_submit', {
            form_name: 'consultation_form',
            project_type: typeSelect.value
        });

        // 04. UI Loading State & Lock
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn.innerHTML;
        isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                <path d="M12 2a10 10 0 0110 10" stroke-linecap="round"/>
            </svg>
            <span>Sending...</span>
        `;

        const payload = {
            customer_name: userName,
            name: userName,
            phone: cleanPhone,
            service_type: typeSelect.value,
            projectType: typeSelect.value,
            message: messageInput?.value.trim() || '',
            website_hp: honeypot.value
        };

        const edgeEndpoint = getSubmitEnquiryEndpoint();

        try {
            let submissionSucceeded = false;
            let responseMessage = '';

            // SUBMIT VIA SECURE SUPABASE EDGE FUNCTION
            if (edgeEndpoint && isConfigured()) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

                try {
                    const response = await fetch(edgeEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload),
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    const data = await response.json().catch(() => ({}));

                    if (response.ok && data.success) {
                        submissionSucceeded = true;
                        responseMessage = data.message;
                    } else if (response.status === 422 || response.status === 400) {
                        throw new Error(data.error || 'Please check the details entered and try again.');
                    } else if (response.status === 429) {
                        throw new Error(data.error || 'Too many submissions. Please call us at +91 74184 94994.');
                    } else {
                        throw new Error('Our consultation service is temporarily unavailable. Please call +91 74184 94994 or tap WhatsApp below for immediate assistance.');
                    }
                } catch (fetchErr) {
                    clearTimeout(timeoutId);
                    if (fetchErr.name === 'AbortError') {
                        throw new Error('Connection timed out. Please call us directly at +91 74184 94994.');
                    }
                    throw fetchErr;
                }
            } else {
                // If Edge Function is unconfigured, prompt client with direct factory call
                updateStatusBanner(
                    'Online submission service is currently pending deployment. Please call our Madurai workshop directly at +91 7418 4949 94 or tap WhatsApp below.',
                    true
                );
                showToast(
                    'Direct Contact Available',
                    'Please call us directly at +91 74184 94994 or message us on WhatsApp below.',
                    6000,
                    false
                );
                return;
            }

            // ── SUCCESS CONFIRMATION ──────────────────────────────────────────
            if (submissionSucceeded) {
                // Dispatch privacy-safe lead generation event (strictly no customer PII)
                trackEvent('generate_lead', {
                    lead_source: 'consultation_form',
                    service_category: typeSelect.value
                });

                contactForm.reset();
                updateStatusBanner('');

                showToast(
                    '✓ Request Received!',
                    `Thank you, ${userName}. Our team will call you within 2 hours to confirm your consultation.`
                );
            }
        } catch (error) {
            console.error('[SIB Enquiry] Submission failed.');
            const userError = error.message || 'Unable to submit your request. Please call +91 74184 94994.';
            updateStatusBanner(userError, true);
            showToast('Submission Notice', userError, 6000, true);
        } finally {
            // Restore button state and unlock form
            isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
        }
    });
}
