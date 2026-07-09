/* ============================================================
   HOME PAGE — LIVE DATA
   Swaps the static demo hero slides + "New Arrivals / Best Sellers"
   cards for real products from the database, so the homepage always
   reflects whatever is actually in the shop. Falls back to the
   original static markup if the fetch fails for any reason.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  function imageToClass(imagePath) {
    if (!imagePath) return 'ph-cream-plain';
    if ((imagePath.startsWith('/images/uploads/') || imagePath.startsWith('http'))) return null;
    const file = imagePath.split('/').pop().replace(/\.[^.]+$/, '');
    return file.replace(/^placeholder-/, 'ph-');
  }

  function productVisualHTML(imagePath) {
    const cls = imageToClass(imagePath);
    if (cls === null) {
      return `<img src="${imagePath}" class="product-visual" style="object-fit:cover;">`;
    }
    return `<div class="product-visual ${cls}"></div>`;
  }

  function productCardHTML(p, tagLabel, tagClass) {
    const active = typeof isWishlisted === 'function' && isWishlisted(p._id);
    return `
      <article class="product-card reveal is-visible">
        <a href="/product.html?slug=${p.slug}" style="display:block;">
          <div class="product-media">
            <span class="tag ${tagClass}">${tagLabel}</span>
            <button class="wishlist-btn ${active ? 'is-active' : ''}" aria-label="Add to wishlist" aria-pressed="${active}" data-id="${p._id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.images?.[0] || ''}" data-size="${p.size}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
            </button>
            ${productVisualHTML(p.images?.[0])}
            <span class="quick-add" data-id="${p._id}" data-name="${p.name}">Quick Add</span>
          </div>
          <div class="product-info">
            <p class="p-category">${p.category?.name || ''}</p>
            <h5>${p.name}</h5>
            <div class="p-price"><span class="now">Rs. ${p.price.toLocaleString()}</span></div>
          </div>
        </a>
      </article>
    `;
  }

  function wireCard(container, products) {
    container.querySelectorAll('.wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof toggleWishlist !== 'function') return;
        const active = toggleWishlist({
          productId: btn.dataset.id,
          name: btn.dataset.name,
          price: Number(btn.dataset.price),
          image: btn.dataset.image,
          size: btn.dataset.size,
        });
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
    });
    container.querySelectorAll('.quick-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const product = products.find(p => p._id === btn.dataset.id);
        if (product && typeof addToCart === 'function') {
          addToCart({
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.images?.[0],
            size: product.size,
            stock: product.stock,
          });
        }
      });
    });
  }

  // ---------- Hero carousel: 6 real photos/videos, video-first ----------
  try {
    const carousel = document.querySelector('[data-hero-carousel]');
    const slides = carousel ? Array.from(carousel.querySelectorAll('.hero-slide')) : [];
    if (slides.length) {
      const res = await fetch('/api/products?sort=newest&limit=16');
      const data = await res.json();
      let products = data.products || [];

      // Only use products that actually have a real (non-placeholder) photo
      products = products.filter(p => p.images?.[0]?.startsWith('/images/uploads/') || p.images?.[0]?.startsWith('http'));

      // Show products with a video first, so the carousel highlights
      // them the way an Instagram Reel would be highlighted.
      products.sort((a, b) => (b.video ? 1 : 0) - (a.video ? 1 : 0));

      products.slice(0, slides.length).forEach((p, i) => {
        if (p.video) {
          slides[i].innerHTML = `<video src="${p.video}" autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"></video>`;
        } else {
          slides[i].innerHTML = `<img src="${p.images[0]}" alt="${p.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">`;
        }
      });
    }
  } catch (err) {
    // Keep the gradient fallback slides — no visible error to the user
  }

  // ---------- Shop by Category grid: real categories + a real cover photo ----------
  try {
    const catGrid = document.querySelector('.cat-grid');
    if (catGrid) {
      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      const categories = catData.categories || [];

      if (categories.length) {
        const withCovers = await Promise.all(categories.map(async (cat) => {
          try {
            const pRes = await fetch(`/api/products?category=${cat._id}&limit=1`);
            const pData = await pRes.json();
            return { ...cat, cover: pData.products?.[0]?.images?.[0], count: pData.total || 0 };
          } catch {
            return { ...cat, cover: null, count: 0 };
          }
        }));

        catGrid.innerHTML = withCovers.map((cat, i) => `
          <a href="/shop.html?category=${cat._id}" class="cat-card reveal is-visible" data-delay="${i * 80}">
            ${productVisualHTML(cat.cover).replace('product-visual', 'cat-visual')}
            <div class="cat-card-label"><h4>${cat.name}</h4><span>${cat.count} piece${cat.count === 1 ? '' : 's'}</span></div>
          </a>
        `).join('');
      }
    }
  } catch (err) {
    // Keep the static demo category cards — no visible error to the user
  }

  // ---------- Instagram gallery: recent real product photos ----------
  try {
    const instaGrid = document.querySelector('.insta-grid');
    if (instaGrid) {
      const res = await fetch('/api/products?sort=newest&limit=6');
      const data = await res.json();
      const products = data.products || [];
      if (products.length) {
        instaGrid.innerHTML = products.map((p, i) => `
          <div class="insta-item reveal is-visible" data-delay="${i * 40}">
            ${productVisualHTML(p.images?.[0]).replace('product-visual', 'cat-visual')}
          </div>
        `).join('');
      }
    }
  } catch (err) {
    // Keep the static demo Instagram tiles — no visible error to the user
  }

  // ---------- Featured Finds grid ----------
  try {
    const featuredGrid = document.getElementById('featured-products-grid');
    if (featuredGrid) {
      const res = await fetch('/api/products?featured=true&limit=4');
      const data = await res.json();
      let products = data.products || [];

      // No products flagged as featured yet? Fall back to newest items
      // so this section is never left empty.
      if (!products.length) {
        const fallbackRes = await fetch('/api/products?sort=newest&limit=4');
        const fallbackData = await fallbackRes.json();
        products = fallbackData.products || [];
      }

      if (products.length) {
        featuredGrid.innerHTML = products.map(p =>
          productCardHTML(p, p.isNewArrival ? 'New' : 'Featured', p.isNewArrival ? 'tag--rust' : 'tag--forest')
        ).join('');
        wireCard(featuredGrid, products);
      }
    }
  } catch (err) {
    // Keep the static demo cards — no visible error to the user
  }

  // ---------- New Arrivals / Best Sellers grids ----------
  try {
    const newPanel = document.querySelector('[data-tab-panel="picks"][data-tab="new"]');
    const bestPanel = document.querySelector('[data-tab-panel="picks"][data-tab="best"]');
    if (!newPanel || !bestPanel) return;

    const [newRes, bestRes] = await Promise.all([
      fetch('/api/products?sort=newest&limit=4'),
      fetch('/api/products?bestSeller=true&limit=4'),
    ]);
    const newData = await newRes.json();
    let bestData = await bestRes.json();

    let newProducts = newData.products || [];
    let bestProducts = bestData.products || [];

    // No products flagged as best-seller yet? Show a different set of
    // newest items instead of leaving the tab empty.
    if (!bestProducts.length) {
      const fallbackRes = await fetch('/api/products?sort=newest&limit=8');
      const fallbackData = await fallbackRes.json();
      bestProducts = (fallbackData.products || []).slice(4, 8);
    }

    if (newProducts.length) {
      newPanel.innerHTML = newProducts.map(p => productCardHTML(p, 'New', 'tag--rust')).join('');
      wireCard(newPanel, newProducts);
    }
    if (bestProducts.length) {
      bestPanel.innerHTML = bestProducts.map(p => productCardHTML(p, 'Bestseller', 'tag--forest')).join('');
      wireCard(bestPanel, bestProducts);
    }
  } catch (err) {
    // Keep the static demo cards — no visible error to the user
  }
});
