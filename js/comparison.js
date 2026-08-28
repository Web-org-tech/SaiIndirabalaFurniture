/**
 * SAI INDIRABALA FURNITURE - GLITCH-FREE BEFORE & AFTER COMPARISON SLIDER
 * High-performance pointer-capture implementation with zero layout thrashing
 */

export function initComparison() {
    const containers = document.querySelectorAll('.comparison-container');

    containers.forEach(container => {
        const afterWrap = container.querySelector('.comp-after-wrap');
        const divider = container.querySelector('.comp-divider');
        const rangeInput = container.querySelector('.comp-range-input');

        let isDragging = false;

        function setPosition(percent) {
            const clamped = Math.max(0, Math.min(100, percent));
            
            // Set CSS variable on container
            container.style.setProperty('--comp-split', `${clamped}%`);

            // Update clip-path on top layer smoothly
            if (afterWrap) {
                afterWrap.style.clipPath = `polygon(0 0, ${clamped}% 0, ${clamped}% 100%, 0 100%)`;
                afterWrap.style.webkitClipPath = `polygon(0 0, ${clamped}% 0, ${clamped}% 100%, 0 100%)`;
                afterWrap.style.width = '100%'; // Ensure full size, never distorted
            }

            // Position the divider line
            if (divider) {
                divider.style.left = `${clamped}%`;
            }

            // Sync range input for keyboard / accessibility
            if (rangeInput && rangeInput.value !== String(Math.round(clamped))) {
                rangeInput.value = Math.round(clamped);
            }
        }

        function handlePointerMove(e) {
            if (!isDragging) return;
            const rect = container.getBoundingClientRect();
            if (rect.width <= 0) return;
            const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
            const x = clientX - rect.left;
            const pct = (x / rect.width) * 100;
            setPosition(pct);
        }

        function startDrag(e) {
            isDragging = true;
            container.classList.add('is-dragging');
            if (e.pointerId !== undefined && container.setPointerCapture) {
                try {
                    container.setPointerCapture(e.pointerId);
                } catch (err) {
                    // Fallback
                }
            }
            handlePointerMove(e);
        }

        function endDrag(e) {
            if (!isDragging) return;
            isDragging = false;
            container.classList.remove('is-dragging');
            if (e.pointerId !== undefined && container.releasePointerCapture) {
                try {
                    container.releasePointerCapture(e.pointerId);
                } catch (err) {
                    // Fallback
                }
            }
        }

        // Unified Pointer Events (works flawlessly for mouse, touch, pen)
        container.addEventListener('pointerdown', startDrag);
        container.addEventListener('pointermove', handlePointerMove);
        container.addEventListener('pointerup', endDrag);
        container.addEventListener('pointercancel', endDrag);
        container.addEventListener('pointerleave', (e) => {
            // Only end drag if not using pointer capture
            if (!container.hasPointerCapture || !container.hasPointerCapture(e.pointerId)) {
                endDrag(e);
            }
        });

        // Accessible range input listener
        if (rangeInput) {
            rangeInput.addEventListener('input', (e) => {
                setPosition(parseFloat(e.target.value));
            });
        }

        // Initialize at 50%
        setPosition(50);
    });
}
