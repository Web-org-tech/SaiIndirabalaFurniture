const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '..', 'our-work.html');
let html = fs.readFileSync(targetPath, 'utf8');

// 1. Update <head>
const oldHead = html.substring(html.indexOf('<head>'), html.indexOf('</head>') + 7);

const newHead = `<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Completed Furniture Projects &amp; Interior Installations in Madurai | Sai Indirabala Furnitures</title>
    <meta name="description" content="Authentic photographs of completed furniture projects, custom woodcraft, modular office workstations, and institutional setups in Madurai and across Tamil Nadu.">
    <link rel="canonical" href="https://saiindirabala.in/our-work">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#1f140d">

    <!-- Open Graph / Meta -->
    <meta property="og:site_name" content="Sai Indirabala Furnitures">
    <meta property="og:locale" content="en_IN">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://saiindirabala.in/our-work">
    <meta property="og:title" content="Completed Furniture Projects &amp; Interior Installations in Madurai | Sai Indirabala Furnitures">
    <meta property="og:description" content="Authentic client installations across Tamil Nadu. Custom home furniture, modular office systems, and institutional setups direct from our Madurai workshop.">
    <meta property="og:image" content="https://saiindirabala.in/images/hero/hero_furniture.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="675">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Completed Furniture Projects &amp; Interior Installations in Madurai">
    <meta name="twitter:description" content="Authentic photographs of custom woodcraft, modular office workstations, and institutional setups in Madurai.">
    <meta name="twitter:image" content="https://saiindirabala.in/images/hero/hero_furniture.jpg">

    <!-- Fonts & Core Design System -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
    <link rel="icon" type="image/png" href="images/icon/logo.png">

    <!-- Stylesheets -->
    <link rel="stylesheet" href="css/variables.css">
    <link rel="stylesheet" href="css/reset.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/our-work.css">

    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": "https://saiindirabala.in/our-work#collection",
                "url": "https://saiindirabala.in/our-work",
                "name": "Completed Furniture Projects & Interior Installations in Madurai",
                "description": "Authentic photographs of completed furniture projects, custom woodcraft, modular office workstations, and institutional setups in Madurai and across Tamil Nadu.",
                "isPartOf": {
                    "@type": "WebSite",
                    "@id": "https://saiindirabala.in/#website"
                },
                "breadcrumb": {
                    "@id": "https://saiindirabala.in/our-work#breadcrumb"
                }
            },
            {
                "@type": "BreadcrumbList",
                "@id": "https://saiindirabala.in/our-work#breadcrumb",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://saiindirabala.in/"
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Our Work",
                        "item": "https://saiindirabala.in/our-work"
                    }
                ]
            },
            {
                "@type": "ImageGallery",
                "@id": "https://saiindirabala.in/our-work#gallery",
                "name": "Sai Indirabala Completed Installations Portfolio",
                "description": "Authentic client project gallery for residential, commercial, and institutional furniture in Madurai.",
                "hasPart": [
                    {
                        "@type": "ImageObject",
                        "name": "Modular 24-Seater IT Software Workstations",
                        "description": "Commercial IT office cluster installation with acoustic privacy dividers and cable raceways in Madurai.",
                        "contentUrl": "https://saiindirabala.in/images/furniture/software.jpeg"
                    },
                    {
                        "@type": "ImageObject",
                        "name": "Bespoke Solid Teak Living Room & Sofa Suite",
                        "description": "Handcrafted solid teakwood living room suite with ergonomic cushioning and center coffee table.",
                        "contentUrl": "https://saiindirabala.in/images/hero/hero_furniture.jpg"
                    },
                    {
                        "@type": "ImageObject",
                        "name": "L-Shaped Marine Ply Modular Kitchen with Quartz Island",
                        "description": "710-grade BWP marine ply kitchen with scratch-resistant acrylic shutters and quartz island.",
                        "contentUrl": "https://saiindirabala.in/images/3d-design/render_living.jpg"
                    },
                    {
                        "@type": "ImageObject",
                        "name": "Floor-to-Ceiling Bronze Glass Bedroom Wardrobe",
                        "description": "Modern bedroom wardrobe with black slim aluminum profile doors and bronze fluted glass.",
                        "contentUrl": "https://saiindirabala.in/images/3d-design/room_after.jpg"
                    },
                    {
                        "@type": "ImageObject",
                        "name": "Institutional Heavy-Duty Classroom Benches & Desks",
                        "description": "Epoxy powder-coated tubular steel dual desks supplied for educational colleges across Tamil Nadu.",
                        "contentUrl": "https://saiindirabala.in/images/furniture/table.jpg"
                    },
                    {
                        "@type": "ImageObject",
                        "name": "Commercial Retail Cash Counters & Display Racks",
                        "description": "Executive retail cash desk and modular display racking systems for Madurai retail showroom.",
                        "contentUrl": "https://saiindirabala.in/images/commercial/racks.jpg"
                    }
                ]
            },
            {
                "@type": "FurnitureStore",
                "@id": "https://saiindirabala.in/#localbusiness",
                "name": "Sai Indirabala Furniture & Interiors",
                "url": "https://saiindirabala.in/",
                "logo": "https://saiindirabala.in/images/icon/logo.png",
                "image": "https://saiindirabala.in/images/hero/hero_furniture.jpg",
                "telephone": ["+917418494994", "+918428994994"],
                "priceRange": "$$",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Pasingapuram, Madurai–Alanganallur Main Road, Near Boston College, Pothumbu Post",
                    "addressLocality": "Madurai",
                    "postalCode": "625018",
                    "addressRegion": "Tamil Nadu",
                    "addressCountry": "IN"
                }
            }
        ]
    }
    </script>
</head>`;

