/**
 * SAI INDIRABALA FURNITURE - CUSTOMER FEEDBACK & REVIEWS MODULE
 * Manages initial 3 reviews display, View More / Show Less expansion,
 * and high-resolution output image modal preview.
 */

export function initFeedback() {
    const feedbackSection = document.getElementById('feedback');
    if (!feedbackSection) return;

    const viewMoreBtn = document.getElementById('toggle-reviews-btn');
    const extraReviews = feedbackSection.querySelectorAll('.feedback-card-extra');
    const btnText = viewMoreBtn ? viewMoreBtn.querySelector('.btn-text') : null;
    const btnIcon = viewMoreBtn ? viewMoreBtn.querySelector('.btn-icon') : null;

    let isExpanded = false;

    if (viewMoreBtn) {
        viewMoreBtn.addEventListener('click', () => {
            isExpanded = !isExpanded;

            extraReviews.forEach(card => {
                if (isExpanded) {
                    card.classList.add('is-visible');
                    card.removeAttribute('hidden');
                } else {
                    card.classList.remove('is-visible');
                    card.setAttribute('hidden', '');
                }
            });

            if (btnText) {
                btnText.textContent = isExpanded ? 'Show Fewer Reviews' : 'View More Reviews (3 more)';
            }
            if (btnIcon) {
                btnIcon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
            }

            if (!isExpanded) {
                feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Lightbox modal for review output images
    const lightboxModal = document.getElementById('review-lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close-btn');
    const lightboxBackdrop = document.getElementById('lightbox-backdrop');

    function openLightbox(src, caption) {
        if (!lightboxModal || !lightboxImg) return;
        lightboxImg.src = src;
        if (lightboxCaption) lightboxCaption.textContent = caption || 'Customer Furniture Output';
        lightboxModal.classList.add('active');
        lightboxModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightboxModal) return;
        lightboxModal.classList.remove('active');
        lightboxModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Attach click listener to all review output images and works gallery images
    const zoomableImages = document.querySelectorAll('.review-output-preview, .works-card-img-wrap, [data-lightbox]');
    zoomableImages.forEach(imgWrap => {
        imgWrap.addEventListener('click', (e) => {
            // Don't trigger if clicked a direct link inside
            if (e.target.tagName.toLowerCase() === 'a') return;
            e.preventDefault();
            const img = imgWrap.querySelector('img');
            const title = imgWrap.getAttribute('data-caption') || img?.getAttribute('alt') || 'Completed Project Craftsmanship';
            if (img && img.src) {
                openLightbox(img.src, title);
            }
        });
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('active')) {
            closeLightbox();
        }
    });
}

