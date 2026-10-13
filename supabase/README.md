# Supabase Architecture & Security Documentation
### Sai Indirabala Furniture & Interiors
**Production Domain:** [https://saiindirabala.in/](https://saiindirabala.in/)  
**Environment:** Supabase PostgreSQL 15+  
**Architecture:** Zero-framework Vanilla HTML5/CSS3/ES6+ web application  

---

## 1. Overview & Table Schema Reference

The database foundation consists of 6 tables designed with strict PostgreSQL types, integrity constraints, and Row Level Security (RLS) policies:

```
┌─────────────────┐       ┌─────────────────┐
│   categories    │◀──────│    products     │
└─────────────────┘ 1   * └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  hero_banners   │       │our_work_gallery │
└─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│   admin_users   │       │    enquiries    │
└─────────────────┘       └─────────────────┘
```

### 1.1 `public.categories`
Stores furniture and interior service/product groupings (e.g., Office Furniture, Custom Home Furniture, Institution & College Furniture, Modular Workstations, Readymade Showroom).
- `id` (`UUID PK`): Generated via `gen_random_uuid()`.
- `name` (`TEXT NOT NULL`): Category display name (min length: 2 chars).
- `slug` (`TEXT NOT NULL UNIQUE`): URL-friendly identifier matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- `description` (`TEXT`): One-line summary and descriptive overview.
- `image_url` (`TEXT`): Direct URL to category banner or thumbnail.
- `display_order` (`INTEGER NOT NULL DEFAULT 0`): Ascending sort rank for category display.
- `is_published` (`BOOLEAN NOT NULL DEFAULT true`): Controls public visibility.
- `created_at` / `updated_at` (`TIMESTAMPTZ`): UTC timestamps, updated automatically via trigger.

### 1.2 `public.products`
Individual furniture catalog items belonging to a category.
- `id` (`UUID PK`): Generated via `gen_random_uuid()`.
- `category_id` (`UUID NOT NULL FK`): References `categories(id)` with `ON DELETE RESTRICT` to protect against accidental orphan cascades.
- `name` (`TEXT NOT NULL`): Product title.
- `slug` (`TEXT NOT NULL UNIQUE`): URL slug matching lowercase hyphenated format.
- `short_description` (`TEXT`): Concise summary for product cards.
- `description` (`TEXT`): Full specifications and description.
- `image_url` (`TEXT`): Primary showcase photograph.
- `gallery_images` (`JSONB NOT NULL DEFAULT '[]'`): Array of secondary photo URLs.
- `specifications` (`JSONB NOT NULL DEFAULT '{}'`): Key-value attributes (dimensions, wood type, hardware, warranty).
- `display_order` (`INTEGER NOT NULL DEFAULT 0`): Sort rank within category.
- `is_published` (`BOOLEAN NOT NULL DEFAULT true`): Controls public visibility.
- `created_at` / `updated_at` (`TIMESTAMPTZ`): UTC timestamps.

### 1.3 `public.hero_banners`
Dynamic hero section banner images and CTAs powering the homepage hero.
- `id` (`UUID PK`): Unique identifier.
- `title` (`TEXT`): Primary banner heading.
- `subtitle` (`TEXT`): Supporting copy.
- `image_url` (`TEXT NOT NULL`): Direct URL to high-resolution banner photo.
- `button_text` (`TEXT`): Call-to-action button label.
- `button_link` (`TEXT`): Call-to-action anchor or route.
- `display_order` (`INTEGER NOT NULL DEFAULT 0`): Sorting position in carousel.
- `is_published` (`BOOLEAN NOT NULL DEFAULT true`): Controls active publishing.
- `created_at` / `updated_at` (`TIMESTAMPTZ`): UTC timestamps.

*Behavioral Engine Rule:*
- **0 published rows:** Fallback to existing static asset `images/hero/hero_furniture.png`.
- **1 published row:** Static single banner display (no carousel autoplay).
- **2+ published rows:** Circular sliding carousel with smooth transitions.

### 1.4 `public.our_work_gallery`
Portfolio records displaying completed sites, woodwork craftsmanship, and 3D vs Built Reality comparisons across Tamil Nadu.
- `id` (`UUID PK`): Unique identifier.
- `title` (`TEXT NOT NULL`): Project headline (e.g. "Director Cabin Setup", "Solid Teak Dining Unit").
- `description` (`TEXT`): Project highlights, materials, and city.
- `image_url` (`TEXT NOT NULL`): Direct URL to installation photograph.
- `category` (`TEXT`): Tag for filtering (e.g., "Office", "Home", "Institution", "Showroom").
- `display_order` (`INTEGER NOT NULL DEFAULT 0`): Visual sequence order.
- `is_published` (`BOOLEAN NOT NULL DEFAULT true`): Controls public visibility.
- `created_at` / `updated_at` (`TIMESTAMPTZ`): UTC timestamps.

### 1.5 `public.enquiries`
Customer consultation requests submitted through website contact forms. Strictly confidential.
- `id` (`UUID PK`): Unique identifier.
- `customer_name` (`TEXT NOT NULL`): Full client name (2–100 chars).
- `phone` (`TEXT NOT NULL`): Contact phone number matching `^[0-9+\s\-]{10,20}$`.
- `email` (`TEXT`): Optional valid email address.
- `service_type` (`TEXT`): Requirement type (e.g., 'office-arrangement', 'home-furniture', etc.).
- `message` (`TEXT`): Project scope, room dimensions, or location notes.
- `status` (`TEXT NOT NULL DEFAULT 'new'`): Regulated lifecycle: `'new'`, `'contacted'`, `'in_progress'`, `'converted'`, `'closed'`, `'spam'`.
- `ip_address` (`INET`): Client IP for security/rate limiting.
- `user_agent` (`TEXT`): Browser user agent for spam heuristics.
- `created_at` / `updated_at` (`TIMESTAMPTZ`): UTC timestamps.

### 1.6 `public.admin_users`
Security table maintaining authorized administrative user accounts mapped to `auth.users(id)`.
- `user_id` (`UUID PK`): References `auth.users(id)` with `ON DELETE CASCADE`.
- `email` (`TEXT NOT NULL UNIQUE`): Administrator email address.
- `role` (`TEXT NOT NULL DEFAULT 'admin'`): Role designation (`'super_admin'`, `'admin'`).
- `created_at` (`TIMESTAMPTZ`): Creation timestamp.

---

## 2. Indexing Strategy & Query Performance

| Index Name | Table | Columns | Purpose |
| :--- | :--- | :--- | :--- |
| `idx_categories_published_order` | `categories` | `(is_published, display_order ASC)` | Accelerates public menu and catalog category listing |
| `idx_categories_slug` | `categories` | `(slug)` | O(1) slug lookups for category detail routes |
| `idx_products_category_id` | `products` | `(category_id)` | Fast relational filtering of products by category |
| `idx_products_published_order` | `products` | `(is_published, display_order ASC)` | Accelerates public catalog product queries |
| `idx_products_slug` | `products` | `(slug)` | O(1) single-product lookups |
| `idx_products_specifications_gin`| `products` | `USING GIN (specifications)` | JSONB attribute filtering (e.g. wood type, dimensions) |
| `idx_products_gallery_images_gin`| `products` | `USING GIN (gallery_images)` | JSONB array indexing for gallery photos |
| `idx_hero_banners_published_order`| `hero_banners`| `(is_published, display_order ASC)` | Homepage hero slider query optimization |
| `idx_our_work_gallery_published_order` | `our_work_gallery` | `(is_published, display_order ASC)` | Portfolio gallery chronological & sort order fetch |
| `idx_our_work_gallery_category` | `our_work_gallery` | `(category)` | Fast tag filtering on Our Work page |
| `idx_enquiries_status_created` | `enquiries` | `(status, created_at DESC)` | Admin dashboard inbox queries sorted by newest lead |
| `idx_enquiries_phone` | `enquiries` | `(phone)` | Rapid search for returning customer consultation calls |

---

## 3. Row Level Security (RLS) & Authorization Matrix

Row Level Security is enabled on **all six tables**. By default, all operations are denied unless an explicit policy permits them.

| Table | Operation | Role | Policy Condition |
| :--- | :--- | :--- | :--- |
| `categories` | SELECT | `anon`, `authenticated` | `is_published = true OR public.is_admin()` |
| `categories` | INSERT / UPDATE / DELETE | `authenticated` | `public.is_admin() = true` |
| `products` | SELECT | `anon`, `authenticated` | `is_published = true OR public.is_admin()` |
| `products` | INSERT / UPDATE / DELETE | `authenticated` | `public.is_admin() = true` |
| `hero_banners` | SELECT | `anon`, `authenticated` | `is_published = true OR public.is_admin()` |
| `hero_banners` | INSERT / UPDATE / DELETE | `authenticated` | `public.is_admin() = true` |
| `our_work_gallery` | SELECT | `anon`, `authenticated` | `is_published = true OR public.is_admin()` |
| `our_work_gallery` | INSERT / UPDATE / DELETE | `authenticated` | `public.is_admin() = true` |
| `enquiries` | SELECT | `authenticated` | `public.is_admin() = true` (`anon` strictly DENIED) |
| `enquiries` | UPDATE / DELETE | `authenticated` | `public.is_admin() = true` (`anon` strictly DENIED) |
| `enquiries` | INSERT | `anon`, `authenticated` | `status = 'new' AND length(customer_name) >= 2 AND phone ~ '^[0-9+\s\-]{10,20}$'` |
| `admin_users` | SELECT / ALL | `authenticated` | `public.is_admin() = true` (`anon` strictly DENIED) |

### The `is_admin()` Security Definer Function
```sql
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
```
**Why this is secure:**
1. It queries `public.admin_users`, an isolated table protected from anonymous and standard users.
2. It does not rely on user-editable client cookies or `raw_user_meta_data`.
3. It uses `SECURITY DEFINER` with pinned `search_path = public` to prevent search path poisoning.

---

## 4. Manual Migration Execution Instructions

### Step 4.1: Access Supabase Dashboard
1. Log in to your [Supabase Dashboard](https://app.supabase.com).
2. Select your project for **Sai Indirabala Furniture & Interiors**.
3. In the left navigation bar, open the **SQL Editor**.

### Step 4.2: Execute Migration 001 (Initial Schema)
1. Open the file [supabase/migrations/001_initial_schema.sql](file:///c:/Users/Prithvi%20raj/Documents/Freelancing/SaiIndirabalaFurniture-main/SaiIndirabalaFurniture-main/supabase/migrations/001_initial_schema.sql).
2. Copy the entire SQL content and paste it into a new query tab in the Supabase SQL Editor.
3. Click **Run**.
4. Confirm message: `Success. No rows returned.`
5. Inspect **Table Editor** to verify all 6 tables exist (`admin_users`, `categories`, `products`, `hero_banners`, `our_work_gallery`, `enquiries`).

### Step 4.3: Execute Migration 002 (RLS Policies)
1. Open the file [supabase/migrations/002_rls_policies.sql](file:///c:/Users/Prithvi%20raj/Documents/Freelancing/SaiIndirabalaFurniture-main/SaiIndirabalaFurniture-main/supabase/migrations/002_rls_policies.sql).
2. Copy the entire SQL content and paste it into a new query tab in the SQL Editor.
3. Click **Run**.
4. Confirm message: `Success. No rows returned.`
5. Open **Authentication > Policies** to verify that RLS is marked active on each table.

---

## 5. Provisioning the Initial Administrator

The administrator account is **never** created via public signup. Follow these exact steps:

### Step 5.1: Create Auth User in Dashboard
1. Go to **Authentication > Users** in the Supabase Dashboard.
2. Click **Add User** -> **Create User**.
3. Enter the administrator email (e.g. `sibfurniture2016@gmail.com`).
4. Enter a strong temporary password.
5. Toggle **Auto Confirm User?** to **ON** (so the administrator can log in immediately without waiting for an email confirmation link).
6. Click **Create User**.
7. Copy the newly generated **User UID** (e.g. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

### Step 5.2: Grant Administrator Role
Open the **SQL Editor** and run:
```sql
INSERT INTO public.admin_users (user_id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE email = 'sibfurniture2016@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
```
Verify the administrator is registered:
```sql
SELECT * FROM public.admin_users;
```

---

## 6. Repeatable Security Verification Test Suite

Run these tests in the Supabase SQL Editor or via the Supabase JavaScript Client to verify RLS enforcement:

### Test 1: Anonymous Access to Public Content
```sql
-- Simulate anonymous caller
SET ROLE anon;

-- Test 1A: Can read published categories
SELECT id, name FROM public.categories WHERE is_published = true;
-- Result: Returns published categories.

-- Test 1B: CANNOT read unpublished categories
SELECT id, name FROM public.categories WHERE is_published = false;
-- Result: Returns 0 rows (denied by RLS).

-- Test 1C: CANNOT read customer enquiries
SELECT * FROM public.enquiries;
-- Result: Returns 0 rows (denied by RLS).

-- Test 1D: CANNOT insert products
INSERT INTO public.products (category_id, name, slug) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Hacked Item', 'hacked');
-- Result: ERROR: new row violates row-level security policy for table "products".
```

### Test 2: Anonymous Enquiry Submission & Tamper Denial
```sql
SET ROLE anon;

-- Test 2A: Valid customer submission succeeds
INSERT INTO public.enquiries (customer_name, phone, service_type, message, status)
VALUES ('Murugan S.', '9876543210', 'home-furniture', 'Interested in teak dining set', 'new');
-- Result: INSERT 0 1 (success).

-- Test 2B: Tampered status fails (attempting to set status = 'converted' or 'closed')
INSERT INTO public.enquiries (customer_name, phone, status)
VALUES ('Attacker', '9876543210', 'closed');
-- Result: ERROR: new row violates row-level security policy for table "enquiries".

-- Test 2C: Invalid phone format fails
INSERT INTO public.enquiries (customer_name, phone, status)
VALUES ('Bad Phone', '12345', 'new');
-- Result: ERROR: new row violates row-level security policy for table "enquiries".

-- Reset role
RESET ROLE;
```

---

## 7. Secure Server-Side Enquiry Submission Architecture

While the direct RLS insert policy above provides strong structural protection (forcing `status = 'new'` and validating data types), the recommended production-hardened design for Phase 3 utilizes a **serverless handler** or **Supabase Edge Function** to prevent automated bot spam.

### Edge Function Architecture (`submit-enquiry`):
```
Client Browser (index.html)
       │
       ▼ (POST /functions/v1/submit-enquiry with Turnstile / Honeypot)
Supabase Edge Function (Deno Runtime)
       │
       ├─ 1. Check IP rate-limit (max 5 submissions per 10 minutes per IP)
       ├─ 2. Validate honeypot field (hidden input that must be empty)
       ├─ 3. Validate Indian phone format (10-digit number)
       ├─ 4. Sanitize and trim text inputs
       ├─ 5. Insert into public.enquiries via Supabase Service Role Key
       │
       ▼
Database: public.enquiries
```

*Security Assurance:* The Supabase `service_role` key remains strictly inside the server environment and is **never** bundled into public frontend code.

---

## 8. Backup & Rollback Procedures

### 8.1 Rollback Script (Tear Down in Reverse Order)
If migrations need to be completely reverted during sandbox testing:
```sql
-- ROLLBACK 002: RLS Policies
DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Admins can delete enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Admins can update enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Admins can view enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Admins can delete gallery items" ON public.our_work_gallery;
DROP POLICY IF EXISTS "Admins can update gallery items" ON public.our_work_gallery;
DROP POLICY IF EXISTS "Admins can insert gallery items" ON public.our_work_gallery;
DROP POLICY IF EXISTS "Public can view published gallery items" ON public.our_work_gallery;
DROP POLICY IF EXISTS "Admins can delete hero banners" ON public.hero_banners;
DROP POLICY IF EXISTS "Admins can update hero banners" ON public.hero_banners;
DROP POLICY IF EXISTS "Admins can insert hero banners" ON public.hero_banners;
DROP POLICY IF EXISTS "Public can view published hero banners" ON public.hero_banners;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Public can view published products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view published categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP FUNCTION IF EXISTS public.is_admin();

-- ROLLBACK 001: Tables & Functions
DROP TABLE IF EXISTS public.enquiries CASCADE;
DROP TABLE IF EXISTS public.our_work_gallery CASCADE;
DROP TABLE IF EXISTS public.hero_banners CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP FUNCTION IF EXISTS public.trigger_set_timestamp() CASCADE;
```

---

## 9. Phase 3: Edge Function Deployment & Testing Guide

### 9.1 Deploying the Edge Function (`submit-enquiry`)
If using the Supabase CLI:
```bash
# 1. Login to Supabase CLI (if not already logged in)
supabase login

# 2. Link your CLI to your remote Supabase project
supabase link --project-ref your-project-ref

# 3. Deploy the function without requiring client JWT (public endpoint)
supabase functions deploy submit-enquiry --no-verify-jwt
```

If deploying via the **Supabase Dashboard**:
1. Open **Edge Functions** in your Supabase project dashboard.
2. Click **New Function** -> Name it `submit-enquiry`.
3. Paste the contents of `supabase/functions/submit-enquiry/index.ts`.
4. Under **Settings**, ensure **Enforce JWT Verification** is **disabled** (so anonymous public website visitors can submit the consultation form).
5. Click **Deploy**.

### 9.2 Edge Function Secrets Configuration
The Edge Function automatically requires access to your Supabase project URL and Service Role Key to insert records:
- `SUPABASE_URL`: Automatically provided by the Supabase Edge Function runtime.
- `SUPABASE_SERVICE_ROLE_KEY`: Automatically injected by the Supabase Edge Function runtime, or configure under **Edge Functions > Secrets**.

### 9.3 Repeatable `curl` Test Command
Test the deployed function from your terminal without opening the website:
```bash
curl -i --location --request POST 'https://your-project-ref.supabase.co/functions/v1/submit-enquiry' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "name": "Karthik Raja",
    "phone": "9876543210",
    "service_type": "home-furniture",
    "message": "Testing consultation form from CLI",
    "website_hp": ""
  }'
```
**Expected Response:**
```json
HTTP/1.1 200 OK
{"success":true,"message":"Thank you, Karthik Raja. Your consultation request has been received. Our team will contact you shortly."}
```

### 9.4 Edge Function Logs & Verification
1. Go to **Edge Functions > submit-enquiry > Logs** in the Supabase Dashboard.
2. View real-time request logs, status codes (200, 422, 429), and execution latency.
3. Open **Table Editor > enquiries** to inspect newly created consultation rows with `status = 'new'`.

### 9.5 Frontend Rollback Procedure
If frontend changes in `js/form.js` ever need to be rolled back to the pre-Phase 3 baseline, simply restore `js/form.js` from Git/backup. The database tables and Edge Function remain completely unaffected.

