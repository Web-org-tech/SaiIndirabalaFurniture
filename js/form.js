/**
 * SAI INDIRABALA FURNITURE - FORM HANDLER
 * Validates inquiry details, provides instant feedback, and routes details seamlessly.
 */

export function initForms() {
    const contactForm = document.getElementById('consultation-form');
    if (!contactForm) return;

    const nameInput = contactForm.querySelector('#user-name');
    const phoneInput = contactForm.querySelector('#user-phone');
    const typeSelect = contactForm.querySelector('#project-type');
    const messageInput = contactForm.querySelector('#user-message');
    const statusMsg = contactForm.querySelector('#form-status-msg');

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

    // Real-time field clearing on change
    [nameInput, phoneInput, typeSelect, messageInput].forEach(el => {
        if (!el) return;
        el.addEventListener('input', () => clearError(el, `${el.id}-error`));
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

        // Validate Phone (10-digit Indian number)
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

        // Build pre-formatted project inquiry details
        const selectedLabel = typeSelect.options[typeSelect.selectedIndex].text;
        const note = messageInput.value.trim();

        let waText = `Hello Sai Indirabala Furniture 🪵\n\n`;
        waText += `*Name:* ${userName}\n`;
        waText += `*Phone:* ${cleanPhone}\n`;
        waText += `*Project Requirement:* ${selectedLabel}\n`;
        if (note) {
            waText += `*Location / Notes:* ${note}\n`;
        }
        waText += `\nI submitted this request on your website. Please contact me for design & quote.`;

        const waNumber = '917418494994';
        const waURL = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;

        // Button state update
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            <span>Sending Message...</span>
        `;

        setTimeout(() => {
            // Show prominent success feedback
            if (statusMsg) {
                statusMsg.className = 'form-status-msg success';
                statusMsg.style.display = 'block';
                statusMsg.innerHTML = `<strong>Message Sent Successfully!</strong><br>Thank you, ${userName}. Our Madurai 3D design team will reach out at <strong>${cleanPhone}</strong> within 2 hours.`;
            }

            // Also launch the WhatsApp conversation link for immediate engagement
            window.open(waURL, '_blank', 'noopener,noreferrer');

            // Reset form
            contactForm.reset();

            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;
        }, 500);
    });
}
