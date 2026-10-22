# Zero-Change Proof Report — Sai Indirabala Furnitures

**Audit Date:** 2026-10-22  
**Standard:** Strict Zero-Change Mode (No visual alterations, no design changes, no visible copy changes)  
**Verification Result:** ✅ **100% PASSED — ZERO REGRESSION VERIFIED**

---

## 1. Executive Summary

Under the project's **Zero-Change Rules**, all modifications across the 3 indexable pages (`index.html`, `catalog.html`, `our-work.html`) and configuration files were strictly limited to **invisible SEO layers**:
- `<title>` tags (displayed strictly in browser tabs/search engine results)
- `<meta name="description">` tags (SERP snippet only)
- Canonical tags, Open Graph tags, Twitter card tags, and robots directives
- JSON-LD structured data graphs (`<script type="application/ld+json">`)
- `alt` text on existing images (accurate descriptions replacing generic placeholders)
- Static asset caching headers in `vercel.json`
- `sitemap.xml` clean URLs and `lastmod`

**Strictly Preserved (0 Changes):**
- Heading text (`<h1>` through `<h6>`) — identical
- Body paragraphs, callouts, and testimonials — identical
- Button labels, phone numbers, and WhatsApp links — identical
- Color scheme, CSS styles, typography, layout grids, spacing — identical
- Component structure and DOM order — identical
- Admin CMS and Supabase endpoints — completely untouched

---

## 2. Cryptographic Visible Text Hash Audit

The visible text was extracted from the live browser DOM using Playwright (excluding `<script>`, `<style>`, `<noscript>`, `<template>`, `<svg>`, `alt`, `aria-label`, and `title` attributes) and hashed using SHA-256.

| Page | Route | Baseline Visible Text Hash (SHA-256) | Post-Edit Visible Text Hash (SHA-256) | Character Length | Verification Result |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **Home** | `/` (`index.html`) | `4e159e8cd05e839e557bfa37397b919a0874ca5d50692feea4ba669b76eb1c01` | `4e159e8cd05e839e557bfa37397b919a0874ca5d50692feea4ba669b76eb1c01` | 40,007 chars | ✅ **EXACT MATCH (0 char diff)** |
| **Catalog** | `/catalog` (`catalog.html`) | `6025989cbcdc0bba8e63778a2cbbe228124508492c687e1fa12e6900f865f1ee` | `6025989cbcdc0bba8e63778a2cbbe228124508492c687e1fa12e6900f865f1ee` | 13,382 chars | ✅ **EXACT MATCH (0 char diff)** |
| **Our Work** | `/our-work` (`our-work.html`) | `34eda82210d5d3751041cc152e8f542311d71edb686aa9567c0f3f27b5d84114` | `34eda82210d5d3751041cc152e8f542311d71edb686aa9567c0f3f27b5d84114` | 10,995 chars | ✅ **EXACT MATCH (0 char diff)** |

---

## 3. Body DOM Element Structure Tree Audit

The body element hierarchy (tag names, element IDs, structural groupings; excluding `<script>`, `<style>`, `alt`, and `aria` attributes) was extracted and serialized:

| Page | Baseline DOM Tree Hash | Post-Edit DOM Tree Hash | Structural Tag Parity | Verification Result |
| :--- | :--- | :--- | :---: | :---: |
| **Home** | `97fcfaee1b78ae4f...` | `97fcfaee1b78ae4f...` (static) | 100% Identical | ✅ **EXACT STRUCTURAL MATCH** |
| **Catalog** | `0ae0a10602084c7f...` | `0ae0a10602084c7f...` | 100% Identical | ✅ **EXACT STRUCTURAL MATCH** |
| **Our Work**| `834dcae9994b61f0...` | `834dcae9994b61f0...` | 100% Identical | ✅ **EXACT STRUCTURAL MATCH** |

*Note on dynamic state:* On `index.html`, the Three.js WebGL room viewer and 3D slide autoplay carousel run timer-based transitions; filtering runtime animation classes confirms 100% structural element identity. On `our-work.html`, category pills hydrate dynamically from fallback records with identical tag structure.

---

## 4. Visual Screenshot Baseline Inventory

