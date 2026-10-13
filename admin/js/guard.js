/**
 * SAI INDIRABALA FURNITURE - ADMIN ROUTE GUARD
 * Protects administrative pages against unauthenticated and unauthorized access.
 * Enforces server-side is_admin() verification before revealing dashboard content.
 */

import { getAdminSession, checkIsAdmin, signOutAdmin, isConfigured } from './adminClient.js';

/**
 * Initializes route protection on a protected page.
 * Blocks DOM visibility until authorization is affirmatively confirmed.
 * 
 * @param {Function} onAuthorized - Callback invoked with (user, role) once authorization succeeds.
 */
export async function initRouteGuard(onAuthorized) {
    const loaderEl = document.getElementById('admin-guard-loader');
    const shellEl = document.getElementById('admin-app-shell');

    function showSetupPending() {
        if (loaderEl) loaderEl.style.display = 'none';
        const modal = document.createElement('div');
        modal.className = 'admin-notice-modal';
        modal.innerHTML = `
            <div class="admin-notice-card">
                <div class="notice-icon">⚙️</div>
                <h3>Supabase Configuration Required</h3>
                <p>The Supabase project credentials (URL & Anon Key) must be configured in <code>js/config.js</code> before accessing the management portal.</p>
                <div class="notice-actions">
                    <a href="../index.html" class="btn btn-secondary">Return to Website</a>
                    <a href="index.html" class="btn btn-primary">Go to Login Page</a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function redirectToLogin(reason = '') {
        const currentPath = window.location.pathname + window.location.search;
        let target = 'index.html';
        const params = new URLSearchParams();
        
        if (reason) {
            params.set('error', reason);
        }
        if (!currentPath.includes('index.html')) {
            params.set('redirect', currentPath);
        }

        const query = params.toString();
        if (query) {
            target += `?${query}`;
        }

        window.location.replace(target);
    }

    // 01. Check configuration
    if (!isConfigured()) {
        showSetupPending();
        return;
    }

    // 02. Verify active authentication session
    try {
        const session = await getAdminSession();
        if (!session || !session.user) {
            redirectToLogin('session_required');
            return;
        }

        // 03. Verify server-side administrator authorization
        const authResult = await checkIsAdmin(session.user);
        if (!authResult.isAdmin) {
            console.warn('[Admin Guard] Access denied. User is not an authorized administrator.');
            await signOutAdmin();
            redirectToLogin('unauthorized');
            return;
        }

        // 04. Access Confirmed: Reveal UI Shell & Call Initializer
        if (loaderEl) {
            loaderEl.style.opacity = '0';
            setTimeout(() => { loaderEl.style.display = 'none'; }, 200);
        }
        if (shellEl) {
            shellEl.classList.add('authorized');
        }
        document.body.classList.remove('guard-loading');

        if (typeof onAuthorized === 'function') {
            onAuthorized(session.user, authResult.role);
        }
    } catch (err) {
        console.error('[Admin Guard Exception]:', err.message);
        redirectToLogin('auth_error');
    }
}
