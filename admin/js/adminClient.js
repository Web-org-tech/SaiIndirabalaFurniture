/**
 * SAI INDIRABALA FURNITURE - ADMIN CLIENT HELPER
 * Shared authorization and session utilities for the /admin/ portal.
 * Enforces trusted server-side administrator authorization.
 */

import { getSupabase, isConfigured, CONFIG } from '../../js/supabaseClient.js';

/**
 * Verifies whether the provided authenticated user is an authorized administrator.
 * Evaluates public.is_admin() RPC function or directly checks public.admin_users table.
 * Never relies on client-side state, browser cookies, or user-editable metadata.
 * 
 * @param {object} user - Supabase auth.users object
 * @returns {Promise<{isAdmin: boolean, role: string|null, error: string|null}>}
 */
export async function checkIsAdmin(user) {
    if (!user || !user.id) {
        return { isAdmin: false, role: null, error: 'No authenticated user session.' };
    }

    const supabase = await getSupabase();
    if (!supabase) {
        return { isAdmin: false, role: null, error: 'Supabase client is not configured.' };
    }

    try {
        // Strategy A: Call the security-definer public.is_admin() RPC function
        const { data: rpcResult, error: rpcError } = await supabase.rpc('is_admin');

        if (!rpcError && typeof rpcResult === 'boolean') {
            if (rpcResult === true) {
                // Fetch the role title if authorized
                const { data: roleRow } = await supabase
                    .from('admin_users')
                    .select('role')
                    .eq('user_id', user.id)
                    .maybeSingle();

                return { 
                    isAdmin: true, 
                    role: roleRow?.role || 'admin', 
                    error: null 
                };
            }
            return { isAdmin: false, role: null, error: 'User is not listed in admin_users.' };
        }

        // Strategy B: Fallback query directly against public.admin_users
        const { data: adminRow, error: queryError } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

        if (queryError) {
            console.error('[Admin Authorization Error]:', queryError.message);
            return { isAdmin: false, role: null, error: 'Database authorization check failed.' };
        }

        if (adminRow && adminRow.role) {
            return { isAdmin: true, role: adminRow.role, error: null };
        }

        return { isAdmin: false, role: null, error: 'User is not registered as an administrator.' };
    } catch (err) {
        console.error('[Admin Authorization Exception]:', err.message);
        return { isAdmin: false, role: null, error: err.message };
    }
}

/**
 * Safely signs out the current admin session.
 * @returns {Promise<void>}
 */
export async function signOutAdmin() {
    try {
        const supabase = await getSupabase();
        if (supabase) {
            await supabase.auth.signOut();
        }
    } catch (err) {
        console.error('[Admin SignOut Error]:', err.message);
    }
}

/**
 * Gets the current active session.
 * @returns {Promise<object|null>}
 */
export async function getAdminSession() {
    if (!isConfigured()) return null;
    const supabase = await getSupabase();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

export { getSupabase, isConfigured, CONFIG };
