# 90-Day Organic SEO Maintenance & Growth Plan — Sai Indirabala Furnitures

**Target Business:** Sai Indirabala Furnitures & Interiors (Madurai, Tamil Nadu)  
**Primary Objective:** Maintain technical SEO integrity, accelerate Google indexing, capture qualified local Madurai search queries, and drive telephone and WhatsApp consultation inquiries.  
**Plan Horizon:** Days 1 through 90 following technical SEO deployment  

---

## 1. Plan Structure Overview

| Phase | Timeframe | Core Focus | Primary KPI |
| :--- | :--- | :--- | :--- |
| **Sprint 1** | Days 1 – 30 | Indexing, Search Console & Local GBP Claiming | 100% Core URL Indexation & GBP Verification |
| **Sprint 2** | Days 31 – 60 | CMS Catalog Population & Local Citation Building | +30% GSC Search Impressions & 15+ Verified Reviews |
| **Sprint 3** | Days 61 – 90 | Bilingual Tamil Expansion & Conversion Rate Tuning | Qualified WhatsApp / Call Lead Volume |

---

## 2. Sprint 1: Days 1 to 30 — Indexing, Search Console & Local Foundation

### Week 1 (Days 1–7): Search Console Verification & Sitemap Submission
- [ ] **Action 1.1:** Add domain property `saiindirabala.in` to Google Search Console (GSC).
  - *Method:* DNS TXT record via domain registrar (recommended) or HTML tag verification.
- [ ] **Action 1.2:** Submit canonical sitemap in GSC:
  - *Sitemap URL:* `https://saiindirabala.in/sitemap.xml`
- [ ] **Action 1.3:** Perform URL Inspection on:
  - `https://saiindirabala.in/`
  - `https://saiindirabala.in/catalog`
  - `https://saiindirabala.in/our-work`
  - Request indexing for each URL.
- [ ] **Action 1.4:** Verify live 301 redirect behaviour using curl or browser network inspection:
  - Verify `http://saiindirabala.in` → `https://saiindirabala.in/` (301)
  - Verify `https://www.saiindirabala.in/` → `https://saiindirabala.in/` (301)

