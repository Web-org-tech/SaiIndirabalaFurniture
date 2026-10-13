-- ==============================================================================
-- SAI INDIRABALA FURNITURE & INTERIORS
-- Migration 002: Row Level Security (RLS) Policies & Authorization
-- Database: PostgreSQL 15+ (Supabase)
-- Domain: https://saiindirabala.in/
-- Description: Strict RLS policies, security definer admin check, and abuse guards.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 01. AUTHORIZATION FUNCTION
-- Evaluates whether the currently authenticated session belongs to a verified admin.
-- Runs with SECURITY DEFINER to safely read public.admin_users.
-- Pinned search_path = public prevents search-path hijacking attacks.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.admin_users 
        WHERE user_id = auth.uid()
    );
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if the authenticated user is listed in public.admin_users.';

-- Grant execution to authenticated and anon (required for RLS evaluation)
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 02. ENABLE RLS ON ALL TABLES
-- Guarantees default-deny posture across all tables.
-- ------------------------------------------------------------------------------
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.our_work_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 03. ADMIN USERS TABLE POLICIES
-- Only verified administrators can view or manage administrator accounts.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
CREATE POLICY "Admins can view admin users"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;
CREATE POLICY "Admins can manage admin users"
    ON public.admin_users
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 04. CATEGORIES POLICIES
-- Public: Read published categories only.
-- Admins: Full read (including unpublished draft categories) and write access.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published categories" ON public.categories;
CREATE POLICY "Public can view published categories"
    ON public.categories
    FOR SELECT
    TO public
    USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
    ON public.categories
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
    ON public.categories
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
    ON public.categories
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 05. PRODUCTS POLICIES
-- Public: Read published products only.
-- Admins: Full read (including unpublished products) and write access.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published products" ON public.products;
CREATE POLICY "Public can view published products"
    ON public.products
    FOR SELECT
    TO public
    USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
    ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
    ON public.products
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
    ON public.products
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 06. HERO BANNERS POLICIES
-- Public: Read published banners only.
-- Admins: Full read and management access.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published hero banners" ON public.hero_banners;
CREATE POLICY "Public can view published hero banners"
    ON public.hero_banners
    FOR SELECT
    TO public
    USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert hero banners" ON public.hero_banners;
CREATE POLICY "Admins can insert hero banners"
    ON public.hero_banners
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update hero banners" ON public.hero_banners;
CREATE POLICY "Admins can update hero banners"
    ON public.hero_banners
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete hero banners" ON public.hero_banners;
CREATE POLICY "Admins can delete hero banners"
    ON public.hero_banners
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 07. OUR WORK GALLERY POLICIES
-- Public: Read published portfolio gallery items only.
-- Admins: Full read and management access.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published gallery items" ON public.our_work_gallery;
CREATE POLICY "Public can view published gallery items"
    ON public.our_work_gallery
    FOR SELECT
    TO public
    USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert gallery items" ON public.our_work_gallery;
CREATE POLICY "Admins can insert gallery items"
    ON public.our_work_gallery
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update gallery items" ON public.our_work_gallery;
CREATE POLICY "Admins can update gallery items"
    ON public.our_work_gallery
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete gallery items" ON public.our_work_gallery;
CREATE POLICY "Admins can delete gallery items"
    ON public.our_work_gallery
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 08. ENQUIRIES POLICIES
-- Security Mandate:
-- 1. Anonymous and unprivileged users CAN NEVER READ, UPDATE, or DELETE enquiries.
-- 2. Public users can ONLY INSERT new enquiries.
-- 3. In direct insert mode, strict WITH CHECK constraints enforce valid payload
--    and force status = 'new' (preventing callers from forging administrative statuses).
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view enquiries" ON public.enquiries;
CREATE POLICY "Admins can view enquiries"
    ON public.enquiries
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update enquiries" ON public.enquiries;
CREATE POLICY "Admins can update enquiries"
    ON public.enquiries
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete enquiries" ON public.enquiries;
CREATE POLICY "Admins can delete enquiries"
    ON public.enquiries
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- Public Insert Policy with strict defensive payload checks:
-- Forces status to 'new', validates minimum customer name length, and validates phone format.
DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;
CREATE POLICY "Public can submit enquiries"
    ON public.enquiries
    FOR INSERT
    TO public
    WITH CHECK (
        status = 'new' AND
        char_length(trim(customer_name)) >= 2 AND
        char_length(trim(customer_name)) <= 100 AND
        phone ~ '^[0-9+\s\-]{10,20}$'
    );
