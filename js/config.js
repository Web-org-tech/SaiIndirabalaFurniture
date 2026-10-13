/**
 * SAI INDIRABALA FURNITURE - CLIENT CONFIGURATION MODULE
 * Manages Supabase URL and Publishable / Anon Key.
 * Supports window.__ENV__ runtime injection or explicit configuration.
 * NEVER place private/secret keys (e.g. service_role) in this file!
 */

// Production & Local Environment Config
const env = typeof window !== 'undefined' && window.__ENV__ ? window.__ENV__ : {};

export const CONFIG = {
    // Supabase Project URL
    SUPABASE_URL: env.SUPABASE_URL || 'https://zmvjekdibzefguzjqoaj.supabase.co',

    // Supabase Public Publishable / Anon Key (Safe for browser client)
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptdmpla2RpYnplZmd1empxb2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODQzMzMsImV4cCI6MjEwNzM2MDMzM30.jHY4ElgvMjUaz9s1nPOmgVfyM1ZRCZ8IyjhdN9j7jIM',

    // Optional direct Edge Function URL override (defaults to ${SUPABASE_URL}/functions/v1/submit-enquiry)
    EDGE_FUNCTION_URL: env.SUPABASE_EDGE_FUNCTION_URL || '',

    // Official Production Website Domain for CORS & Redirects
    PRODUCTION_DOMAIN: 'https://saiindirabala.in'
};

/**
 * Checks whether Supabase credentials have been configured with valid non-placeholder strings.
 * @returns {boolean}
 */
export function isConfigured() {
    return Boolean(
        CONFIG.SUPABASE_URL && 
        CONFIG.SUPABASE_URL.startsWith('https://') &&
        CONFIG.SUPABASE_ANON_KEY &&
        CONFIG.SUPABASE_ANON_KEY.length > 20 &&
        !CONFIG.SUPABASE_URL.includes('your-project')
    );
}

/**
 * Returns the resolved endpoint for the submit-enquiry Edge Function.
 * @returns {string}
 */
export function getSubmitEnquiryEndpoint() {
    if (CONFIG.EDGE_FUNCTION_URL) {
        return CONFIG.EDGE_FUNCTION_URL;
    }
    if (CONFIG.SUPABASE_URL) {
        return `${CONFIG.SUPABASE_URL.replace(/\/$/, '')}/functions/v1/submit-enquiry`;
    }
    return '';
}
