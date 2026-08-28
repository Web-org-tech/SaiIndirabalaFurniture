/**
 * SAI INDIRABALA FURNITURE - HORIZONTAL SLIDER COMPONENT
 * Pure Vanilla JS supporting CSS Scroll-Snap, Touch Drag, Mouse Drag, and Arrow Navigation
 */

export function initSliders() {
    const sliderWrappers = document.querySelectorAll('.slider-wrapper, .works-swipe-wrapper');

    sliderWrappers.forEach(wrapper => {
        const track = wrapper.querySelector('.slider-track, .works-swipe-track');
        if (!track) return;

        // Find buttons in wrapper, or in parent section / header controls
        const section = wrapper.closest('section') || wrapper.parentElement;
        const prevBtn = wrapper.querySelector('.slider-prev') || section?.querySelector('.slider-prev');
        const nextBtn = wrapper.querySelector('.slider-next') || section?.querySelector('.slider-next');

        // Update arrow button disabled states
        function updateButtons() {
            if (!prevBtn || !nextBtn) return;
            const maxScrollLeft = track.scrollWidth - track.clientWidth;
            prevBtn.disabled = track.scrollLeft <= 5;
            nextBtn.disabled = track.scrollLeft >= maxScrollLeft - 5;
        }

        // Scroll step calculation (one card width + gap)
        function getScrollStep() {
            const firstCard = track.querySelector('.slider-card, .works-swipe-card');
            if (!firstCard) return track.clientWidth * 0.8;
            const style = window.getComputedStyle(track);
            const gap = parseFloat(style.gap) || 20;
            return firstCard.offsetWidth + gap;
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
            });
        }

        // Track scroll event for button state
        let scrollTimeout;
        track.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(updateButtons, 50);
        }, { passive: true });

        // Mouse Drag to Scroll for Desktop
        let isDown = false;
        let startX;
        let scrollLeft;

        track.addEventListener('mousedown', (e) => {
            // Only drag on primary mouse button and not on interactive links/buttons
            if (e.button !== 0 || e.target.closest('a, button')) return;
            isDown = true;
            track.classList.add('dragging');
            startX = e.pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
        });

        track.addEventListener('mouseleave', () => {
            isDown = false;
            track.classList.remove('dragging');
        });

        track.addEventListener('mouseup', () => {
            isDown = false;
            track.classList.remove('dragging');
        });

        track.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - track.offsetLeft;
            const walk = (x - startX) * 1.5;
            track.scrollLeft = scrollLeft - walk;
        });

        // Initialize state
        updateButtons();
        window.addEventListener('resize', updateButtons);
    });
}

