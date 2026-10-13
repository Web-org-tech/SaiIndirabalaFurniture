/**
 * SAI INDIRABALA FURNITURE - HERO BANNER ENGINE
 * Renders dynamic homepage hero banners based on the 0 / 1 / Many behavioral rule:
 * - 0 published banners: Displays static local fallback (images/hero/hero_furniture.png).
 * - 1 published banner: Displays static single banner (no autoplay, no carousel controls).
 * - 2+ published banners: Displays infinite circular carousel with autoplay, touch, and controls.
 */

import { getSupabase, isConfigured } from './supabaseClient.js';

let bannerTimer = null;
let currentSlideIndex = 0;
let totalBanners = 0;
let isPaused = false;

/**
 * Initializes the hero banner engine on the homepage.
 */
export async function initHeroBanner() {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;

    const visualWrap = heroSection.querySelector('.hero-visual-wrap');
    if (!visualWrap) return;

    // Clear any existing timer to prevent leaks on re-init
    if (bannerTimer) {
        clearInterval(bannerTimer);
        bannerTimer = null;
    }

    // Default fallback image path
    const FALLBACK_IMAGE_SRC = 'images/hero/hero_furniture.png';

    // 01. Verify Supabase configuration before attempting database query
    if (!isConfigured()) {
        // CASE 0 (Default): Unconfigured environment - preserve local fallback hero
        return;
    }

    try {
        const supabase = await getSupabase();
        if (!supabase) return;

        // 02. Fetch published hero banners ordered by display_order ASC, created_at DESC
        const { data: banners, error } = await supabase
            .from('hero_banners')
            .select('id, title, subtitle, image_url, button_text, button_link, display_order')
            .eq('is_published', true)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error || !banners || banners.length === 0) {
            // CASE 0: Zero published banners - keep existing local fallback
            return;
        }

        totalBanners = banners.length;

        // ── CASE 1: EXACTLY ONE PUBLISHED BANNER ──────────────────────────────
        if (totalBanners === 1) {
            renderSingleBanner(banners[0], visualWrap, heroSection, FALLBACK_IMAGE_SRC);
            return;
        }

        // ── CASE 2+: TWO OR MORE PUBLISHED BANNERS (CIRCULAR CAROUSEL) ─────────
        renderBannerCarousel(banners, visualWrap, heroSection, FALLBACK_IMAGE_SRC);

    } catch (err) {
        console.warn('[Hero Banner Engine] Error fetching banners, keeping static fallback:', err.message);
    }
}

/**
 * Renders a single static banner without carousel autoplay or navigation controls.
 */
function renderSingleBanner(banner, visualWrap, heroSection, fallbackSrc) {
    const existingImg = visualWrap.querySelector('.hero-img');
    const floatingTitle = visualWrap.querySelector('.floating-title');
    const floatingText = visualWrap.querySelector('.floating-text');
    const primaryCta = heroSection.querySelector('#hero-primary-cta');

    // Update Image with safe error fallback
    if (existingImg && banner.image_url) {
        const tempImg = new Image();
        tempImg.onload = () => {
            existingImg.src = banner.image_url;
            if (banner.title) existingImg.alt = banner.title;
        };
        tempImg.onerror = () => {
            console.warn('[Hero Banner] Failed to load banner image URL. Falling back to local hero.');
            existingImg.src = fallbackSrc;
        };
        tempImg.src = banner.image_url;
    }

    // Update Floating Card Copy if provided
    if (floatingTitle && banner.title) {
        floatingTitle.textContent = banner.title;
    }
    if (floatingText && banner.subtitle) {
        floatingText.textContent = banner.subtitle;
    }

    // Update CTA button if custom button configured
    if (primaryCta) {
        const textSpan = primaryCta.querySelector('span');
        const btnText = (banner.button_text && banner.button_text.trim()) ? banner.button_text.trim() : 'Get Free Consultation';
        const btnLink = (banner.button_link && banner.button_link.trim()) ? banner.button_link.trim() : '#contact';
        if (textSpan) textSpan.textContent = btnText;
        primaryCta.href = btnLink;
        primaryCta.setAttribute('aria-label', btnText);
    }
}

/**
 * Renders a circular sliding carousel with touch swipe, autoplay, and accessible controls.
 */
