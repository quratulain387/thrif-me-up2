/* ============================================================
   ABOUT PAGE — LIVE DATA
   Swaps the static hero placeholder for a real product video (if
   any product has one) or the newest real product photo otherwise.
   Falls back silently to the gradient placeholder if none exist.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const hero = document.getElementById('about-hero-visual');
  if (!hero) return;

  try {
    const res = await fetch('/api/products?sort=newest&limit=16');
    const data = await res.json();
    const products = (data.products || []).filter(
      p => p.images?.[0]?.startsWith('/images/uploads/') || p.images?.[0]?.startsWith('http')
    );

    const withVideo = products.find(p => p.video);
    const chosen = withVideo || products[0];

    if (chosen) {
      hero.innerHTML = chosen.video
        ? `<video src="${chosen.video}" autoplay muted loop playsinline></video>`
        : `<img src="${chosen.images[0]}" alt="${chosen.name}">`;
    }
  } catch (err) {
    // Keep the gradient fallback — no visible error to the user
  }
});
