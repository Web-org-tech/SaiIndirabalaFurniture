-- ==============================================================================
-- SAI INDIRABALA FURNITURE & INTERIORS
-- Migration 004: Supabase Storage Setup & Row Level Security Policies
-- Database: PostgreSQL 15+ (Supabase)
-- Domain: https://saiindirabala.in/
-- Description: Configures 'media' storage bucket and strict RLS policies for uploads.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 01. CREATE OR UPDATE 'media' BUCKET
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    5242880, -- 5 Megabytes maximum per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[];

-- ------------------------------------------------------------------------------
-- 02. PUBLIC READ ACCESS POLICY
-- Enables fast public retrieval for hero banners, products, catalog & gallery.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public media read access" ON storage.objects;
CREATE POLICY "Public media read access"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'media');

-- ------------------------------------------------------------------------------
-- 03. ADMINISTRATOR UPLOAD ACCESS POLICY
-- Restricts file upload strictly to authenticated users verified in public.admin_users.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
CREATE POLICY "Admins can upload media"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'media'
        AND public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 04. ADMINISTRATOR UPDATE ACCESS POLICY
-- Allows verified administrators to overwrite or update existing media items.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
CREATE POLICY "Admins can update media"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'media'
        AND public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 05. ADMINISTRATOR DELETE ACCESS POLICY
-- Allows verified administrators to remove obsolete media objects.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;
CREATE POLICY "Admins can delete media"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'media'
        AND public.is_admin()
    );
