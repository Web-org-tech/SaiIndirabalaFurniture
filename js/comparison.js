/**
 * SAI INDIRABALA FURNITURE - BEFORE & AFTER COMPARISON SLIDER
 * Unified mouse, touch, and keyboard drag handler with percentage-based clip.
 */

export function initComparison() {
    const containers = document.querySelectorAll('.comparison-container');

    containers.forEach(container => {
        const afterWrap = container.querySelector('.comp-after-wrap');
        const afterImg = afterWrap ? afterWrap.querySelector('.comp-img') : container.querySelector('.comp-img-after');
        const divider = container.querySelector('.comp-divider');
        const rangeInput = container.querySelector('.comp-range-input');

        function updatePosition(pct) {
            const clamped = Math.max(0, Math.min(100, pct));

            // Method 1: If using .comp-after-wrap
            if (afterWrap) {
                afterWrap.style.width = `${clamped}%`;
                if (afterImg) {
                    const cWidth = container.offsetWidth || container.getBoundingClientRect().width;
                    if (cWidth > 0) {
                        afterImg.style.width = `${cWidth}px`;
                    }
                }
            }

            // Method 2: Direct clip-path on top image (bulletproof fallback)
            const directAfter = container.querySelector('.comp-img-after');
            if (directAfter && !afterWrap) {
                directAfter.style.clipPath = `polygon(0 0, ${clamped}% 0, ${clamped}% 100%, 0 100%)`;
                directAfter.style.webkitClipPath = `polygon(0 0, ${clamped}% 0, ${clamped}% 100%, 0 100%)`;
            }

            // Divider position
            if (divider) {
                divider.style.left = `${clamped}%`;
            }

            // Accessible range
            if (rangeInput) {
                rangeInput.value = clamped;
            }
        }

        let isDragging = false;

        function getPosFromEvent(e) {
            const rect = container.getBoundingClientRect();
            const clientX = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
            const x = clientX - rect.left;
            return (x / rect.width) * 100;
        }

        function onStart(e) {
            isDragging = true;
            updatePosition(getPosFromEvent(e));
        }

        function onMove(e) {
            if (!isDragging) return;
            if (e.cancelable) e.preventDefault();
            updatePosition(getPosFromEvent(e));
        }

        function onEnd() {
            isDragging = false;
        }

        // Pointer & Mouse Events
        container.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);

        // Touch Events
        container.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
        window.addEventListener('touchcancel', onEnd);

        // Range input keyboard navigation
        if (rangeInput) {
            rangeInput.addEventListener('input', (e) => {
                updatePosition(parseFloat(e.target.value));
            });
        }

        // Resize Sync
        window.addEventListener('resize', () => {
            const currentPct = rangeInput ? parseFloat(rangeInput.value) : 50;
            updatePosition(currentPct || 50);
        });

        // Set initial 50% split
        updatePosition(50);
    });
}
