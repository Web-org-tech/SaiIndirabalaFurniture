# Initial Technical & Organic SEO Audit — Sai Indirabala Furnitures

**Audit Date:** October 2026  
**Audited Domain:** https://saiindirabala.in/ (and https://www.saiindirabala.in/)  
**Business Name:** Sai Indirabala Furnitures (SIB Furniture & Interiors)  
**Location:** Pasingapuram, Madurai–Alanganallur Main Road, Near Boston College, Pothumbu Post, Madurai – 625018, Tamil Nadu, India  
**Auditor:** Senior Technical SEO & Performance Engineering Team  

---

## 1. Executive Summary

This audit establishes the pre-optimization baseline for **Sai Indirabala Furnitures**. Prior to this audit, the website was assumed to be a React-based application. Our deep inspection of the repository codebase and live server responses reveals that the website is in fact an **HTML5 Multi-Page Application (MPA) built with Vanilla JavaScript (ES6 modules), Vanilla CSS, and a client-side Supabase BaaS integration**, deployed to **Vercel**.

While the website exhibits strong visual polish and clean structural layouts, several technical SEO issues hinder maximum organic search visibility in Madurai and across Tamil Nadu:
1. **Empty Crawlable State on Catalog & Portfolio Pages:** Products and gallery items depend entirely on client-side Supabase runtime queries. Because the database currently contains zero published products and zero gallery items, search engine crawlers encounter empty grids without indexable product copy.
2. **Canonical Conflict on 404 Error Page:** The `404.html` error template contains `<meta name="robots" content="noindex, follow">` concurrently with a self-referencing canonical URL (`https://saiindirabala.in/404`), creating contradictory indexing signals.
3. **WWW vs. Non-WWW Duplicate Content Risk:** Both `https://www.saiindirabala.in/` and `https://saiindirabala.in/` return HTTP 200 without a 301 canonical redirect on Vercel. All internal canonicals, sitemap entries, and JSON-LD `@id` references specify the non-www hostname (`https://saiindirabala.in`).
4. **Internal Link Formatting & Clean URLs:** `vercel.json` defines `"cleanUrls": true`, yet multiple internal links point to `.html` extensions (e.g., `href="catalog.html"`), triggering avoidable redirect overhead and dual URL signals.
5. **Heavy LCP Image Assets:** The primary above-the-fold hero image (`images/hero/hero_furniture.png`) is 2,218 KB (2.2 MB), creating an unnecessary Largest Contentful Paint (LCP) performance bottleneck on mobile networks.
6. **Obsolete `<meta name="keywords">` Tag:** Present on the homepage, violating modern search guidelines.
7. **Missing Meta Robots Directives:** Omitted on `catalog.html` and `our-work.html`, leaving crawler snippet controls unspecified.
8. **Bilingual Opportunity:** While Tamil Nadu and Madurai represent bilingual search markets (Tamil & English), all content is presently English-only with `<html lang="en">` and no Tamil language landing structure.

---

## 2. Technical Architecture & Environment

| Component | Verified Specification | Audit Notes |
| :--- | :--- | :--- |
| **Framework / Rendering** | Semantic HTML5 + Vanilla CSS + Vanilla JS (ES6) | No React, Next.js, or Vite is used. Pure static MPA architecture with client-side JavaScript enhancements. |
| **Backend as a Service** | Supabase (`@supabase/supabase-js`) | Provides dynamic catalog, hero banners, our work gallery, and enquiry handling via REST endpoints. |
| **Hosting Platform** | Vercel | Configured via `vercel.json` with `cleanUrls: true`, `trailingSlash: false`, and security headers. |
| **Build Tools** | None (Static Native Delivery) | No package.json or node build scripts are required to serve the frontend. |
| **Package Management** | None / Pre-bundled ES6 Modules | Dependencies (e.g. Supabase client) are loaded via modular scripts. |
| **Primary Domain** | `https://saiindirabala.in` | Canonical domain used across all tags, sitemap, and JSON-LD. |
| **Secondary Domain** | `https://www.saiindirabala.in` | Resolves directly with HTTP 200 without 301 redirection. |

---

## 3. Route Inventory & Crawlability Assessment

