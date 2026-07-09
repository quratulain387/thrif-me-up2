/* ============================================================
   HERO CAROUSEL — auto-rotates through hero images with a smooth
   fade + slide + idle float. Supports manual arrows/dots and
   pauses while the user is interacting.

   DYNAMIC CONTENT NOTE: the slide images live in the DOM as
   `.hero-slide` elements (not hardcoded in this script), so this
   same rotation logic will work unchanged once an Admin Panel
   feature lets an admin upload/reorder hero images — the admin
   UI just needs to write new `.hero-slide` markup into
   `[data-hero-carousel]`; this script only manages which slide
   is active, not what the slides contain.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const carousel = document.querySelector('[data-hero-carousel]');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('.hero-slide'));
  const dots = Array.from(carousel.querySelectorAll('.dot'));
  const prevBtn = carousel.querySelector('.carousel-arrow.prev');
  const nextBtn = carousel.querySelector('.carousel-arrow.next');

  if (slides.length <= 1) return; // nothing to rotate

  let current = slides.findIndex(s => s.classList.contains('is-active'));
  if (current === -1) current = 0;

  let autoplayTimer = null;
  const AUTOPLAY_MS = 4200;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function goTo(index) {
    const nextIndex = (index + slides.length) % slides.length;
    if (nextIndex === current) return;

    slides[current].classList.remove('is-active');
    slides[current].classList.add('is-leaving');
    slides[nextIndex].classList.add('is-active');

    dots[current]?.classList.remove('is-active');
    dots[nextIndex]?.classList.add('is-active');

    // Clean up the leaving class after the transition finishes
    setTimeout(() => slides[current].classList.remove('is-leaving'), 1300);

    current = nextIndex;

    // Let other scripts (e.g. the hero 3D tilt) know a slide just
    // changed, so they can play their own reaction automatically —
    // not just in response to the cursor.
    carousel.dispatchEvent(new CustomEvent('heroslidechange', { detail: { index: current } }));
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoplay() {
    if (prefersReducedMotion) return; // respect reduced-motion preference
    stopAutoplay();
    autoplayTimer = setInterval(next, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
  function resumeAfterInteraction() {
    stopAutoplay();
    // brief pause so the user's manual choice stays visible for a moment
    setTimeout(startAutoplay, 2500);
  }

  nextBtn?.addEventListener('click', () => { next(); resumeAfterInteraction(); });
  prevBtn?.addEventListener('click', () => { prev(); resumeAfterInteraction(); });
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); resumeAfterInteraction(); });
  });

  // Pause on hover / touch, resume when the user moves away
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('touchstart', stopAutoplay, { passive: true });
  carousel.addEventListener('touchend', resumeAfterInteraction, { passive: true });

  startAutoplay();
});
