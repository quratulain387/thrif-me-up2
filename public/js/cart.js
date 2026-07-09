/* ============================================================
   CART PAGE JS — renders the localStorage cart (see cart-utils.js)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const itemsContainer = document.getElementById('cart-items');
  const layout = document.getElementById('cart-layout');
  const summaryBox = document.getElementById('cart-summary');
  const subtotalEl = document.getElementById('summary-subtotal');
  const totalEl = document.getElementById('summary-total');
  const countEl = document.getElementById('cart-item-count');

  const SHIPPING = 250;

  function imageToClass(imagePath) {
    if (!imagePath) return 'ph-cream-plain';
    if ((imagePath.startsWith('/images/uploads/') || imagePath.startsWith('http'))) return null;
    const file = imagePath.split('/').pop().replace(/\.[^.]+$/, '');
    return file.replace(/^placeholder-/, 'ph-');
  }

  function productVisualHTML(imagePath) {
    const cls = imageToClass(imagePath);
    if (cls === null) {
      return `<img src="${imagePath}" style="width:100%;height:100%;object-fit:cover;">`;
    }
    return `<div class="product-visual ${cls}" style="width:100%;height:100%;"></div>`;
  }

  function render() {
    const cart = getCart();

    if (!cart.length) {
      itemsContainer.innerHTML = `
        <div class="cart-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't found your piece yet.</p>
          <a href="/shop.html" class="btn btn-primary">Start Shopping</a>
        </div>
      `;
      summaryBox.style.display = 'none';
      countEl.textContent = '0 items';
      return;
    }

    summaryBox.style.display = 'block';
    countEl.textContent = `${cart.reduce((s, i) => s + i.quantity, 0)} item${cart.length === 1 ? '' : 's'}`;

    itemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${item.productId}">
        <div class="cart-item-media">
          ${productVisualHTML(item.image)}
        </div>
        <div class="cart-item-info">
          <h5>${item.name}</h5>
          <p>Size ${item.size}</p>
          <div class="qty-control">
            <button class="qty-minus" aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button class="qty-plus" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="cart-item-actions">
          <span class="cart-item-price">Rs. ${(item.price * item.quantity).toLocaleString()}</span>
          <button class="remove-btn" aria-label="Remove item">Remove</button>
        </div>
      </div>
    `).join('');

    const subtotal = getCartSubtotal();
    subtotalEl.textContent = `Rs. ${subtotal.toLocaleString()}`;
    totalEl.textContent = `Rs. ${(subtotal + SHIPPING).toLocaleString()}`;

    // Wire up controls
    itemsContainer.querySelectorAll('.cart-item').forEach(row => {
      const id = row.dataset.id;
      const item = cart.find(i => i.productId === id);

      row.querySelector('.qty-plus').addEventListener('click', () => {
        updateCartQuantity(id, item.quantity + 1);
        render();
      });
      row.querySelector('.qty-minus').addEventListener('click', () => {
        if (item.quantity <= 1) return;
        updateCartQuantity(id, item.quantity - 1);
        render();
      });
      row.querySelector('.remove-btn').addEventListener('click', () => {
        removeFromCart(id);
        render();
      });
    });
  }

  render();
});
