/* ============================================================
   PRODUCT DETAIL PAGE JS
   Fetches a single product from /api/products/:slug and renders
   gallery, meta info, and related products from real data.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const container = document.getElementById('pd-container');
  const relatedGrid = document.getElementById('related-grid');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');

  function imageToClass(imagePath) {
    if (!imagePath) return 'ph-cream-plain';
    if ((imagePath.startsWith('/images/uploads/') || imagePath.startsWith('http'))) return null; // real uploaded photo, not a gradient
    const file = imagePath.split('/').pop().replace(/\.[^.]+$/, '');
    return file.replace(/^placeholder-/, 'ph-');
  }

  // Renders either a real <img> (uploaded product photo) or a CSS gradient placeholder
  function productVisualHTML(imagePath, extraAttrs = '') {
    const cls = imageToClass(imagePath);
    if (cls === null) {
      return `<img src="${imagePath}" class="product-visual" style="object-fit:cover;" ${extraAttrs}>`;
    }
    return `<div class="product-visual ${cls}" ${extraAttrs}></div>`;
  }

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast is-visible';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
  }

  if (!slug) {
    container.innerHTML = `<div class="pd-error"><h3>No product specified</h3><p><a href="/shop.html" class="btn btn-primary" style="margin-top:1rem;display:inline-flex;">Back to Shop</a></p></div>`;
    return;
  }

  try {
    const res = await fetch(`/api/products/${slug}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Product not found');

    const { product: p, related } = data;
    breadcrumbCurrent.textContent = p.name;
    document.title = `${p.name} — Thrif Me Up`;

    const images = p.images.length ? p.images : ['/images/placeholder-cream-plain.jpg'];
    const hasDiscount = p.compareAtPrice && p.compareAtPrice > p.price;
    const discountPct = hasDiscount ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
    const isSoldOut = !p.isActive || p.stock <= 0;

    container.innerHTML = `
      <div class="pd-gallery">
        <div class="pd-gallery-main" id="pd-main-visual">
          ${p.video ? `<video src="${p.video}" autoplay muted loop playsinline controls style="width:100%;height:100%;object-fit:cover;"></video>` : productVisualHTML(images[0])}
        </div>
        <div class="pd-gallery-thumbs">
          ${p.video ? `
            <div class="pd-thumb is-active" data-src="${p.video}" data-type="video" style="position:relative;">
              ${productVisualHTML(images[0])}
              <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(61,43,34,0.35);color:#fff;font-size:1.1rem;">▶</span>
            </div>
          ` : ''}
          ${images.map((img, i) => `
            <div class="pd-thumb ${!p.video && i === 0 ? 'is-active' : ''}" data-src="${img}" data-type="image">
              ${productVisualHTML(img)}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="pd-info">
        <p class="eyebrow">${p.category?.name || ''}</p>
        <h1>${p.name}</h1>

        ${isSoldOut ? '<div class="pd-sold-banner">This one-of-one piece has already been sold.</div>' : ''}

        <div class="pd-price-row">
          <span class="now">Rs. ${p.price.toLocaleString()}</span>
          ${hasDiscount ? `<span class="was">Rs. ${p.compareAtPrice.toLocaleString()}</span><span class="save-badge">Save ${discountPct}%</span>` : ''}
        </div>

        <div class="pd-meta-grid">
          <div class="pd-meta-item"><span>Size</span><strong>${p.size}</strong></div>
          <div class="pd-meta-item"><span>Condition</span><strong>${p.condition}</strong></div>
        </div>

        <p class="pd-description">${p.description}</p>

        <div class="pd-actions">
          <button class="btn btn-primary" id="pd-add-cart" ${isSoldOut ? 'disabled' : ''}>
            ${isSoldOut ? 'Sold Out' : 'Add to Cart'}
          </button>
          <button class="pd-wishlist-btn ${isWishlisted(p._id) ? 'is-active' : ''}" id="pd-wishlist" aria-label="Add to wishlist" aria-pressed="${isWishlisted(p._id)}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
          </button>
        </div>

        <div class="pd-trust-row">
          <div class="pd-trust-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
            Quality-checked before it ships
          </div>
          <div class="pd-trust-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Nationwide delivery, flat Rs. 250
          </div>
          <div class="pd-trust-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            One-of-one — once it's sold, it's gone
          </div>
        </div>
      </div>
    `;

    // ---- Gallery thumbnail switching ----
    document.querySelectorAll('.pd-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        document.querySelectorAll('.pd-thumb').forEach(t => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
        const mainVisual = document.getElementById('pd-main-visual');
        if (thumb.dataset.type === 'video') {
          mainVisual.innerHTML = `<video src="${thumb.dataset.src}" autoplay muted loop playsinline controls style="width:100%;height:100%;object-fit:cover;"></video>`;
        } else {
          mainVisual.innerHTML = productVisualHTML(thumb.dataset.src);
        }
      });
    });

    // ---- Add to cart ----
    document.getElementById('pd-add-cart')?.addEventListener('click', () => {
      addToCart({
        productId: p._id,
        name: p.name,
        price: p.price,
        image: images[0],
        size: p.size,
        stock: p.stock,
      });
      showToast(`${p.name} added to cart`);
    });

    // ---- Wishlist toggle ----
    document.getElementById('pd-wishlist')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const active = toggleWishlist({
        productId: p._id,
        name: p.name,
        price: p.price,
        image: images[0],
        size: p.size,
      });
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
      showToast(active ? 'Added to wishlist' : 'Removed from wishlist');
    });

    // ---- Related products ----
    if (related?.length) {
      relatedGrid.innerHTML = related.map(rp => `
        <article class="product-card">
          <a href="/product.html?slug=${rp.slug}" style="display:block;">
            <div class="product-media">
              ${productVisualHTML(rp.images[0])}
            </div>
            <div class="product-info">
              <p class="p-category">Size ${rp.size}</p>
              <h5>${rp.name}</h5>
              <div class="p-price"><span class="now">Rs. ${rp.price.toLocaleString()}</span></div>
            </div>
          </a>
        </article>
      `).join('');
    } else {
      document.getElementById('pd-related-section').style.display = 'none';
    }

  } catch (err) {
    container.innerHTML = `
      <div class="pd-error">
        <h3>${err.message}</h3>
        <p style="margin-top:1rem;"><a href="/shop.html" class="btn btn-primary" style="display:inline-flex;">Back to Shop</a></p>
      </div>
    `;
  }
});
