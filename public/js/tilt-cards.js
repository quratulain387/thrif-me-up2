/* ============================================================
   TILT CARDS — global 3D hover-tilt for product & category
   cards, site-wide. Works with dynamically-injected cards too
   (event delegation), so it covers home, shop, product,
   wishlist, and category pages without extra wiring.
   ============================================================ */
(function () {
  var SELECTOR = '.product-card, .cat-card';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasPointer = window.matchMedia('(pointer: fine)').matches;
  if (reduceMotion || !hasPointer) return;

  var current = null;

  function applyTilt(card, e) {
    var rect = card.getBoundingClientRect();
    var px = (e.clientX - rect.left) / rect.width - 0.5;
    var py = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transition = 'transform 0.08s linear';
    card.style.transform =
      'perspective(900px) rotateX(' + (-py * 9) + 'deg) rotateY(' + (px * 11) + 'deg) ' +
      'translateY(-6px) translateZ(0) scale(1.02)';
  }

  function resetCard(card) {
    card.style.transition = 'transform 0.5s cubic-bezier(0.2,0.8,0.2,1)';
    card.style.transform = '';
  }

  document.addEventListener('mousemove', function (e) {
    var card = e.target.closest ? e.target.closest(SELECTOR) : null;

    if (card !== current) {
      if (current) resetCard(current);
      current = card;
    }
    if (card) applyTilt(card, e);
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    if (current) {
      resetCard(current);
      current = null;
    }
  }, true);

  window.addEventListener('blur', function () {
    if (current) {
      resetCard(current);
      current = null;
    }
  });
})();