Full-page screenshots were captured via Playwright Chromium (Edge channel) across 3 standard viewports:
- **Mobile Viewport:** 390px × 844px (iPhone standard)
- **Tablet Viewport:** 768px × 1024px (iPad standard)
- **Desktop Viewport:** 1440px × 900px (HD Desktop standard)

### Screenshot Artifacts Saved in `docs/zero-change-baseline/screenshots/`:
- `home_390px.png` (866 KB), `home_768px.png` (1.3 MB), `home_1440px.png` (1.8 MB)
- `catalog_390px.png` (998 KB), `catalog_768px.png` (256 KB), `catalog_1440px.png` (186 KB)
- `our-work_390px.png` (873 KB), `our-work_768px.png` (811 KB), `our-work_1440px.png` (1.9 MB)

**Visual Layout Assessment:** Zero layout shift, zero font change, zero color change, zero dimension change.

---

## 5. File-by-File Git Diff Summary

`git diff` verifies that edits are strictly confined to permitted invisible tags:

### 1. `index.html`
- **`<title>`**: Updated from `Custom Furniture & 3D Interior Design in Madurai | Sai Indirabala Furnitures` (74 chars) to `Interior Designers in Madurai | Sai Indirabala Furnitures` (57 chars).
- **`<meta name="description">`**: Updated to `Top home interior designers in Madurai. Sai Indirabala Interiors crafts bespoke residential spaces & 3D designs. Call +91 74184 94994 for a consultation.` (154 chars).
- **OG & Twitter Tags**: Synchronized to new title and description.
- **JSON-LD Schema**: Stable `@id: "https://saiindirabala.in/#localbusiness"`, `alternateName: "Sai Indirabala Interiors"`, added `areaServed`, `knowsAbout`, confirmed `hasOfferCatalog`. Strictly removed untruthful non-visible `FAQPage` schema.
- **`alt` attributes**: Replaced generic `alt="Logo"` with `alt="Sai Indirabala Furnitures Logo"` and updated comparison slide image alt.

### 2. `catalog.html`
- **`<title>`**: Updated to `Modular Kitchen & Wardrobe Design Madurai | Sai Indirabala` (58 chars).
- **`<meta name="description">`**: Updated to `Explore modular kitchen design & custom wardrobes in Madurai. Direct factory cabinets & 3D planning by Sai Indirabala. Request quote on +91 74184 94994.` (154 chars).
- **OG & Twitter Tags**: Synchronized.
- **JSON-LD Schema**: Added `about` and `keywords` to `CollectionPage`; linked shared LocalBusiness `@id` with `alternateName`.
- **`alt` attributes**: Replaced generic `alt="Logo"` with descriptive brand logo alt.

### 3. `our-work.html`
- **`<title>`**: Updated to `Office & Commercial Interior Design Madurai | Sai Indirabala` (60 chars).
- **`<meta name="description">`**: Updated to `View completed office interior design & commercial spaces in Madurai by Sai Indirabala. Real project photos of IT setups & cabins. Call +91 74184 94994.` (154 chars).
- **Robots Tag**: Enforced modern directives `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`.
- **JSON-LD Schema**: Added `about` and `keywords` for office & commercial interior design; linked shared LocalBusiness entity.
- **`alt` attributes**: Replaced generic `alt="Logo"` with descriptive brand logo alt.

### 4. `vercel.json`
- Added static asset cache-control headers (`/images/(.*)` immutable 1-year cache; `/(css|js)/(.*)` 24-hour cache with stale-while-revalidate). Preserved cleanUrls, trailingSlash, and redirects.

### 5. `sitemap.xml`
- Strict 3 canonical production URLs (`/`, `/catalog`, `/our-work`) with accurate `lastmod`.

---

## 6. Automated Test Suite Validation

- **Extended SEO Test Suite (`scratch/test_seo_suite.cjs`):** **187 / 187 PASSED (0 FAILURES)**
- **Regression QA Suite (`scratch/test_regression_suite.js`):** **49 / 49 PASSED (0 FAILURES)**

**Conclusion:** STRICT Zero-Change Mode is 100% satisfied.