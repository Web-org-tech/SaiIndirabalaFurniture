/**
 * SAI INDIRABALA FURNITURE - MAIN COORDINATOR SCRIPT
 * High-Performance Vanilla JS (Zero Layout Thrashing, Throttled Scroll Observers)
 */

import { initSliders } from './slider.js';
import { initComparison } from './comparison.js';
import { initForms } from './form.js';
import { initCad360 } from './cad360.js';
import { initDesign3D } from './design3d.js';
import { initFeedback } from './feedback.js';

document.addEventListener('DOMContentLoaded', () => {
    // 01. Dismiss Loading Screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loadingScreen.classList.add('fade-out');
            }, 200);
        });

        // Fast fallback dismissal
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
        }, 800);
    }

    // 02. Header Scroll Elevation (Throttled with requestAnimationFrame)
    const siteHeader = document.querySelector('.site-header');
    if (siteHeader) {
        let isScrolled = false;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const shouldScroll = window.pageYOffset > 30;
                    if (shouldScroll !== isScrolled) {
                        isScrolled = shouldScroll;
                        siteHeader.classList.toggle('scrolled', isScrolled);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // 03. Mobile Hamburger Navigation Drawer
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const mobileDrawer = document.querySelector('.mobile-drawer');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');
    const drawerBackdrop = document.getElementById('drawer-backdrop');

    function openMobileMenu() {
        mobileDrawer.classList.add('open');
        hamburgerBtn.classList.add('active');        // ← three lines animate to X
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        if (drawerBackdrop) {
            drawerBackdrop.style.display = 'block';
            requestAnimationFrame(() => { drawerBackdrop.style.opacity = '1'; });
        }
    }

    function closeMobileMenu() {
        mobileDrawer.classList.remove('open');
        hamburgerBtn.classList.remove('active');     // ← X animates back to three lines
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        if (drawerBackdrop) {
            drawerBackdrop.style.opacity = '0';
            setTimeout(() => { drawerBackdrop.style.display = 'none'; }, 350);
        }
    }

    if (hamburgerBtn && mobileDrawer) {
        // Toggle: open when closed, close when showing as X
        hamburgerBtn.addEventListener('click', () => {
            if (mobileDrawer.classList.contains('open')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });

        // Creative close button inside drawer
        if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeMobileMenu);

        // Click on dark backdrop to close
        if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeMobileMenu);

        // Close on nav link click
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }


    // 04. Smooth Scroll for Anchor Links with Header Offset
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || !targetId) return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                const headerHeight = document.querySelector('.site-header')?.offsetHeight || 70;
                const elementPosition = targetEl.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 05. Intersection Observer for Scroll Reveals
    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -20px 0px'
        });

        reveals.forEach(el => observer.observe(el));
    } else {
        reveals.forEach(el => el.classList.add('revealed'));
    }

    // 06. Active Nav Highlighting (IntersectionObserver - ZERO Layout Thrashing)
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    if ('IntersectionObserver' in window && sections.length > 0) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                    });
                }
            });
        }, {
            threshold: 0.25,
            rootMargin: '-80px 0px -50% 0px'
        });

        sections.forEach(sec => sectionObserver.observe(sec));
    }

    // Initialize Submodules
    initSliders();
    initComparison();
    initForms();
    initCad360();
    initDesign3D();
    initFeedback();
});
