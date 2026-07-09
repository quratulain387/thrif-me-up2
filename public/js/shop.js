/* ============================================================
   SHOP PAGE JS — talks to the real backend at /api/products
   and /api/categories. No hardcoded product data here.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const grid = document.getElementById('product-grid');
  const categoryList = document.getElementById('category-filter-list');
  const sizeList = document.getElementById('size-filter-list');
  const searchInput = document.getElementById('shop-search-input');
  const sortSelect = document.getElementById('shop-sort-select');
  const resultCount = document.getElementById('result-count');
  const pagination = document.getElementById('pagination');
  const applyPriceBtn = document.getElementById('apply-price');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const filtersPanel = document.getElementById('filters-panel');
  const mobileFilterToggle = document.getElementById('mobile-filter-toggle');

  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

  // Read initial category/search from URL, e.g. /shop.html?category=<id>
  const urlParams = new URLSearchParams(window.location.search);

  let state = {
    category: urlParams.get('category') || '',
    size: '',
    minPrice: '',
    maxPrice: '',
    search: urlParams.get('search') || '',
    sort: 'newest',
    page: 1,
  };
  let categories = [];

  // ---------- Maps a product's image path to a placeholder CSS class ----------
  // e.g. "/images/placeholder-rust-knit.jpg" -> "ph-rust-knit"
  // Swap this out once real product photography is uploaded.
  function imageToClass(imagePath) {
    if (!imagePath) return 'ph-cream-plain';
    if ((imagePath.startsWith('/images/uploads/') || imagePath.startsWith('http'))) return null; // real uploaded photo, not a gradient
    const file = imagePath.split('/').pop().replace(/\.[^.]+$/, '');
    return file.replace(/^placeholder-/, 'ph-');
  }

  // Renders either a real <img> (uploaded product photo) or a CSS gradient placeholder
  function productVisualHTML(imagePath, extraClass = '') {
    const cls = imageToClass(imagePath);
    if (cls === null) {
      return `<img src="${imagePath}" class="product-visual ${extraClass}" style="object-fit:cover;">`;
    }
    return `<div class="product-visual ${cls} ${extraClass}"></div>`;
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

  // ---------- Load categories into the sidebar ----------
  async function loadCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      categories = data.categories || [];

      categoryList.innerHTML = `
        <label class="filter-option">
          <input type="radio" name="category" value="" ${state.category ? '' : 'checked'}>
          All Categories
        </label>
      ` + categories.map(cat => `
        <label class="filter-option">
          <input type="radio" name="category" value="${cat._id}" ${state.category === cat._id ? 'checked' : ''}>
          ${cat.name}
        </label>
      `).join('');

      categoryList.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', () => {
          state.category = input.value;
          state.page = 1;
          fetchProducts();
        });
      });
    } catch (err) {
      categoryList.innerHTML = '<p style="color: var(--error); font-size: 0.85rem;">Could not load categories.</p>';
    }
  }

  function renderSizes() {
    sizeList.innerHTML = `
      <label class="filter-option">
        <input type="radio" name="size" value="" checked>
        Any Size
      </label>
    ` + SIZES.map(s => `
      <label class="filter-option">
        <input type="radio" name="size" value="${s}">
        ${s}
      </label>
    `).join('');

    sizeList.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        state.size = input.value;
        state.page = 1;
        fetchProducts();
      });
    });
  }

  // ---------- Render skeleton loaders (prevents layout shift) ----------
  function renderSkeletons() {
    grid.innerHTML = Array.from({ length: 8 }).map(() => `
      <div class="product-card">
        <div class="product-media skeleton skeleton-card"></div>
        <div class="product-info">
          <div class="skeleton" style="height:12px;width:60%;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:16px;width:85%;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:14px;width:40%;"></div>
        </div>
      </div>
    `).join('');
  }

  function renderEmpty() {
    grid.innerHTML = `
      <div class="shop-empty">
        <h4>No pieces match those filters</h4>
        <p>Try widening your search, or check back soon — new finds drop every week.</p>
        <button class="btn btn-primary" id="empty-clear-btn">Clear Filters</button>
      </div>
    `;
    document.getElementById('empty-clear-btn')?.addEventListener('click', clearFilters);
  }

  function renderError() {
    grid.innerHTML = `
      <div class="shop-empty">
        <h4>Couldn't load products</h4>
        <p>Check your connection and try again.</p>
        <button class="btn btn-primary" onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  function renderProducts(products) {
    if (!products.length) return renderEmpty();

    grid.innerHTML = products.map(p => {
      const hasDiscount = p.compareAtPrice && p.compareAtPrice > p.price;
      return `
        <article class="product-card reveal is-visible">
          <a href="/product.html?slug=${p.slug}" style="display:block;">
            <div class="product-media">
              ${p.isNewArrival ? '<span class="tag tag--rust">New</span>' : ''}
              ${p.isBestSeller ? '<span class="tag tag--forest">Bestseller</span>' : ''}
              <button class="wishlist-btn ${isWishlisted(p._id) ? 'is-active' : ''}" aria-label="Add to wishlist" aria-pressed="${isWishlisted(p._id)}" data-id="${p._id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.images[0]}" data-size="${p.size}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
              </button>
              ${productVisualHTML(p.images[0])}
              <span class="quick-add" data-id="${p._id}" data-name="${p.name}">Quick Add</span>
            </div>
            <div class="product-info">
              <p class="p-category">${p.category?.name || ''} · Size ${p.size}</p>
              <h5>${p.name}</h5>
              <div class="p-price">
                <span class="now">Rs. ${p.price.toLocaleString()}</span>
                ${hasDiscount ? `<span class="was">Rs. ${p.compareAtPrice.toLocaleString()}</span>` : ''}
              </div>
            </div>
          </a>
        </article>
      `;
    }).join('');

    grid.querySelectorAll('.wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const active = toggleWishlist({
          productId: btn.dataset.id,
          name: btn.dataset.name,
          price: Number(btn.dataset.price),
          image: btn.dataset.image,
          size: btn.dataset.size,
        });
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
        showToast(active ? 'Added to wishlist' : 'Removed from wishlist');
      });
    });
    grid.querySelectorAll('.quick-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = btn.closest('.product-card');
        const product = products.find(p => p._id === btn.dataset.id);
        if (product) {
          addToCart({
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.images[0],
            size: product.size,
            stock: product.stock,
          });
        }
        showToast(`${btn.dataset.name} added to cart`);
      });
    });
  }

  function renderPagination(page, pages) {
    if (pages <= 1) { pagination.innerHTML = ''; return; }

    let html = `<button class="page-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>‹</button>`;
    for (let i = 1; i <= pages; i++) {
      html += `<button class="page-btn ${i === page ? 'is-active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button class="page-btn" data-page="${page + 1}" ${page === pages ? 'disabled' : ''}>›</button>`;
    pagination.innerHTML = html;

    pagination.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.page = Number(btn.dataset.page);
        fetchProducts();
        window.scrollTo({ top: grid.offsetTop - 100, behavior: 'smooth' });
      });
    });
  }

  // ---------- Main fetch ----------
  async function fetchProducts() {
    renderSkeletons();

    const params = new URLSearchParams();
    if (state.category) params.set('category', state.category);
    if (state.size) params.set('size', state.size);
    if (state.minPrice) params.set('minPrice', state.minPrice);
    if (state.maxPrice) params.set('maxPrice', state.maxPrice);
    if (state.search) params.set('search', state.search);
    if (state.sort) params.set('sort', state.sort);
    params.set('page', state.page);

    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();

      resultCount.textContent = `${data.total} piece${data.total === 1 ? '' : 's'} found`;
      renderProducts(data.products);
      renderPagination(data.page, data.pages);
    } catch (err) {
      renderError();
      resultCount.textContent = '';
    }
  }

  function clearFilters() {
    state = { category: '', size: '', minPrice: '', maxPrice: '', search: '', sort: 'newest', page: 1 };
    searchInput.value = '';
    sortSelect.value = 'newest';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    const allCat = categoryList.querySelector('input[value=""]');
    if (allCat) allCat.checked = true;
    const anySize = sizeList.querySelector('input[value=""]');
    if (anySize) anySize.checked = true;
    fetchProducts();
  }

  // ---------- Search (debounced) ----------
  let searchTimer;
  searchInput.value = state.search;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchInput.value.trim();
      state.page = 1;
      fetchProducts();
    }, 400);
  });

  // ---------- Sort ----------
  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    state.page = 1;
    fetchProducts();
  });

  // ---------- Price filter ----------
  applyPriceBtn.addEventListener('click', () => {
    state.minPrice = document.getElementById('min-price').value;
    state.maxPrice = document.getElementById('max-price').value;
    state.page = 1;
    fetchProducts();
  });

  clearFiltersBtn.addEventListener('click', clearFilters);

  // ---------- Mobile filter toggle ----------
  mobileFilterToggle?.addEventListener('click', () => {
    filtersPanel.classList.toggle('is-collapsed');
  });

  // ---------- Init ----------
  renderSizes();
  loadCategories();
  fetchProducts();
});