html = html.replace(oldHead, newHead);

// 2. Clean URLs in Nav, Breadcrumbs, and Header
html = html.replace('<a href="index.html" class="brand-logo"', '<a href="/" class="brand-logo"');
html = html.replace(
    `<nav class="nav-menu" role="navigation" aria-label="Main Navigation">
                    <a href="index.html" class="nav-link">Home</a>
                    <a href="index.html#services" class="nav-link">Services</a>
                    <a href="catalog.html" class="nav-link">Catalog</a>
                    <a href="our-work.html" class="nav-link active">Our Work</a>
                    <a href="index.html#contact" class="nav-link">Contact</a>
                </nav>`,
    `<nav class="nav-menu" role="navigation" aria-label="Main Navigation">
                    <a href="/" class="nav-link">Home</a>
                    <a href="/#services" class="nav-link">Services</a>
                    <a href="/catalog" class="nav-link">Catalog</a>
                    <a href="/our-work" class="nav-link active">Our Work</a>
                    <a href="/#contact" class="nav-link">Contact</a>
                </nav>`
);

html = html.replace(
    `<ul class="mobile-nav-list">
            <li><a href="index.html" class="mobile-nav-link">Home</a></li>
            <li><a href="index.html#services" class="mobile-nav-link">Services</a></li>
            <li><a href="catalog.html" class="mobile-nav-link">Catalog</a></li>
            <li><a href="our-work.html" class="mobile-nav-link" style="color: var(--accent-light);">Our Work</a></li>
            <li><a href="index.html#contact" class="mobile-nav-link">Contact</a></li>
        </ul>`,
    `<ul class="mobile-nav-list">
            <li><a href="/" class="mobile-nav-link">Home</a></li>
            <li><a href="/#services" class="mobile-nav-link">Services</a></li>
            <li><a href="/catalog" class="mobile-nav-link">Catalog</a></li>
            <li><a href="/our-work" class="mobile-nav-link" style="color: var(--accent-light);">Our Work</a></li>
            <li><a href="/#contact" class="mobile-nav-link">Contact</a></li>
        </ul>`
);

