/* ============================================================
   WISHLIST UTILITIES — shared localStorage-based wishlist.
   ============================================================ */

const WISHLIST_KEY = 'thriftmeup_wishlist';

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

function isWishlisted(productId) {
  return getWishlist().some(i => i.productId === productId);
}

// Returns true if the item is now wishlisted, false if it was removed
function toggleWishlist(item) {
  const list = getWishlist();
  const idx = list.findIndex(i => i.productId === item.productId);

  if (idx > -1) {
    list.splice(idx, 1);
    saveWishlist(list);
    return false;
  } else {
    list.push(item);
    saveWishlist(list);
    return true;
  }
}

function removeFromWishlist(productId) {
  saveWishlist(getWishlist().filter(i => i.productId !== productId));
}