| Route | Source File | Status Code | Crawlability Assessment |
| :--- | :--- | :--- | :--- |
| `/` | `index.html` | 200 OK | **High:** Fully rendered semantic HTML with rich sections (`#hero`, `#services`, `#3d-design`, `#our-work`, `#feedback`, `#about`, `#how-it-works`, `#all-works`, `#contact`). H1 exists. |
| `/catalog` | `catalog.html` | 200 OK | **Partial / Degraded:** Page shell loads with H1, search box, and breadcrumbs, but `#products-grid` is populated purely via `js/catalog.js`. If Supabase is empty (0 products currently) or JS is unexecuted, crawlers see zero product descriptions. |
| `/our-work` | `our-work.html` | 200 OK | **Partial / Degraded:** Page shell loads with H1 and category filter pills, but `#gallery-grid` is populated dynamically via `js/ourWork.js`. With 0 items currently in DB, bots see an empty grid. |
| `/404` | `404.html` | 404 (via Vercel rewrite) | **Defective Metadata:** Contains `noindex, follow` combined with `<link rel="canonical" href="https://saiindirabala.in/404">`. |
| `/admin/` | `admin/index.html` | 200 (auth protected) | **Protected:** Disallowed in `robots.txt` (`Disallow: /admin/`). Correctly excluded from indexing. |
| `/admin/dashboard` | `admin/dashboard.html` | 200 (auth protected) | **Protected:** Disallowed in `robots.txt`. Correctly excluded from indexing. |

---

## 4. Verified Issues & Severity Breakdown

### Severity: CRITICAL
*None that completely prevent crawling or cause site de-indexing.*

---

### Severity: HIGH

#### Issue H1: Client-Side Dependency for Core Products & Portfolio Content
- **Evidence:** `catalog.html` has empty container `<div class="products-grid" id="products-grid"></div>`. Supabase query returns `Products Count: 0`. `our-work.html` has empty container `<div class="gallery-grid" id="gallery-grid"></div>`. Supabase query returns `Gallery Count: 0`.
- **Impact:** Search engine bots crawling `/catalog` and `/our-work` index empty page shells without keyword-rich product names, material descriptions, dimensions, or service case studies.
- **Remediation:** Implement static, crawlable semantic fallback catalog items and portfolio project showcases in the HTML markup representing the business's core offerings (Modular Kitchens, Wardrobes, Office Workstations, Living Room Sofas, Dining Sets, Institution Desks). Allow client-side JavaScript to seamlessly replace or hydrate with live database records when available.

#### Issue H2: Canonical Conflict on Error Page (`404.html`)
- **Evidence:** `404.html` line 8 specifies `<meta name="robots" content="noindex, follow">`, but line 9 specifies `<link rel="canonical" href="https://saiindirabala.in/404">`.
- **Impact:** Canonicals instruct search engines that a page is the authoritative master URL to index, contradicting the `noindex` directive and potentially causing the 404 URL to be indexed.
- **Remediation:** Remove the `<link rel="canonical">` tag from `404.html`. Keep `<meta name="robots" content="noindex, follow">`.

#### Issue H3: Unredirected Hostname Duplication (WWW vs. Non-WWW)
- **Evidence:** Live HTTP inspection confirms:
  - `curl -ILs https://www.saiindirabala.in/` -> HTTP 200
  - `curl -ILs https://saiindirabala.in/` -> HTTP 200
  Neither domain redirects to the other.
- **Impact:** Search engines may crawl and index both hostnames, diluting PageRank and splitting backlink equity.
- **Remediation:** Add a 301 redirect rule in `vercel.json` (or Vercel domain settings) forwarding `www.saiindirabala.in` to `saiindirabala.in`, aligning with the existing canonical tags.

---

### Severity: MEDIUM

#### Issue M1: Internal Links Using `.html` Instead of Clean URLs
- **Evidence:** In `index.html`, `catalog.html`, `our-work.html`, and `404.html`, navigation links include:
  - `href="catalog.html"`
  - `href="our-work.html"`
  - `href="index.html"`
  - `href="index.html#services"`
  While `vercel.json` has `"cleanUrls": true` and canonicals specify `/catalog`, `/our-work`, and `/`.
