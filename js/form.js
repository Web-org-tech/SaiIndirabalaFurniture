/**
 * SAI INDIRABALA FURNITURE - FORM HANDLER
 * Validates inquiry details, shows a toast popup on success.
 * Zero redirects — all confirmation happens on-page.
 */

// ── Toast Notification Helper ─────────────────────────────────────────────────
function showToast(title, desc, durationMs = 5000) {
    // Remove any existing toast
    const existing = document.getElementById('sib-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'sib-toast';
    toast.className = 'toast-notification';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `
        <div class="toast-icon">✓</div>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <div class="toast-desc">${desc}</div>
        </div>
        <button class="toast-close" aria-label="Dismiss notification">✕</button>
    `;

    document.body.appendChild(toast);

    // Trigger animation (needs a tick to let paint fire)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));

    // Auto-dismiss after duration
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

    const nameInput   = contactForm.querySelector('#user-name');
    const phoneInput  = contactForm.querySelector('#user-phone');
    const typeSelect  = contactForm.querySelector('#project-type');
    const messageInput = contactForm.querySelector('#user-message');

    function showError(input, errorElementId, message) {
        input.classList.add('error');
        const errEl = document.getElementById(errorElementId);
        if (errEl) {
            errEl.textContent = message;
            errEl.classList.add('visible');
        }
    }

    function clearError(input, errorElementId) {
        input.classList.remove('error');
        const errEl = document.getElementById(errorElementId);
        if (errEl) {
            errEl.textContent = '';
            errEl.classList.remove('visible');
        }
    }

    // Real-time field clearing on input
    [nameInput, phoneInput, typeSelect, messageInput].forEach(el => {
        if (!el) return;
        el.addEventListener('input',  () => clearError(el, `${el.id}-error`));
        el.addEventListener('change', () => clearError(el, `${el.id}-error`));
    });

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;

        // Validate Name
        const userName = nameInput.value.trim();
        if (!userName || userName.length < 2) {
            showError(nameInput, 'user-name-error', 'Please enter your full name');
            isValid = false;
        } else {
            clearError(nameInput, 'user-name-error');
        }

        // Validate Phone
        const cleanPhone = phoneInput.value.replace(/[\s\-\+]/g, '');
        if (!cleanPhone || cleanPhone.length < 10) {
            showError(phoneInput, 'user-phone-error', 'Please enter a valid 10-digit phone number');
            isValid = false;
        } else {
            clearError(phoneInput, 'user-phone-error');
        }

        // Validate Project Type
        if (!typeSelect.value) {
            showError(typeSelect, 'project-type-error', 'Please select a project type');
            isValid = false;
        } else {
            clearError(typeSelect, 'project-type-error');
        }

        if (!isValid) return;

        // Loading state on button
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            <span>Sending...</span>
        `;

        // Save to localStorage for record keeping
        try {
            const existing = JSON.parse(localStorage.getItem('sib_inquiries') || '[]');
            existing.push({
                name: userName,
                phone: cleanPhone,
                projectType: typeSelect.options[typeSelect.selectedIndex].text,
                details: messageInput?.value.trim() || '',
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('sib_inquiries', JSON.stringify(existing));
        } catch (_) {}

        // Simulate brief processing then show toast
        setTimeout(() => {
            // Reset form
            contactForm.reset();
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;

            // 🎉 Show success toast popup
            showToast(
                '✓ Request Received!',
                `Thank you, ${userName}. Our team will call you at ${cleanPhone} within 2 hours.`
            );
        }, 450);
    });
}
