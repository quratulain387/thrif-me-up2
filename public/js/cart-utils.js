/* ============================================================
   CART UTILITIES — shared localStorage-based cart.
   Used by shop.js, product.js, cart.html, and checkout.html so
   the cart state stays consistent across pages without a login
   being required just to add something to the bag.
   ============================================================ */

const CART_KEY = 'thriftmeup_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

// Adds an item; since most thrift pieces are one-of-one (stock: 1),
// adding the same product again just confirms it's already in the cart
// rather than incrementing quantity past what's actually available.
function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(i => i.productId === item.productId);

  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, item.stock || 1);
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  saveCart(cart);
  return cart;
}

function removeFromCart(productId) {
  const cart = getCart().filter(i => i.productId !== productId);
  saveCart(cart);
  return cart;
}

function updateCartQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  if (item) {
    item.quantity = Math.max(1, Math.min(quantity, item.stock || 1));
  }
  saveCart(cart);
  return cart;
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

function getCartSubtotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

// Keeps the little number badge on the cart nav icon in sync,
// on every page that includes this script.
function updateCartBadge() {
  const badge = document.querySelector('.nav-badge');
  const count = getCartCount();
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
