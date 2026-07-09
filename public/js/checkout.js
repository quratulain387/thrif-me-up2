/* ============================================================
   CHECKOUT PAGE JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  const summaryItems = document.getElementById('checkout-summary-items');
  const subtotalEl = document.getElementById('co-subtotal');
  const totalEl = document.getElementById('co-total');
  const form = document.getElementById('checkout-form');
  const errorBanner = document.getElementById('checkout-error-banner');
  const placeOrderBtn = document.getElementById('place-order-btn');

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

  // ---- Require login before checkout ----
  let user;
  try {
    const profileRes = await fetch('/api/auth/profile', { credentials: 'include' });
    if (!profileRes.ok) throw new Error();
    const profileData = await profileRes.json();
    user = profileData.user;
  } catch {
    window.location.href = '/login.html?redirect=checkout';
    return;
  }

  // ---- Render cart summary ----
  const cart = getCart();
  if (!cart.length) {
    window.location.href = '/cart.html';
    return;
  }

  summaryItems.innerHTML = cart.map(item => `
    <div class="checkout-item-row">
      <div class="ci-media">${productVisualHTML(item.image)}</div>
      <div class="ci-info">
        <strong>${item.name}</strong>
        <span>Size ${item.size} · Qty ${item.quantity}</span>
      </div>
      <div class="ci-price">Rs. ${(item.price * item.quantity).toLocaleString()}</div>
    </div>
  `).join('');

  const subtotal = getCartSubtotal();
  subtotalEl.textContent = `Rs. ${subtotal.toLocaleString()}`;
  totalEl.textContent = `Rs. ${(subtotal + SHIPPING).toLocaleString()}`;

  // Pre-fill name from account
  document.getElementById('fullName').value = user.name || '';
  document.getElementById('phone').value = user.phone || '';

  // ---- Place order ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBanner.classList.remove('is-visible');

    const shippingAddress = {
      fullName: document.getElementById('fullName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      street: document.getElementById('street').value.trim(),
      city: document.getElementById('city').value.trim(),
      postalCode: document.getElementById('postalCode').value.trim(),
    };

    if (Object.values(shippingAddress).some(v => v === '' && v !== shippingAddress.postalCode)) {
      errorBanner.textContent = 'Please fill in all required shipping fields.';
      errorBanner.classList.add('is-visible');
      return;
    }

    const paymentMethod = form.querySelector('input[name="payment"]:checked')?.value || 'Bank Transfer';

    const items = cart.map(i => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
    }));

    try {
      placeOrderBtn.dataset.loading = 'true';
      placeOrderBtn.textContent = 'Placing order…';

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items, shippingAddress, paymentMethod }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not place order');

      clearCart();
      window.location.href = `/order-success.html?id=${data.order._id}`;

    } catch (err) {
      errorBanner.textContent = err.message;
      errorBanner.classList.add('is-visible');
      placeOrderBtn.dataset.loading = 'false';
      placeOrderBtn.textContent = 'Place Order';
    }
  });
});