### Week 2 (Days 8–14): Google Business Profile (GBP) Ownership & Setup
- [ ] **Action 2.1:** Execute the step-by-step checklist in [`docs/local-seo-checklist.md`](file:///c:/Users/Prithvi%20raj/Documents/Freelancing/SaiIndirabalaFurniture-main/SaiIndirabalaFurniture-main/docs/local-seo-checklist.md).
- [ ] **Action 2.2:** Verify business Name, Address, and Phone (NAP) exactly matches:
  - **Name:** Sai Indirabala Furniture & Interiors
  - **Address:** Pasingapuram, Madurai–Alanganallur Main Road, Near Boston College, Pothumbu Post, Madurai – 625018, Tamil Nadu, India.
  - **Primary Phone:** +91 74184 94994
  - **Secondary Phone:** +91 84289 94994
- [ ] **Action 2.3:** Set Primary Category to `Furniture manufacturer` or `Furniture store`, with Secondary Category `Interior designer`.
- [ ] **Action 2.4:** Upload 15+ genuine showroom and workshop photos (exterior facade, workshop carpentry in progress, finished sofas, modular kitchen mockups).

### Week 3 (Days 15–21): Analytics & Lead Tracking Deployment
- [ ] **Action 3.1:** Create a Google Analytics 4 (GA4) Web Data Stream for `https://saiindirabala.in`.
- [ ] **Action 3.2:** Paste the GA4 tracking snippet into `<head>` across `index.html`, `catalog.html`, and `our-work.html`.
- [ ] **Action 3.3:** Verify in GA4 Realtime DebugView that pre-wired events fire correctly:
  - `phone_click` (on clicking any `tel:` link)
  - `whatsapp_click` (on clicking any WhatsApp action button)
  - `form_submit` (when consultation form is submitted)
  - `generate_lead` (when Supabase Edge Function confirms receipt)

### Week 4 (Days 22–30): First Review Wave & Local Citations
- [ ] **Action 4.1:** Generate official Google Review shortlink from GBP dashboard.
- [ ] **Action 4.2:** Request genuine Google reviews from recent residential and commercial customers (target: 8–10 verified 5-star reviews).
- [ ] **Action 4.3:** Claim or update free business listings on top Indian directories with identical NAP:
  - Justdial Madurai
  - IndiaMART
  - Sulekha Madurai
  - TradeIndia

---

## 3. Sprint 2: Days 31 to 60 — Content Growth & CMS Population

### Week 5–6 (Days 31–45): Populate Live Supabase Database via Admin CMS
- [ ] **Action 5.1:** Log into the internal CMS at `/admin/` and add 15–20 real furniture products with verified prices and dimensions:
  - Living Room: Solid Teak Sofas, L-Shape Recliners, Coffee Tables, TV Consoles.
  - Dining: 6-Seater Teak Dining Sets, Marble Top Dining.
  - Bedroom: King Storage Beds, Sliding Wardrobes, Dressing Tables.
  - Commercial / Office: Modular IT Clusters, Executive Tables, Ergonomic Mesh Chairs.
  - Institution: Dual Classroom Desks, Library Book Racks.
- [ ] **Action 5.2:** Add 8–10 completed installation projects to the Our Work gallery with real client photographs and project descriptions.

### Week 7–8 (Days 46–60): Search Console Performance Audit & Keyword Tracking
- [ ] **Action 6.1:** Audit GSC "Performance" report for top ranking queries:
  - Check click-through rate (CTR) on `furniture shop in madurai`, `interior designers in madurai`, `modular kitchen madurai`.
- [ ] **Action 6.2:** Inspect GSC "Pages" report:
  - Verify 0 "Crawled - currently not indexed" for core URLs.
  - Confirm 0 valid pages flagged with 404 or soft 404.
- [ ] **Action 6.3:** Check Schema.org rich result status in GSC "Enhancements" tab (FAQ rich snippets, breadcrumbs, merchant listings).

---

## 4. Sprint 3: Days 61 to 90 — Bilingual Tamil Expansion & Conversion Tuning

### Week 9–10 (Days 61–75): Bilingual Tamil Content Implementation
- [ ] **Action 7.1:** Review Tamil search demand using GSC queries and target keywords identified in [`docs/seo-keyword-map.md`](file:///c:/Users/Prithvi raj/Documents/Freelancing/SaiIndirabalaFurniture-main/SaiIndirabalaFurniture-main/docs/seo-keyword-map.md):
  - மதுரை பர்னிச்சர் கடை (Madurai furniture shop)
  - மதுரை இன்டீரியர் டிசைனர் (Madurai interior designer)
  - மாடுலர் கிச்சன் மதுரை (Modular kitchen Madurai)
  - தேக்கு மர சோபா மதுரை (Teak wood sofa Madurai)
- [ ] **Action 7.2:** Prepare human-reviewed Tamil content for:
  - `/ta/` (Tamil Homepage)
  - `/ta/catalog` (Tamil Product Catalog)
  - `/ta/our-work` (Tamil Installation Gallery)
- [ ] **Action 7.3:** Configure reciprocal `<link rel="alternate" hreflang="ta" href="...">` and `<link rel="alternate" hreflang="en" href="...">` tags across English and Tamil pages.
- [ ] **Action 7.4:** Add Tamil entries to `sitemap.xml`.

### Week 11–12 (Days 76–90): Conversion Rate & Core Web Vitals Quarterly Review
- [ ] **Action 8.1:** Analyze 90-day lead channels in GA4:
  - Compare volume: Phone calls vs WhatsApp vs Consultation Form.
  - Identify top converting landing pages.
- [ ] **Action 8.2:** Run full regression and SEO test suites:
  ```bash
  node scratch/test_seo_suite.cjs
  node scratch/test_regression_suite.js
  ```
- [ ] **Action 8.3:** Re-evaluate Google PageSpeed Insights on mobile and desktop:
  - Ensure LCP remains ≤ 2.5s.
  - Ensure CLS remains ≤ 0.1.

---

## 5. Ongoing Monthly Maintenance Checklist (Beyond Day 90)

| Task | Frequency | Responsible Role | Tool / Destination |
| :--- | :--- | :--- | :--- |
| **GSC Indexing & Error Check** | Bi-weekly | SEO Specialist | Google Search Console |
| **Customer Review Responses** | Weekly | Business Owner | Google Business Profile Dashboard |
| **Add New Completed Work** | Monthly | Workshop Manager | Admin CMS (`/admin/`) |
| **Automated SEO Test Run** | Monthly | Technical Engineer | `node scratch/test_seo_suite.cjs` |
| **Local Citation NAP Audit** | Quarterly | Local SEO Lead | Justdial, IndiaMART, Sulekha |
| **Vercel Build & SSL Check** | Monthly | Webmaster | Vercel Dashboard |

---

## 6. Business Information Required from Owner

Before public citation and Tamil rollout, the owner should confirm:
1. Exact showroom public hours (e.g., Monday–Saturday 9:30 AM – 8:30 PM, Sunday by appointment).
2. Official WhatsApp Business verified number (confirmed: `+91 74184 94994`).
3. Delivery operational coverage boundaries outside Madurai (e.g. Free delivery within 25 km; direct installation available in Dindigul, Theni, Virudhunagar, Sivagangai).
4. Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`).
