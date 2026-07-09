/* ============================================================
   ABOUT HERO 3D — the same idle-float + mouse-parallax tilt used
   on the homepage hero, applied to the About page's photo/video
   frame (#about-hero-visual), so the 3D feel is consistent
   across pages. Also auto-pulses on its own every few seconds,
   so the 3D "reflect" reaction isn't only tied to the cursor.
   ============================================================ */
(function () {
  var el = document.getElementById('about-hero-visual');
  if (!el) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var hasPointer = window.matchMedia('(pointer: fine)').matches;

  var targetX = 0, targetY = 0;
  var curX = 0, curY = 0;
  var t = 0;

  // Auto "reflect" pulse — fires on its own every few seconds, not
  // just on hover, so the video visibly reacts in 3D even if the
  // visitor never touches it.
  var pulseStart = 0;
  var pulseActive = false;
  var PULSE_MS = 1100;
  var AUTO_PULSE_EVERY_MS = 4800;

  function firePulse() {
    pulseStart = performance.now();
    pulseActive = true;
  }
  setInterval(firePulse, AUTO_PULSE_EVERY_MS);
  setTimeout(firePulse, 900); // one shortly after the page loads

  function pulseOffset() {
    if (!pulseActive) return 0;
    var elapsed = performance.now() - pulseStart;
    if (elapsed >= PULSE_MS) {
      pulseActive = false;
      return 0;
    }
    var p = elapsed / PULSE_MS;
    var damp = Math.exp(-p * 3.2);
    return Math.sin(p * Math.PI * 2.4) * 9 * damp;
  }

  el.addEventListener('mousemove', function (e) {
    var rect = el.getBoundingClientRect();
    var px = (e.clientX - rect.left) / rect.width - 0.5;
    var py = (e.clientY - rect.top) / rect.height - 0.5;
    targetY = px * 10;
    targetX = -py * 8;
  });
  el.addEventListener('mouseleave', function () {
    targetX = 0;
    targetY = 0;
  });

  function tick() {
    t += 0.016;
    var idleX = Math.sin(t * 0.5) * (hasPointer ? 1.5 : 3);
    var idleY = Math.cos(t * 0.4) * (hasPointer ? 2 : 3.5);

    curX += (targetX - curX) * 0.06;
    curY += (targetY - curY) * 0.06;

    var pulse = pulseOffset();

    el.style.transform =
      'perspective(1200px) rotateX(' + (curX + idleX + pulse * 0.3) + 'deg) rotateY(' + (curY + idleY + pulse) + 'deg)';

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
