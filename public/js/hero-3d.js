/* ============================================================
   HERO 3D — full-bleed hero image tilts in real 3D space:
   - Idle ambient float (always on, so motion is visible with
     zero interaction)
   - Mouse-parallax tilt toward the cursor (desktop)
   - Scroll-linked 3D tilt + scale + copy fade, so the image
     visibly moves in 3D as soon as the visitor starts scrolling
   - Auto "reflect" pulse: every time the carousel changes slide
     (its own autoplay, arrows, or dots — not just the cursor),
     the same 3D tilt reacts on its own, so the effect isn't only
     tied to mouse movement.
   ============================================================ */
(function () {
  var hero = document.getElementById('hero');
  var bg = document.getElementById('heroBg');
  var copy = document.querySelector('.hero-copy--on-image');
  if (!hero || !bg) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var hasPointer = window.matchMedia('(pointer: fine)').matches;

  var targetRotX = 0, targetRotY = 0;
  var curRotX = 0, curRotY = 0;
  var t = 0;

  // Auto "reflect" pulse, fired on every slide change.
  var pulseStart = 0;
  var pulseActive = false;
  var PULSE_MS = 1100;

  hero.addEventListener('mousemove', function (e) {
    var rect = hero.getBoundingClientRect();
    var px = (e.clientX - rect.left) / rect.width - 0.5;
    var py = (e.clientY - rect.top) / rect.height - 0.5;
    targetRotY = px * 8;
    targetRotX = -py * 6;
  });
  hero.addEventListener('mouseleave', function () {
    targetRotX = 0;
    targetRotY = 0;
  });

  bg.addEventListener('heroslidechange', function () {
    pulseStart = performance.now();
    pulseActive = true;
  });

  function scrollProgress() {
    var rect = hero.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = -rect.top / (vh * 0.9);
    return Math.max(0, Math.min(1, p));
  }

  function pulseOffset() {
    if (!pulseActive) return 0;
    var elapsed = performance.now() - pulseStart;
    if (elapsed >= PULSE_MS) {
      pulseActive = false;
      return 0;
    }
    var p = elapsed / PULSE_MS;
    // Swings out toward the viewer and eases back — a damped sine.
    var damp = Math.exp(-p * 3.2);
    return Math.sin(p * Math.PI * 2.4) * 10 * damp;
  }

  function tick() {
    t += 0.016;
    var idleX = Math.sin(t * 0.5) * (hasPointer ? 1 : 2.5);
    var idleY = Math.cos(t * 0.4) * (hasPointer ? 1.5 : 3);

    curRotX += (targetRotX - curRotX) * 0.06;
    curRotY += (targetRotY - curRotY) * 0.06;

    var progress = scrollProgress();
    var scrollTiltX = progress * 9;
    var scrollScale = 1 + progress * 0.14;
    var scrollLift = progress * 30;

    var pulse = pulseOffset();

    var finalX = curRotX + idleX + scrollTiltX + pulse * 0.35;
    var finalY = curRotY + idleY + pulse;
    var finalScale = scrollScale + (pulseActive ? Math.abs(pulse) * 0.0012 : 0);

    bg.style.transform =
      'translateY(' + (-scrollLift) + 'px) scale(' + finalScale + ') ' +
      'rotateX(' + finalX + 'deg) rotateY(' + finalY + 'deg)';

    if (copy) {
      copy.style.opacity = String(Math.max(0, 1 - progress * 1.3));
      copy.style.transform = 'translateY(' + (progress * 24) + 'px)';
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
