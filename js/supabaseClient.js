/**
 * SAI INDIRABALA FURNITURE - SUPABASE CLIENT INITIALIZER
 * Browser-native Vanilla ES6 Module (Zero build step, Zero npm bundling).
 * Connects securely using public Supabase Publishable / Anon Key.
 * NEVER imports or exposes the service_role key.
 */

import { CONFIG, isConfigured, getSubmitEnquiryEndpoint } from './config.js';

// Singleton instance cache
let supabaseInstance = null;
let initPromise = null;

/**
 * Dynamically resolves createClient from window or official ESM CDN.
 * @returns {Promise<Function>}
 */
async function resolveCreateClient() {
    // 1. Check if Supabase JS SDK was loaded via global script tag
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        return window.supabase.createClient;
    }

    // 2. Load official ESM module directly into browser runtime
    try {
        const module = await import('https://esm.sh/@supabase/supabase-js@2');
        if (module && typeof module.createClient === 'function') {
            return module.createClient;
        }
        throw new Error('createClient not found in imported module');
    } catch (err) {
        // Fallback CDN if esm.sh is unreachable
        try {
            const fallbackModule = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
            return fallbackModule.createClient;
        } catch (fallbackErr) {
            console.warn('[SIB Supabase] Unable to load Supabase JS SDK from CDN. Operating in offline/degraded mode.');
            return null;
        }
    }
}

/**
 * Returns the initialized Supabase client instance or null if unconfigured.
 * Handles missing configuration gracefully without throwing uncaught runtime errors.
 * @returns {Promise<any|null>}
 */
export async function getSupabase() {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    if (!isConfigured()) {
        // Safe, non-intrusive warning with zero secret disclosure
        return null;
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        try {
            const createClient = await resolveCreateClient();
            if (!createClient) {
                return null;
            }

            supabaseInstance = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });

            return supabaseInstance;
        } catch (err) {
            console.warn('[SIB Supabase] Initialization error. Client operates in fallback mode.');
            return null;
        }
    })();

    return initPromise;
}

export { isConfigured, getSubmitEnquiryEndpoint, CONFIG };
