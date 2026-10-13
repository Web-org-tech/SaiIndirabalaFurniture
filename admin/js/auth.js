/**
 * SAI INDIRABALA FURNITURE - ADMIN AUTHENTICATION CONTROLLER
 * Handles administrator sign-in, password visibility toggle,
 * authorization verification, and redirect coordination.
 */

import { getSupabase, isConfigured, checkIsAdmin, getAdminSession } from './adminClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('admin-login-form');
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    const togglePasswordBtn = document.getElementById('toggle-password-btn');
    const submitBtn = document.getElementById('login-submit-btn');
    const errorBanner = document.getElementById('login-error-banner');
    const configNotice = document.getElementById('config-warning-banner');

    function showError(message) {
        if (!errorBanner) return;
        errorBanner.textContent = message;
        errorBanner.style.display = 'block';
        errorBanner.classList.add('visible');
    }

    function clearError() {
        if (!errorBanner) return;
        errorBanner.textContent = '';
        errorBanner.style.display = 'none';
        errorBanner.classList.remove('visible');
    }

    // 01. Check for incoming URL redirect parameters / errors
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam === 'unauthorized') {
        showError('Access Denied: Your account is authenticated, but is not registered in the public.admin_users table.');
    } else if (errorParam === 'session_required') {
        showError('Session expired or required. Please sign in to access the management portal.');
    } else if (errorParam === 'auth_error') {
        showError('Authentication verification failed. Please sign in again.');
    }

    // 02. Verify Supabase configuration state
    if (!isConfigured()) {
        if (configNotice) {
            configNotice.style.display = 'block';
            configNotice.classList.add('visible');
        }
    } else {
        if (configNotice) {
            configNotice.style.display = 'none';
            configNotice.classList.remove('visible');
        }
        // 03. Auto-redirect if an authorized administrator already has an active session
        try {
            const session = await getAdminSession();
            if (session && session.user) {
                const authCheck = await checkIsAdmin(session.user);
                if (authCheck.isAdmin) {
                    const redirect = urlParams.get('redirect') || 'dashboard.html';
                    window.location.replace(redirect);
                    return;
                }
            }
        } catch (_) {
            // Ignore background check failure on login page
        }
    }

    // 04. Show/Hide Password Toggle with Full Accessibility
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            togglePasswordBtn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
            togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
            togglePasswordBtn.classList.toggle('showing', isPassword);
        });
    }

    // Clear error on input
    [emailInput, passwordInput].forEach(input => {
        if (!input) return;
        input.addEventListener('input', clearError);
    });

    // 05. Login Form Submission Handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();

            const email = emailInput?.value.trim() || '';
            const password = passwordInput?.value || '';

            // Client-side format checks
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showError('Please enter a valid administrator email address.');
                emailInput?.focus();
                return;
            }

            if (!password || password.length < 6) {
                showError('Password must be at least 6 characters in length.');
                passwordInput?.focus();
                return;
            }

            if (!isConfigured()) {
                showError('Supabase configuration is pending. Please configure js/config.js with your project URL and Anon key.');
                return;
            }

            // Loading state
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                    <path d="M12 2a10 10 0 0110 10" stroke-linecap="round"/>
                </svg>
                <span>Authenticating...</span>
            `;

            try {
                const supabase = await getSupabase();
                if (!supabase) {
                    throw new Error('Supabase client failed to initialize.');
                }

                // ── STEP A: Supabase Authentication ───────────────────────────
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (signInError) {
                    throw signInError;
                }

                if (!data || !data.user) {
                    throw new Error('No user returned from authentication service.');
                }

                // ── STEP B: Trusted Administrator Authorization ───────────────
                const authCheck = await checkIsAdmin(data.user);

                if (!authCheck.isAdmin) {
                    // Immediately terminate unprivileged session
                    await supabase.auth.signOut();
                    showError(
                        'Access Denied: This account is authenticated in Supabase Auth, but is not registered in the public.admin_users table. Run the SQL provisioning command to authorize this email.'
                    );
                    return;
                }

                // ── STEP C: Authorized Redirect ───────────────────────────────
                submitBtn.innerHTML = `<span>✓ Authorized! Redirecting...</span>`;
                const redirectTarget = urlParams.get('redirect') || 'dashboard.html';
                window.location.replace(redirectTarget);

            } catch (err) {
                let userMessage = 'Authentication failed. Please verify your credentials.';
                if (err.message) {
                    if (err.message.includes('Invalid login credentials')) {
                        userMessage = 'Invalid email or password. Please verify your credentials and try again.';
                    } else if (err.message.includes('Email not confirmed')) {
                        userMessage = 'Account email has not been confirmed in Supabase Auth.';
                    } else {
                        userMessage = err.message;
                    }
                }
                showError(userMessage);
            } finally {
                if (submitBtn && !submitBtn.innerHTML.includes('Authorized')) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        });
    }
});