// 3. Breadcrumbs and H1
html = html.replace(
    `<nav class="breadcrumbs" aria-label="Breadcrumb">
                <a href="index.html">Home</a>
                <span class="separator">/</span>
                <span class="current">Our Work</span>
            </nav>
            <h1 class="page-title">Our Work &amp; Completed Installations</h1>`,
    `<nav class="breadcrumbs" aria-label="Breadcrumb">
                <a href="/">Home</a>
                <span class="separator">/</span>
                <span class="current">Our Work</span>
            </nav>
            <h1 class="page-title">Completed Furniture Projects &amp; Interior Installations in Madurai</h1>`
);

html = html.replace('<a href="index.html#our-work"', '<a href="/#our-work"');

// 4. Inject Crawlable Cards into #gallery-grid
const crawlableGridMarkup = `            <!-- Gallery Cards Grid (Pre-rendered for immediate SEO crawlability) -->
            <div class="gallery-grid" id="gallery-grid">
                <!-- 01. Office Workstations -->
                <article class="work-card" data-work-id="proj-it-workstations">
                    <div class="work-card-img-wrap" data-action="inspect">
                        <img src="images/furniture/software.jpeg" 
                             alt="Modular 24-Seater IT Software Workstations installation in Madurai by Sai Indirabala Furnitures" 
                             class="work-card-img" 
                             width="600" height="400" loading="lazy">
                        <span class="work-card-badge">Office Workstations</span>
                        <span class="work-card-zoom-indicator" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            <span>Inspect</span>
                        </span>
                    </div>
                    <div class="work-card-body">
                        <h2 class="work-card-title" data-action="inspect">Modular 24-Seater IT Software Workstations</h2>
                        <p class="work-card-desc">Commercial IT office cluster installation featuring heavy-duty powder-coated MS steel frames, concealed cable raceways, and acoustic privacy dividers installed in Madurai.</p>
                        <div class="work-card-actions">
                            <button type="button" class="btn-card-inspect" data-action="inspect">
                                <span>View Full Project</span>
                                <span aria-hidden="true">→</span>
                            </button>
                            <a href="https://wa.me/917418494994?text=Hi%20Sai%20Indirabala%20Furniture%2C%20I%20saw%20your%20completed%20project%20Modular%2024-Seater%20IT%20Workstations.%20Please%20share%20details." 
                               target="_blank" 
                               rel="noopener" 
                               class="btn-card-wa" 
                               aria-label="Enquire about Modular 24-Seater IT Workstations on WhatsApp">
                                <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.842L.057 23.453a.75.75 0 00.918.919l5.651-1.458A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 01-4.961-1.357l-.356-.211-3.683.95.978-3.584-.232-.369A9.721 9.721 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
                            </a>
                        </div>
                    </div>
                </article>

                <!-- 02. Living Room Furniture -->
                <article class="work-card" data-work-id="proj-teak-living">
                    <div class="work-card-img-wrap" data-action="inspect">
                        <img src="images/hero/hero_furniture.jpg" 
                             alt="Bespoke Solid Teak Living Room &amp; Sofa Suite handcrafted in Madurai by Sai Indirabala Furnitures" 
                             class="work-card-img" 
                             width="600" height="400" loading="lazy">
                        <span class="work-card-badge">Living Room Furniture</span>
                        <span class="work-card-zoom-indicator" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            <span>Inspect</span>
                        </span>
                    </div>
                    <div class="work-card-body">
                        <h2 class="work-card-title" data-action="inspect">Bespoke Solid Teak Living Room &amp; Sofa Suite</h2>
                        <p class="work-card-desc">Handcrafted solid teakwood 3+1+1 living room suite with high-density ergonomic cushioning, stain-resistant premium upholstery, and matching center coffee table.</p>
                        <div class="work-card-actions">
                            <button type="button" class="btn-card-inspect" data-action="inspect">
                                <span>View Full Project</span>
                                <span aria-hidden="true">→</span>
                            </button>
                            <a href="https://wa.me/917418494994?text=Hi%20Sai%20Indirabala%20Furniture%2C%20I%20saw%20your%20completed%20Teak%20Living%20Room%20Suite.%20Please%20share%20details." 
                               target="_blank" 
                               rel="noopener" 
                               class="btn-card-wa" 
                               aria-label="Enquire about Teak Living Room Suite on WhatsApp">
                                <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.842L.057 23.453a.75.75 0 00.918.919l5.651-1.458A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 01-4.961-1.357l-.356-.211-3.683.95.978-3.584-.232-.369A9.721 9.721 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
                            </a>
                        </div>
                    </div>
                </article>

                <!-- 03. Modular Kitchens -->
                <article class="work-card" data-work-id="proj-modular-kitchen">
                    <div class="work-card-img-wrap" data-action="inspect">
                        <img src="images/3d-design/render_living.jpg" 
                             alt="L-Shaped Marine Ply Modular Kitchen with Quartz Island in Madurai by Sai Indirabala Furnitures" 
                             class="work-card-img" 
                             width="600" height="400" loading="lazy">
                        <span class="work-card-badge">Modular Kitchens</span>
                        <span class="work-card-zoom-indicator" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            <span>Inspect</span>
                        </span>
                    </div>
                    <div class="work-card-body">
                        <h2 class="work-card-title" data-action="inspect">L-Shaped Marine Ply Modular Kitchen with Quartz Island</h2>
                        <p class="work-card-desc">710-grade boiling waterproof (BWP) marine ply carcass with scratch-resistant acrylic shutters, Blum soft-close fittings, and quartz breakfast island.</p>
                        <div class="work-card-actions">
                            <button type="button" class="btn-card-inspect" data-action="inspect">
                                <span>View Full Project</span>
                                <span aria-hidden="true">→</span>
                            </button>
                            <a href="https://wa.me/917418494994?text=Hi%20Sai%20Indirabala%20Furniture%2C%20I%20saw%20your%20completed%20Modular%20Kitchen.%20Please%20share%20details." 
                               target="_blank" 
                               rel="noopener" 
                               class="btn-card-wa" 
                               aria-label="Enquire about Modular Kitchen on WhatsApp">
                                <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.842L.057 23.453a.75.75 0 00.918.919l5.651-1.458A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 01-4.961-1.357l-.356-.211-3.683.95.978-3.584-.232-.369A9.721 9.721 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
                            </a>
                        </div>
                    </div>
                </article>

                <!-- 04. Custom Wardrobes -->
                <article class="work-card" data-work-id="proj-wardrobe-bedroom">
                    <div class="work-card-img-wrap" data-action="inspect">
                        <img src="images/3d-design/room_after.jpg" 
                             alt="Floor-to-Ceiling Bronze Glass Bedroom Wardrobe installation in Madurai by Sai Indirabala Furnitures" 
                             class="work-card-img" 
                             width="600" height="400" loading="lazy">
                        <span class="work-card-badge">Custom Wardrobes</span>
                        <span class="work-card-zoom-indicator" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            <span>Inspect</span>
                        </span>
                    </div>
                    <div class="work-card-body">
                        <h2 class="work-card-title" data-action="inspect">Floor-to-Ceiling Bronze Glass Bedroom Wardrobe</h2>
                        <p class="work-card-desc">Modern bedroom wardrobe with black slim aluminum profile doors, fluted bronze glass, warm 3000K motion-sensor profile lighting, and lockable storage compartments.</p>
                        <div class="work-card-actions">
                            <button type="button" class="btn-card-inspect" data-action="inspect">
                                <span>View Full Project</span>
                                <span aria-hidden="true">→</span>
                            </button>
                            <a href="https://wa.me/917418494994?text=Hi%20Sai%20Indirabala%20Furniture%2C%20I%20saw%20your%20completed%20Bronze%20Glass%20Wardrobe.%20Please%20share%20details." 
                               target="_blank" 
                               rel="noopener" 
                               class="btn-card-wa" 
                               aria-label="Enquire about Bronze Glass Wardrobe on WhatsApp">
                                <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.842L.057 23.453a.75.75 0 00.918.919l5.651-1.458A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 01-4.961-1.357l-.356-.211-3.683.95.978-3.584-.232-.369A9.721 9.721 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
                            </a>
                        </div>
                    </div>
                </article>

                <!-- 05. Institution Furniture -->
                <article class="work-card" data-work-id="proj-institution-desks">
                    <div class="work-card-img-wrap" data-action="inspect">
                        <img src="images/furniture/table.jpg" 
                             alt="Institutional Heavy-Duty Classroom Benches &amp; Desks supplied in Madurai by Sai Indirabala Furnitures" 
                             class="work-card-img" 
                             width="600" height="400" loading="lazy">
                        <span class="work-card-badge">Institution Furniture</span>
                        <span class="work-card-zoom-indicator" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            <span>Inspect</span>
                        </span>
                    </div>
                    <div class="work-card-body">
                        <h2 class="work-card-title" data-action="inspect">Institutional Heavy-Duty Classroom Benches &amp; Desks</h2>
                        <p class="work-card-desc">Heavy 16-gauge epoxy powder-coated tubular steel dual desks with integrated book baskets and rounded safety corners supplied for educational colleges across Tamil Nadu.</p>
                        <div class="work-card-actions">
                            <button type="button" class="btn-card-inspect" data-action="inspect">
                                <span>View Full Project</span>
                                <span aria-hidden="true">→</span>
                            </button>
                            <a href="https://wa.me/917418494994?text=Hi%20Sai%20Indirabala%20Furniture%2C%20I%20saw%20your%20completed%20College%20Dual%20Desks.%20Please%20share%20bulk%20quote." 
                               target="_blank" 
                               rel="noopener" 
                               class="btn-card-wa" 
                               aria-label="Enquire about College Dual Desks on WhatsApp">
                                <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.842L.057 23.453a.75.75 0 00.918.919l5.651-1.458A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 01-4.961-1.357l-.356-.211-3.683.95.978-3.584-.232-.369A9.721 9.721 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
                            </a>
                        </div>
                    </div>
                </article>

                <!-- 06. Commercial Interiors -->
                <article class="work-card" data-work-id="proj-commercial-billing">
                    <div class="work-card-img-wrap" data-action="inspect">
                        <img src="images/commercial/racks.jpg" 
                             alt="Commercial Retail Cash Counters &amp; Display Racks installed in Madurai by Sai Indirabala Furnitures" 
                             class="work-card-img" 
                             width="600" height="400" loading="lazy">
                        <span class="work-card-badge">Commercial Interiors</span>
                        <span class="work-card-zoom-indicator" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            <span>Inspect</span>
                        </span>
                    </div>
                    <div class="work-card-body">
                        <h2 class="work-card-title" data-action="inspect">Commercial Retail Cash Counters &amp; Display Racks</h2>
                        <p class="work-card-desc">Executive retail cash desk with lockable register drawers, CPU cabinet, and commercial-grade modular display racking systems for Madurai retail showroom.</p>
                        <div class="work-card-actions">
                            <button type="button" class="btn-card-inspect" data-action="inspect">
                                <span>View Full Project</span>
                                <span aria-hidden="true">→</span>
                            </button>
                            <a href="https://wa.me/917418494994?text=Hi%20Sai%20Indirabala%20Furniture%2C%20I%20saw%20your%20completed%20Commercial%20Counters.%20Please%20share%20details." 
                               target="_blank" 
                               rel="noopener" 
                               class="btn-card-wa" 
                               aria-label="Enquire about Commercial Counters on WhatsApp">
                                <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.842L.057 23.453a.75.75 0 00.918.919l5.651-1.458A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 01-4.961-1.357l-.356-.211-3.683.95.978-3.584-.232-.369A9.721 9.721 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
                            </a>
                        </div>
                    </div>
                </article>
            </div>`;

