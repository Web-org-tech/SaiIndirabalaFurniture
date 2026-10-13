-- ==============================================================================
-- SAI INDIRABALA FURNITURE & INTERIORS
-- Migration 001: Initial Core Schema
-- Database: PostgreSQL 15+ (Supabase)
-- Domain: https://saiindirabala.in/
-- Description: Core tables, foreign keys, constraints, and audit triggers.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 00. EXTENSIONS & UTILITIES
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Generic updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 01. ADMIN USERS TABLE (Security & Role Management)
-- Dedicated table for trusted administrators. Never exposed publicly.
-- Prevents reliance on user-editable auth.users metadata.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.admin_users IS 'Approved administrative users verified against auth.users. Server-managed only.';

-- ------------------------------------------------------------------------------
-- 02. CATEGORIES TABLE
-- Stores primary furniture & interior service/product categories.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
    slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    description TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.categories IS 'Product categories (e.g. Office, Home Furniture, Modular Workstations, Institutions).';

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_published_order 
    ON public.categories (is_published, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_categories_slug 
    ON public.categories (slug);

-- Auto updated_at trigger
DROP TRIGGER IF EXISTS set_categories_timestamp ON public.categories;
CREATE TRIGGER set_categories_timestamp
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();

-- ------------------------------------------------------------------------------
-- 03. PRODUCTS TABLE
-- Catalog items belonging to categories with specifications and image gallery.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
    slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    short_description TEXT,
    description TEXT,
    image_url TEXT,
    gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(gallery_images) = 'array'),
    specifications JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(specifications) = 'object'),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.products IS 'Furniture and interior product catalog entries linked to categories.';

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category_id 
    ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_published_order 
    ON public.products (is_published, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_products_slug 
    ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_specifications_gin 
    ON public.products USING gin (specifications);
CREATE INDEX IF NOT EXISTS idx_products_gallery_images_gin 
    ON public.products USING gin (gallery_images);

-- Auto updated_at trigger
DROP TRIGGER IF EXISTS set_products_timestamp ON public.products;
CREATE TRIGGER set_products_timestamp
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();

-- ------------------------------------------------------------------------------
-- 04. HERO BANNERS TABLE
-- Dynamic homepage hero banners adhering to the 0/1/many behavioral rule.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hero_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    subtitle TEXT,
    image_url TEXT NOT NULL CHECK (char_length(trim(image_url)) > 0),
    button_text TEXT,
    button_link TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.hero_banners IS 'Homepage hero slider banners. 0=fallback, 1=static image, 2+=sliding carousel.';

-- Indexes for hero banners
CREATE INDEX IF NOT EXISTS idx_hero_banners_published_order 
    ON public.hero_banners (is_published, display_order ASC);

-- Auto updated_at trigger
DROP TRIGGER IF EXISTS set_hero_banners_timestamp ON public.hero_banners;
CREATE TRIGGER set_hero_banners_timestamp
    BEFORE UPDATE ON public.hero_banners
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();

-- ------------------------------------------------------------------------------
-- 05. OUR WORK GALLERY TABLE
-- Completed client project installations and 3D vs reality case studies.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.our_work_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(trim(title)) >= 2),
    description TEXT,
    image_url TEXT NOT NULL CHECK (char_length(trim(image_url)) > 0),
    category TEXT CHECK (category IS NULL OR char_length(trim(category)) > 0),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.our_work_gallery IS 'Real-site portfolio photographs and case studies across Tamil Nadu.';

-- Indexes for our work gallery
CREATE INDEX IF NOT EXISTS idx_our_work_gallery_published_order 
    ON public.our_work_gallery (is_published, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_our_work_gallery_category 
    ON public.our_work_gallery (category);

-- Auto updated_at trigger
DROP TRIGGER IF EXISTS set_our_work_gallery_timestamp ON public.our_work_gallery;
CREATE TRIGGER set_our_work_gallery_timestamp
    BEFORE UPDATE ON public.our_work_gallery
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();

-- ------------------------------------------------------------------------------
-- 06. ENQUIRIES TABLE
-- Client consultation requests captured from website forms.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL CHECK (char_length(trim(customer_name)) >= 2),
    phone TEXT NOT NULL CHECK (phone ~ '^[0-9+\s\-]{10,20}$'),
    email TEXT CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    service_type TEXT CHECK (service_type IS NULL OR char_length(trim(service_type)) > 0),
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'converted', 'closed', 'spam')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.enquiries IS 'Customer consultation inquiries. Strictly confidential; accessible only to administrators.';

-- Indexes for enquiries
CREATE INDEX IF NOT EXISTS idx_enquiries_status_created 
    ON public.enquiries (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_phone 
    ON public.enquiries (phone);

-- Auto updated_at trigger
DROP TRIGGER IF EXISTS set_enquiries_timestamp ON public.enquiries;
CREATE TRIGGER set_enquiries_timestamp
    BEFORE UPDATE ON public.enquiries
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();