function renderBannerCarousel(banners, visualWrap, heroSection, fallbackSrc) {
    currentSlideIndex = 0;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Construct Carousel HTML inside visual wrap
    visualWrap.innerHTML = `
        <div class="hero-carousel-container" role="region" aria-label="Hero Banners Showcase" tabindex="0">
            <div class="hero-carousel-track">
                ${banners.map((b, idx) => `
                    <div class="hero-carousel-slide ${idx === 0 ? 'active' : ''}" 
                         data-index="${idx}" 
                         role="group" 
                         aria-roledescription="slide" 
                         aria-label="${idx + 1} of ${banners.length}">
                        <img src="${b.image_url}" 
                             alt="${b.title || 'Sai Indirabala Custom Furniture'}" 
                             class="hero-img" 
                             loading="${idx === 0 ? 'eager' : 'lazy'}"
                             onerror="this.src='${fallbackSrc}';">
                        <div class="hero-floating-card">
                            <div class="floating-title">${b.title || '100% Custom Execution'}</div>
                            <div class="floating-text">${b.subtitle || 'High-quality artificial boards, durable finishes, and precision fittings.'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Navigation Controls -->
            <button type="button" class="hero-carousel-nav prev" aria-label="Previous Hero Banner">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <button type="button" class="hero-carousel-nav next" aria-label="Next Hero Banner">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
            </button>

            <!-- Pagination Indicators -->
            <div class="hero-carousel-dots" role="tablist" aria-label="Banner slides">
                ${banners.map((_, idx) => `
                    <button type="button" 
                            class="hero-carousel-dot ${idx === 0 ? 'active' : ''}" 
                            data-index="${idx}" 
                            role="tab" 
                            aria-selected="${idx === 0 ? 'true' : 'false'}" 
                            aria-label="Go to banner ${idx + 1}">
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    const container = visualWrap.querySelector('.hero-carousel-container');
    const slides = visualWrap.querySelectorAll('.hero-carousel-slide');
    const dots = visualWrap.querySelectorAll('.hero-carousel-dot');
    const prevBtn = visualWrap.querySelector('.hero-carousel-nav.prev');
    const nextBtn = visualWrap.querySelector('.hero-carousel-nav.next');
    const primaryCta = heroSection.querySelector('#hero-primary-cta');

    function updateSlide(newIndex) {
        currentSlideIndex = (newIndex + totalBanners) % totalBanners;

        slides.forEach((slide, idx) => {
            const isActive = idx === currentSlideIndex;
            slide.classList.toggle('active', isActive);
            slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });

        dots.forEach((dot, idx) => {
            const isActive = idx === currentSlideIndex;
            dot.classList.toggle('active', isActive);
            dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // Update primary CTA to match current active slide
        const currentBanner = banners[currentSlideIndex];
        if (primaryCta && currentBanner) {
            const textSpan = primaryCta.querySelector('span');
            const btnText = (currentBanner.button_text && currentBanner.button_text.trim()) ? currentBanner.button_text.trim() : 'Get Free Consultation';
            const btnLink = (currentBanner.button_link && currentBanner.button_link.trim()) ? currentBanner.button_link.trim() : '#contact';
            if (textSpan) textSpan.textContent = btnText;
            primaryCta.href = btnLink;
            primaryCta.setAttribute('aria-label', btnText);
        }
    }

    function nextSlide() {
        updateSlide(currentSlideIndex + 1);
    }

    function prevSlide() {
        updateSlide(currentSlideIndex - 1);
    }

    function startAutoplay() {
        if (prefersReducedMotion || isPaused) return;
        stopAutoplay();
        bannerTimer = setInterval(nextSlide, 5000); // 5 seconds interval
    }

    function stopAutoplay() {
        if (bannerTimer) {
            clearInterval(bannerTimer);
            bannerTimer = null;
        }
    }

    // Button Listeners
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nextSlide();
            startAutoplay();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            prevSlide();
            startAutoplay();
        });
    }

    // Dot Listeners
    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetIdx = parseInt(dot.getAttribute('data-index'), 10);
            if (!isNaN(targetIdx)) {
                updateSlide(targetIdx);
                startAutoplay();
            }
        });
    });

    // Pause on Hover / Focus
    if (container) {
        container.addEventListener('mouseenter', () => {
            isPaused = true;
            stopAutoplay();
        });

        container.addEventListener('mouseleave', () => {
            isPaused = false;
            startAutoplay();
        });

        container.addEventListener('focusin', () => {
            isPaused = true;
            stopAutoplay();
        });

        container.addEventListener('focusout', () => {
            isPaused = false;
            startAutoplay();
        });

        // Touch Swipe Interaction for Mobile
        let touchStartX = 0;
        let touchEndX = 0;

        container.addEventListener('touchstart', (e) => {
            isPaused = true;
            stopAutoplay();
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            isPaused = false;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 40) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
            startAutoplay();
        }, { passive: true });
    }

    // Initialize first slide and start timer
    updateSlide(0);
    startAutoplay();
}