html = html.replace(
    `<div class="gallery-grid" id="gallery-grid">
                <!-- Project cards injected dynamically via js/ourWork.js -->
            </div>`,
    crawlableGridMarkup
);

// 5. Clean URLs in Footer & Thumb Bar
const oldFooterLinks = `<ul class="footer-links-list">
                        <li><a href="index.html" class="footer-link">Home</a></li>
                        <li><a href="index.html#services" class="footer-link">1. Office Furniture Arrangement</a></li>
                        <li><a href="index.html#services" class="footer-link">2. Custom Home Furniture</a></li>
                        <li><a href="index.html#services" class="footer-link">3. Institution &amp; College Furniture</a></li>
                        <li><a href="index.html#services" class="footer-link">4. Software Modular Workstations</a></li>
                        <li><a href="catalog.html" class="footer-link" style="color: var(--accent-light); font-weight: 600;">Product Catalog →</a></li>
                        <li><a href="our-work.html" class="footer-link" style="color: var(--accent-light); font-weight: 600;">Our Work Gallery (Current)</a></li>
                        <li><a href="index.html#contact" class="footer-link">Contact &amp; Workshop Directions</a></li>
                    </ul>`;

const newFooterLinks = `<ul class="footer-links-list">
                        <li><a href="/" class="footer-link">Home</a></li>
                        <li><a href="/#services" class="footer-link">1. Office Furniture Arrangement</a></li>
                        <li><a href="/#services" class="footer-link">2. Custom Home Furniture</a></li>
                        <li><a href="/#services" class="footer-link">3. Institution &amp; College Furniture</a></li>
                        <li><a href="/#services" class="footer-link">4. Software Modular Workstations</a></li>
                        <li><a href="/catalog" class="footer-link" style="color: var(--accent-light); font-weight: 600;">Product Catalog →</a></li>
                        <li><a href="/our-work" class="footer-link" style="color: var(--accent-light); font-weight: 600;">Our Work Gallery (Current)</a></li>
                        <li><a href="/#contact" class="footer-link">Contact &amp; Workshop Directions</a></li>
                    </ul>`;

