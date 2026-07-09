/* ============================================================
   CURSOR GLOW — smooth, slightly-trailing light that follows
   the mouse across the whole page, at any scroll position.
   ============================================================ */
(function () {
  var el = document.getElementById('cursorGlow');
  if (!el) return;

  var hasPointer = window.matchMedia('(pointer: fine)').matches;
  if (!hasPointer) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  var cx = tx, cy = ty;
  var active = false;

  document.addEventListener('mousemove', function (e) {
    tx = e.clientX;
    ty = e.clientY;
    if (!active) {
      active = true;
      el.classList.add('is-active');
    }
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    active = false;
    el.classList.remove('is-active');
  });

  function tick() {
    var ease = reduceMotion ? 1 : 0.14;
    cx += (tx - cx) * ease;
    cy += (ty - cy) * ease;
    el.style.transform = 'translate(' + cx + 'px, ' + cy + 'px) translate(-50%, -50%)';
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
