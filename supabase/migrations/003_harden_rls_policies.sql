-- ==============================================================================
-- SAI INDIRABALA FURNITURE & INTERIORS
-- Proposed Migration 003: Hardened Row Level Security (RLS) Policies
-- Database: PostgreSQL 15+ (Supabase)
-- Domain: https://saiindirabala.in/
-- Status: PROPOSED (Requires explicit administrator approval prior to production execution)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 01. HARDEN PRODUCTS VISIBILITY POLICY
-- Issue Addressed: Guarantees that if a category is unpublished (is_published = false),
-- products belonging to that category are strictly hidden at the database RLS layer,
-- even if individual products have is_published = true.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published products" ON public.products;

CREATE POLICY "Public can view published products"
    ON public.products
    FOR SELECT
    TO public
    USING (
        (is_published = true AND EXISTS (
            SELECT 1 FROM public.categories c
            WHERE c.id = category_id AND c.is_published = true
        ))
        OR public.is_admin()
    );

COMMENT ON POLICY "Public can view published products" ON public.products IS 
    'Allows public read access only to published products whose parent category is also published. Admins retain full visibility.';

-- ------------------------------------------------------------------------------
-- 02. HARDEN ENQUIRIES DIRECT INSERT POLICY
-- Security Mandate:
-- Consultation enquiries are designed to route through the secure submit-enquiry Edge Function
-- (which executes Honeypot bot detection, IP rate limiting, and server-side field validation).
-- Once the Edge Function is verified in production, direct client-side INSERT on public.enquiries
-- should be restricted to prevent bot spam bypasses.
-- ------------------------------------------------------------------------------
-- TO BE EXECUTED AFTER EDGE FUNCTION DEPLOYMENT CONFIRMATION:
-- DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;
--
-- CREATE POLICY "Service role only for enquiries insertion"
--     ON public.enquiries
--     FOR INSERT
--     TO authenticated
--     WITH CHECK (public.is_admin());