- **Impact:** Clicking `.html` links triggers unnecessary 308 permanent redirect hops or produces mismatched URL signals for crawlers.
- **Remediation:** Standardize all internal links to clean relative routes: `/catalog`, `/our-work`, `/`, `/#services`, `/#contact`.

#### Issue M2: Massive Hero Image Hurting LCP (2.2 MB)
- **Evidence:** `images/hero/hero_furniture.png` has an uncompressed file size of 2,218 KB (2.2 MB).
- **Impact:** Slow Largest Contentful Paint (LCP) on mobile 4G networks, penalizing mobile Core Web Vitals rankings.
- **Remediation:** Compress and provide a high-quality optimized modern format (WebP/AVIF or compressed PNG) with explicit responsive dimensions.

#### Issue M3: Missing Robots Meta Directives on Subpages
- **Evidence:** `catalog.html` and `our-work.html` do not specify `<meta name="robots">`. Only `index.html` specifies `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`.
- **Impact:** Search engines may not display rich image previews or full snippets in SERP results for catalog and portfolio pages.
- **Remediation:** Add consistent `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">` across all indexable pages.

#### Issue M4: Missing Open Graph & Twitter Card Completeness on Subpages
- **Evidence:** `catalog.html` and `our-work.html` omit Twitter card meta tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) and `og:site_name`, `og:locale`.
- **Impact:** Sub-optimal link preview generation when shared on WhatsApp, LinkedIn, Facebook, and X (Twitter).
- **Remediation:** Add comprehensive Open Graph and Twitter Card tags to all subpages.

---

### Severity: LOW

#### Issue L1: Obsolete `<meta name="keywords">` Tag on Homepage
- **Evidence:** `index.html` line 9: `<meta name="keywords" content="...">`.
- **Impact:** Search engines like Google have ignored this tag for over 15 years; having it risks minor keyword-stuffing penalties and competitor insight into target terms.
- **Remediation:** Remove the `<meta name="keywords">` tag.

#### Issue L2: Incomplete Breadcrumb Schema on Subpages
- **Evidence:** `catalog.html` and `our-work.html` define breadcrumbs, but could include richer item descriptions and full Schema.org WebSite publisher references.
- **Remediation:** Standardize JSON-LD graph structure across all templates.

#### Issue L3: Lack of FAQPage Schema
- **Evidence:** The website contains valuable customer questions regarding 3D design, custom measurements, factory direct prices, and delivery coverage across Madurai and Tamil Nadu, but no `FAQPage` structured data.
- **Remediation:** Add verified `FAQPage` JSON-LD markup to `index.html`.

---

## 5. Potential Regression Risks

1. **JavaScript Component Breakage:** When modifying HTML structure or adding crawlable fallback content to `#products-grid` or `#gallery-grid`, dynamic scripts (`js/catalog.js`, `js/ourWork.js`) must continue to clear, filter, or hydrate correctly without throwing null reference exceptions.
2. **Anchor Link Navigation:** Converting `href="index.html#services"` to `href="/#services"` must work seamlessly from subpages (`/catalog`, `/our-work`) back to the homepage without broken jumps.
3. **Admin Panel Access:** `robots.txt` modifications must never expose `/admin/` or compromise session security.
4. **Style Integrity:** All newly added crawlable semantic elements must utilize existing CSS design system tokens (`var(--wood-brown)`, `var(--accent)`, `var(--cream)`, etc.) to prevent visual discrepancies.

---

## 6. Unknown Details Requiring Business-Owner Input

1. **Google Business Profile (GBP) Status:** Does Sai Indirabala Furnitures already have a verified GBP listing for the Pasingapuram workshop? If so, what is the exact registered Business Name and Google Maps CID?
2. **Operational Delivery Radius:** Does the business deliver across all 38 districts of Tamil Nadu, or is free/standard delivery limited to Madurai, Dindigul, Theni, Sivaganga, and Virudhunagar?
3. **Tamil Language Copy:** Does the business have certified Tamil marketing text and product descriptions for a dedicated Tamil landing page (`/ta/`)?
4. **Official Working Hours:** Are Sunday showroom/workshop visits available by prior appointment, or strictly closed?
5. **Exact Geo Coordinates:** Current JSON-LD lists `9.990083, 78.099811` near Boston College. Business owner should confirm exact pin location on Google Maps.
