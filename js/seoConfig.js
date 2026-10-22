/**
 * SAI INDIRABALA FURNITURES - CENTRALIZED SEO CONFIGURATION
 * Single source of truth for canonical domains, page metadata,
 * business entity details, Open Graph tags, and Schema.org structured data.
 *
 * Adheres strictly to verified business facts without keyword stuffing or fake data.
 */

export const SEO_BASE_URL = 'https://saiindirabala.in';

export const BUSINESS_INFO = {
    name: 'Sai Indirabala Furnitures',
    legalName: 'Sai Indirabala Furniture & Interiors',
    alternateName: 'SIB Furniture & Interiors',
    description: 'Custom furniture manufacturer, modular office workstations, home furniture, modular kitchens, wardrobes, institution desks, and commercial showroom fixtures in Madurai, Tamil Nadu. Direct factory pricing with photorealistic 3D design visualization.',
    url: SEO_BASE_URL,
    logo: `${SEO_BASE_URL}/images/icon/logo.png`,
    image: `${SEO_BASE_URL}/images/hero/hero_furniture.png`,
    telephone: ['+917418494994', '+918428994994'],
    displayPhone: '+91 7418 4949 94',
    secondaryPhone: '+91 8428 994 994',
    email: 'sibfurniture2016@gmail.com',
    priceRange: '₹₹ - ₹₹₹',
    address: {
        '@type': 'PostalAddress',
        streetAddress: 'Pasingapuram, Madurai–Alanganallur Main Road, Near Boston College, Pothumbu Post',
        addressLocality: 'Madurai',
        postalCode: '625018',
        addressRegion: 'Tamil Nadu',
        addressCountry: 'IN'
    },
    geo: {
        '@type': 'GeoCoordinates',
        latitude: 9.990083,
        longitude: 78.099811
    },
    hasMap: 'https://maps.app.goo.gl/ChdiqfkBCWkqRrYo9',
    openingHoursSpecification: [
        {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: '09:00',
            closes: '20:00'
        }
    ],
    areaServed: [
        { '@type': 'City', name: 'Madurai' },
        { '@type': 'City', name: 'Dindigul' },
        { '@type': 'City', name: 'Theni' },
        { '@type': 'City', name: 'Virudhunagar' },
        { '@type': 'City', name: 'Sivaganga' },
        { '@type': 'City', name: 'Trichy' },
        { '@type': 'City', name: 'Coimbatore' },
        { '@type': 'City', name: 'Chennai' },
        { '@type': 'State', name: 'Tamil Nadu' }
    ],
    servicesProvided: [
        'Furniture sales',
        'Interior design',
        'Modular kitchen',
        'Wardrobes',
        'Home interiors',
        'Office interiors',
        'Institutional furniture',
        'Commercial showroom fixtures'
    ]
};

export const PAGE_METADATA = {
    '/': {
        title: 'Custom Furniture & 3D Interior Design in Madurai | Sai Indirabala Furnitures',
        description: 'Direct factory custom furniture, modular kitchens, wardrobes & office workstations in Madurai, Tamil Nadu. Realistic 3D design before manufacturing. Call +91 74184 94994.',
        canonical: `${SEO_BASE_URL}/`,
        robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        ogType: 'website',
        ogTitle: 'Custom Furniture & 3D Interior Design in Madurai | Sai Indirabala Furnitures',
        ogDescription: 'Direct factory custom furniture, modular kitchens, wardrobes & office workstations in Madurai, Tamil Nadu. Realistic 3D visualization before we build.',
        ogImage: `${SEO_BASE_URL}/images/hero/hero_furniture.png`,
        ogImageAlt: 'Custom handcrafted wooden furniture and modern interior design in Madurai by Sai Indirabala Furnitures',
        twitterCard: 'summary_large_image'
    },
    '/catalog': {
        title: 'Furniture Catalog & Collections in Madurai | Sai Indirabala Furnitures',
        description: 'Explore custom wooden furniture, modular kitchens, wardrobe collections, office workstations, and institutional desks made in our Madurai workshop. Direct factory prices.',
        canonical: `${SEO_BASE_URL}/catalog`,
        robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        ogType: 'website',
        ogTitle: 'Furniture Catalog & Collections in Madurai | Sai Indirabala Furnitures',
        ogDescription: 'Explore handcrafted wooden furniture, modular kitchens, wardrobes, and modular office systems direct from our Madurai workshop.',
        ogImage: `${SEO_BASE_URL}/images/hero/hero_furniture.png`,
        ogImageAlt: 'Direct factory furniture catalog by Sai Indirabala Furnitures Madurai',
        twitterCard: 'summary_large_image'
    },
    '/our-work': {
        title: 'Our Work & Client Installations in Madurai | Sai Indirabala Furnitures',
        description: 'Portfolio of completed home interiors, modular office setups, custom wooden sofas, and institution furniture across Madurai and Tamil Nadu. View real project photographs.',
        canonical: `${SEO_BASE_URL}/our-work`,
        robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        ogType: 'website',
        ogTitle: 'Our Work & Client Installations in Madurai | Sai Indirabala Furnitures',
        ogDescription: 'Real completed client installations across Madurai and Tamil Nadu. Custom home furniture, 3D interiors, modular office systems, and institutional setups.',
        ogImage: `${SEO_BASE_URL}/images/hero/hero_furniture.png`,
        ogImageAlt: 'Completed client interior projects and furniture installations across Tamil Nadu by Sai Indirabala Furnitures',
        twitterCard: 'summary_large_image'
    },
    '/404': {
        title: '404 - Page Not Found | Sai Indirabala Furnitures Madurai',
        description: 'The requested page cannot be found. Return to Sai Indirabala Furnitures homepage for custom furniture and 3D interior design in Madurai.',
        canonical: null, // Strictly null to avoid canonicalizing 404 pages
        robots: 'noindex, follow',
        ogType: 'website',
        ogTitle: '404 - Page Not Found | Sai Indirabala Furnitures Madurai',
        ogDescription: 'This space is under construction. Return to Sai Indirabala Furnitures homepage.',
        ogImage: `${SEO_BASE_URL}/images/hero/hero_furniture.png`,
        ogImageAlt: 'Sai Indirabala Furnitures Madurai',
        twitterCard: 'summary'
    }
};

/**
 * Builds standard LocalBusiness Schema.org JSON-LD object.
 */
export function buildLocalBusinessSchema() {
    return {
        '@type': ['FurnitureStore', 'HomeAndConstructionBusiness'],
        '@id': `${SEO_BASE_URL}/#localbusiness`,
        name: BUSINESS_INFO.name,
        alternateName: BUSINESS_INFO.alternateName,
        url: BUSINESS_INFO.url,
        logo: BUSINESS_INFO.logo,
        image: BUSINESS_INFO.image,
        telephone: BUSINESS_INFO.telephone,
        email: BUSINESS_INFO.email,
        priceRange: BUSINESS_INFO.priceRange,
        address: BUSINESS_INFO.address,
        geo: BUSINESS_INFO.geo,
        hasMap: BUSINESS_INFO.hasMap,
        openingHoursSpecification: BUSINESS_INFO.openingHoursSpecification,
        areaServed: BUSINESS_INFO.areaServed,
        description: BUSINESS_INFO.description
    };
}
