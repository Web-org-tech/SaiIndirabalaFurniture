/**
 * SAI INDIRABALA FURNITURE - 3D DESIGN SHOWCASE SLIDER
 * Auto-advances every 3 seconds with interactive pagination, pause on hover, and smooth slide transitions.
 */

export function initDesign3D() {
    const slider = document.getElementById('design-3d-slider');
    if (!slider) return;

    const slides = slider.querySelectorAll('.design-3d-slide');
    const dotsContainer = slider.querySelector('.design-3d-dots');
    const prevBtn = slider.querySelector('.design-3d-prev');
    const nextBtn = slider.querySelector('.design-3d-next');
    const progressBar = slider.querySelector('.design-3d-progress-fill');

    if (!slides.length) return;

    let currentIndex = 0;
    const totalSlides = slides.length;
    const INTERVAL_TIME = 3000; // 3 seconds per user request
    let timer = null;
    let isHovered = false;

    // Create pagination dots
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        slides.forEach((_, idx) => {
            const dot = document.createElement('button');
            dot.className = `design-3d-dot ${idx === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Go to 3D Slide ${idx + 1}`);
            dot.addEventListener('click', () => {
                goToSlide(idx);
                restartTimer();
            });
            dotsContainer.appendChild(dot);
        });
    }

    const dots = dotsContainer ? dotsContainer.querySelectorAll('.design-3d-dot') : [];

    function updateSlideDisplay(newIndex) {
        slides.forEach((slide, idx) => {
            slide.classList.toggle('active', idx === newIndex);
        });

        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === newIndex);
        });

        // Reset and trigger progress bar animation
        if (progressBar) {
            progressBar.style.transition = 'none';
            progressBar.style.width = '0%';
            requestAnimationFrame(() => {
                if (!isHovered) {
                    progressBar.style.transition = `width ${INTERVAL_TIME}ms linear`;
                    progressBar.style.width = '100%';
                }
            });
        }
    }

    function goToSlide(index) {
        currentIndex = (index + totalSlides) % totalSlides;
        updateSlideDisplay(currentIndex);
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    function startTimer() {
        stopTimer();
        if (progressBar) {
            progressBar.style.transition = `width ${INTERVAL_TIME}ms linear`;
            progressBar.style.width = '100%';
        }
        timer = setInterval(() => {
            if (!isHovered) {
                nextSlide();
            }
        }, INTERVAL_TIME);
    }

    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        if (progressBar) {
            progressBar.style.transition = 'none';
            progressBar.style.width = '0%';
        }
    }

    function restartTimer() {
        startTimer();
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            restartTimer();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            restartTimer();
        });
    }

    // Pause on hover
    slider.addEventListener('mouseenter', () => {
        isHovered = true;
        if (progressBar) {
            progressBar.style.transition = 'none';
        }
    });

    slider.addEventListener('mouseleave', () => {
        isHovered = false;
        restartTimer();
    });

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    slider.addEventListener('touchstart', (e) => {
        isHovered = true;
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        isHovered = false;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 40) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
        restartTimer();
    }, { passive: true });

    // Initialize first slide and start 3-second auto slide
    updateSlideDisplay(0);
    startTimer();
}
