/* ============================================================
   WISHLIST PAGE JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('wishlist-grid');

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

  function render() {
    const list = getWishlist();

    if (!list.length) {
      grid.innerHTML = `
        <div class="shop-empty" style="grid-column:1/-1;">
          <h4>Your wishlist is empty</h4>
          <p>Tap the heart icon on any product to save it here.</p>
          <a href="/shop.html" class="btn btn-primary">Browse the Shop</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(item => `
      <article class="product-card">
        <div class="product-media">
          <button class="wishlist-btn is-active" aria-label="Remove from wishlist" data-id="${item.productId}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
          </button>
          ${productVisualHTML(item.image)}
          <span class="quick-add" data-id="${item.productId}">Add to Cart</span>
        </div>
        <div class="product-info">
          <p class="p-category">Size ${item.size}</p>
          <h5>${item.name}</h5>
          <div class="p-price"><span class="now">Rs. ${item.price.toLocaleString()}</span></div>
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('.wishlist-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFromWishlist(btn.dataset.id);
        showToast('Removed from wishlist');
        render();
      });
    });

    grid.querySelectorAll('.quick-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = list.find(i => i.productId === btn.dataset.id);
        if (item) {
          addToCart({ productId: item.productId, name: item.name, price: item.price, image: item.image, size: item.size, stock: 1 });
          showToast(`${item.name} added to cart`);
        }
      });
    });
  }

  render();
});