html = html.replace(oldFooterLinks, newFooterLinks);

const oldThumb = `<nav class="mobile-thumb-bar" aria-label="Mobile Navigation">
        <a href="index.html" class="thumb-tab" id="thumb-home">
            <svg class="thumb-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span class="thumb-label">Home</span>
        </a>
        <a href="index.html#services" class="thumb-tab" id="thumb-services">
            <svg class="thumb-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            <span class="thumb-label">Services</span>
        </a>
        <a href="catalog.html" class="thumb-tab" id="thumb-catalog">
            <svg class="thumb-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <span class="thumb-label">Catalog</span>
        </a>
        <a href="our-work.html" class="thumb-tab active" id="thumb-works">
            <svg class="thumb-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span class="thumb-label">Our Work</span>
        </a>
        <a href="index.html#contact" class="thumb-tab thumb-highlight" id="thumb-contact">
            <svg class="thumb-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="thumb-label">Consult 3D</span>
        </a>
    </nav>`;

const newThumb = `<nav class="mobile-thumb-bar" aria-label="Mobile Navigation">
        <a href="/" class="thumb-tab" id="thumb-home">
            <svg class="thumb-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span class="thumb-label">Home</span>
        </a>
        <a href="/#services" class="thumb-tab" id="thumb-services">
            <svg class="thumb-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            <span class="thumb-label">Services</span>
        </a>
        <a href="/catalog" class="thumb-tab" id="thumb-catalog">
            <svg class="thumb-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <span class="thumb-label">Catalog</span>
        </a>
        <a href="/our-work" class="thumb-tab active" id="thumb-works">
            <svg class="thumb-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span class="thumb-label">Our Work</span>
        </a>
        <a href="/#contact" class="thumb-tab thumb-highlight" id="thumb-contact">
            <svg class="thumb-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="thumb-label">Consult 3D</span>
        </a>
    </nav>`;

html = html.replace(oldThumb, newThumb);

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully updated our-work.html with clean URLs, SEO meta, JSON-LD, and pre-rendered cards.');
