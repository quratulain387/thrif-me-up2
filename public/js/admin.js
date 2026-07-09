/* ============================================================
   ADMIN PANEL — main logic.
   Single-page style: hash-based routing swaps content inside
   #admin-content without full page reloads.
   ============================================================ */

const content = document.getElementById('admin-content');
const navLinks = document.querySelectorAll('.admin-nav a');
let categoriesCache = [];

function showToast(message, isError = false) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast is-visible${isError ? ' toast-error' : ''}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

function money(n) { return `Rs. ${Number(n || 0).toLocaleString()}`; }

function statusClass(status) { return status.toLowerCase(); }

/* ============================================================
   AUTH GUARD
   ============================================================ */
async function requireAdmin() {
  try {
    const res = await fetch('/api/auth/profile', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok || data.user.role !== 'admin') throw new Error();
    return data.user;
  } catch {
    window.location.href = '/login.html';
    return null;
  }
}

/* ============================================================
   ROUTER
   ============================================================ */
const routes = {
  dashboard: renderDashboard,
  products: renderProducts,
  categories: renderCategories,
  orders: renderOrders,
  customers: renderCustomers,
  messages: renderMessages,
  subscribers: renderSubscribers,
  testimonials: renderTestimonials,
};

function router() {
  const hash = (window.location.hash || '#dashboard').replace('#', '');
  const section = routes[hash] ? hash : 'dashboard';

  navLinks.forEach(link => {
    link.classList.toggle('is-active', link.dataset.section === section);
  });

  content.innerHTML = `<div class="admin-empty-state">Loading…</div>`;
  routes[section]();

  document.getElementById('admin-sidebar')?.classList.remove('is-open');
}

window.addEventListener('hashchange', router);

/* ============================================================
   DASHBOARD
   ============================================================ */
async function renderDashboard() {
  try {
    const res = await fetch('/api/admin/stats', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const s = data.stats;
    content.innerHTML = `
      <div class="admin-topbar">
        <div><h1>Dashboard</h1><p>Overview of your store</p></div>
      </div>
      <div class="admin-stats-grid">
        <div class="admin-stat-card"><span>Total Products</span><strong>${s.totalProducts}</strong></div>
        <div class="admin-stat-card"><span>Active Listings</span><strong>${s.activeProducts}</strong></div>
        <div class="admin-stat-card"><span>Total Orders</span><strong>${s.totalOrders}</strong></div>
        <div class="admin-stat-card accent"><span>Total Revenue</span><strong>${money(s.totalRevenue)}</strong></div>
        <div class="admin-stat-card"><span>Customers</span><strong>${s.totalCustomers}</strong></div>
        <div class="admin-stat-card"><span>Sold Out Items</span><strong>${s.soldOutProducts}</strong></div>
        <div class="admin-stat-card"><span>Unread Messages</span><strong>${s.unreadMessages}</strong></div>
      </div>

      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Recent Orders</h3><a href="#orders" class="btn-ghost">View all →</a></div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              ${data.recentOrders.length ? data.recentOrders.map(o => `
                <tr>
                  <td>#${o._id.slice(-6).toUpperCase()}</td>
                  <td>${o.user?.name || 'Unknown'}</td>
                  <td>${money(o.totalPrice)}</td>
                  <td><span class="status-badge ${statusClass(o.status)}">${o.status}</span></td>
                  <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              `).join('') : `<tr><td colspan="5" class="admin-empty-state">No orders yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="admin-empty-state">Couldn't load dashboard. ${err.message || ''}</div>`;
  }
}

/* ============================================================
   PRODUCTS
   ============================================================ */
function imageToClass(imagePath) {
  if (!imagePath) return 'ph-cream-plain';
  if ((imagePath.startsWith('/images/uploads/') || imagePath.startsWith('http'))) return null; // real uploaded image
  const file = imagePath.split('/').pop().replace(/\.[^.]+$/, '');
  return file.replace(/^placeholder-/, 'ph-');
}

function productThumb(imagePath) {
  const cls = imageToClass(imagePath);
  if (cls === null) {
    return `<img src="${imagePath}" style="width:100%;height:100%;object-fit:cover;">`;
  }
  return `<div class="product-visual ${cls}" style="width:100%;height:100%;"></div>`;
}

async function loadCategoriesCache() {
  const res = await fetch('/api/categories');
  const data = await res.json();
  categoriesCache = data.categories || [];
}

async function renderProducts() {
  content.innerHTML = `<div class="admin-empty-state">Loading products…</div>`;
  if (!categoriesCache.length) await loadCategoriesCache();

  try {
    const res = await fetch('/api/products?limit=48');
    const data = await res.json();

    content.innerHTML = `
      <div class="admin-topbar">
        <div><h1>Products</h1><p>${data.total} total listings</p></div>
        <button class="btn btn-primary" id="add-product-btn">+ Add Product</button>
      </div>
      <div class="admin-panel">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Size</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${data.products.map(p => `
                <tr>
                  <td><div class="admin-table-thumb">${productThumb(p.images[0])}</div></td>
                  <td>${p.name}</td>
                  <td>${p.category?.name || '—'}</td>
                  <td>${money(p.price)}</td>
                  <td>${p.size}</td>
                  <td><span class="status-badge ${p.isActive ? 'active' : 'inactive'}">${p.isActive ? 'Active' : 'Sold Out'}</span></td>
                  <td>
                    <button class="icon-btn edit-product-btn" data-id="${p._id}" aria-label="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button class="icon-btn danger delete-product-btn" data-id="${p._id}" aria-label="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>
                  </td>
                </tr>
              `).join('') || `<tr><td colspan="7" class="admin-empty-state">No products yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('add-product-btn').addEventListener('click', () => openProductModal());
    document.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const product = data.products.find(p => p._id === btn.dataset.id);
        openProductModal(product);
      });
    });
    document.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this product? It will be marked as sold out / inactive.')) return;
        const res = await fetch(`/api/products/${btn.dataset.id}`, { method: 'DELETE', credentials: 'include' });
        const d = await res.json();
        if (res.ok) { showToast('Product removed'); renderProducts(); }
        else showToast(d.message, true);
      });
    });

  } catch (err) {
    content.innerHTML = `<div class="admin-empty-state">Couldn't load products.</div>`;
  }
}

function openProductModal(product = null) {
  const isEdit = !!product;
  let uploadedImages = product ? [...product.images] : [];
  let uploadedVideo = product?.video || '';

  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay is-open';
  overlay.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-head">
        <h3>${isEdit ? 'Edit Product' : 'Add New Product'}</h3>
        <button class="icon-btn" id="close-modal-btn">✕</button>
      </div>
      <form id="product-form">
        <div class="admin-form-grid">
          <div class="field"><label>Product Name</label><input id="pf-name" type="text" required value="${product?.name || ''}"></div>
          <div class="field"><label>Description</label><textarea id="pf-desc" rows="3" required>${product?.description || ''}</textarea></div>
          <div class="admin-form-grid two-col">
            <div class="field"><label>Category</label>
              <select id="pf-category" required>
                ${categoriesCache.map(c => `<option value="${c._id}" ${product?.category?._id === c._id || product?.category === c._id ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="field"><label>Size</label>
              <select id="pf-size" required>
                ${['XS','S','M','L','XL','XXL','One Size','Free Size'].map(s => `<option ${product?.size === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="admin-form-grid two-col">
            <div class="field"><label>Price (Rs.)</label><input id="pf-price" type="number" min="0" required value="${product?.price || ''}"></div>
            <div class="field"><label>Compare-at Price (optional)</label><input id="pf-compare" type="number" min="0" value="${product?.compareAtPrice || ''}"></div>
          </div>
          <div class="admin-form-grid two-col">
            <div class="field"><label>Condition</label>
              <select id="pf-condition" required>
                ${['New with tags','Excellent','Very Good','Good','Fair'].map(c => `<option ${product?.condition === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div class="field"><label>Stock</label><input id="pf-stock" type="number" min="0" value="${product?.stock ?? 1}"></div>
          </div>
          <div class="field">
            <label>Product Photos</label>
            <div class="image-upload-zone" id="upload-zone">Click to upload photos (JPG, PNG, WEBP — max 5MB each)</div>
            <input type="file" id="pf-images" accept="image/jpeg,image/png,image/webp" multiple style="display:none;">
            <div class="image-preview-row" id="image-preview-row"></div>
          </div>
          <div class="field">
            <label>Product Video (optional — shown on homepage &amp; product page, like a Reel)</label>
            <div class="image-upload-zone" id="video-upload-zone">Click to upload a short video (MP4/WEBM/MOV — max 30MB)</div>
            <input type="file" id="pf-video" accept="video/mp4,video/webm,video/quicktime" style="display:none;">
            <div id="video-preview-row" style="margin-top:var(--sp-3);"></div>
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:var(--sp-6);" id="pf-submit-btn">
          ${isEdit ? 'Save Changes' : 'Add Product'}
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeModal = () => overlay.remove();
  overlay.querySelector('#close-modal-btn').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  function renderPreviews() {
    const row = overlay.querySelector('#image-preview-row');
    row.innerHTML = uploadedImages.map((img, i) => `
      <div class="image-preview-item">
        <img src="${img}" onerror="this.style.display='none'">
        <button type="button" data-i="${i}" class="remove-img-btn">✕</button>
      </div>
    `).join('');
    row.querySelectorAll('.remove-img-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        uploadedImages.splice(Number(btn.dataset.i), 1);
        renderPreviews();
      });
    });
  }
  renderPreviews();

  function renderVideoPreview() {
    const row = overlay.querySelector('#video-preview-row');
    if (!uploadedVideo) { row.innerHTML = ''; return; }
    row.innerHTML = `
      <div style="position:relative;display:inline-block;">
        <video src="${uploadedVideo}" style="width:120px;height:150px;object-fit:cover;border-radius:4px;" muted></video>
        <button type="button" id="remove-video-btn" style="position:absolute;top:2px;right:2px;width:20px;height:20px;background:rgba(0,0,0,0.6);color:#fff;border-radius:50%;font-size:0.7rem;">✕</button>
      </div>
    `;
    row.querySelector('#remove-video-btn').addEventListener('click', () => {
      uploadedVideo = '';
      renderVideoPreview();
    });
  }
  renderVideoPreview();

  const videoUploadZone = overlay.querySelector('#video-upload-zone');
  const videoInput = overlay.querySelector('#pf-video');
  videoUploadZone.addEventListener('click', () => videoInput.click());

  videoInput.addEventListener('change', async () => {
    if (!videoInput.files.length) return;
    const submitBtnEl2 = overlay.querySelector('#pf-submit-btn');
    videoUploadZone.textContent = 'Uploading video… this can take a moment';
    submitBtnEl2.disabled = true;
    const formData2 = new FormData();
    formData2.append('video', videoInput.files[0]);

    try {
      const res = await fetch('/api/upload/video', { method: 'POST', credentials: 'include', body: formData2 });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Video upload failed');
      uploadedVideo = data.path;
      renderVideoPreview();
      showToast('Video uploaded');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      videoUploadZone.textContent = 'Click to upload a short video (MP4/WEBM/MOV — max 30MB)';
      videoInput.value = '';
      submitBtnEl2.disabled = false;
    }
  });

  const uploadZone = overlay.querySelector('#upload-zone');
  const fileInput = overlay.querySelector('#pf-images');
  uploadZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    if (!fileInput.files.length) return;
    uploadZone.textContent = 'Uploading…';
    const submitBtnEl = overlay.querySelector('#pf-submit-btn');
    submitBtnEl.disabled = true; // block saving until this upload finishes
    const formData = new FormData();
    Array.from(fileInput.files).forEach(f => formData.append('images', f));

    try {
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      uploadedImages.push(...data.paths);
      renderPreviews();
      showToast('Photos uploaded');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      uploadZone.textContent = 'Click to upload photos (JPG, PNG, WEBP — max 5MB each)';
      fileInput.value = '';
      submitBtnEl.disabled = false;
    }
  });

  overlay.querySelector('#product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!uploadedImages.length) { showToast('Please upload at least one photo', true); return; }

    const payload = {
      name: overlay.querySelector('#pf-name').value.trim(),
      description: overlay.querySelector('#pf-desc').value.trim(),
      category: overlay.querySelector('#pf-category').value,
      size: overlay.querySelector('#pf-size').value,
      price: Number(overlay.querySelector('#pf-price').value),
      compareAtPrice: overlay.querySelector('#pf-compare').value ? Number(overlay.querySelector('#pf-compare').value) : undefined,
      condition: overlay.querySelector('#pf-condition').value,
      stock: Number(overlay.querySelector('#pf-stock').value) || 1,
      images: uploadedImages,
      video: uploadedVideo || '',
      isActive: true,
    };

    const submitBtn = overlay.querySelector('#pf-submit-btn');
    submitBtn.textContent = 'Saving…';

    try {
      const url = isEdit ? `/api/products/${product._id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not save product');

      showToast(isEdit ? 'Product updated' : 'Product added');
      closeModal();
      renderProducts();
    } catch (err) {
      showToast(err.message, true);
      submitBtn.textContent = isEdit ? 'Save Changes' : 'Add Product';
    }
  });
}

/* ============================================================
   CATEGORIES
   ============================================================ */
async function renderCategories() {
  await loadCategoriesCache();
  content.innerHTML = `
    <div class="admin-topbar"><div><h1>Categories</h1><p>${categoriesCache.length} categories</p></div></div>

    <div class="admin-panel">
      <div class="admin-panel-head"><h3>Add New Category</h3></div>
      <form id="cat-form" class="admin-form-grid two-col">
        <div class="field"><label>Name</label><input id="cat-name" type="text" required></div>
        <div class="field"><label>Description (optional)</label><input id="cat-desc" type="text"></div>
        <button type="submit" class="btn btn-primary" style="grid-column:1/-1;">Add Category</button>
      </form>
    </div>

    <div class="admin-panel">
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Description</th><th></th></tr></thead>
          <tbody>
            ${categoriesCache.map(c => `
              <tr>
                <td>${c.name}</td>
                <td>${c.description || '—'}</td>
                <td><button class="icon-btn danger delete-cat-btn" data-id="${c._id}" aria-label="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button></td>
              </tr>
            `).join('') || `<tr><td colspan="3" class="admin-empty-state">No categories yet</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('cat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cat-name').value.trim();
    const description = document.getElementById('cat-desc').value.trim();
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('Category added');
      renderCategories();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  document.querySelectorAll('.delete-cat-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this category? Products in it will remain but lose their category link.')) return;
      const res = await fetch(`/api/categories/${btn.dataset.id}`, { method: 'DELETE', credentials: 'include' });
      const d = await res.json();
      if (res.ok) { showToast('Category deleted'); renderCategories(); }
      else showToast(d.message, true);
    });
  });
}

/* ============================================================
   ORDERS
   ============================================================ */
async function renderOrders() {
  try {
    const res = await fetch('/api/orders', { credentials: 'include' });
    const data = await res.json();

    content.innerHTML = `
      <div class="admin-topbar"><div><h1>Orders</h1><p>${data.count} total orders</p></div></div>
      <div class="admin-panel">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              ${data.orders.map(o => `
                <tr>
                  <td>#${o._id.slice(-6).toUpperCase()}</td>
                  <td>${o.user?.name || 'Unknown'}<br><span style="color:var(--text-muted-on-light);font-size:0.8rem;">${o.user?.email || ''}</span></td>
                  <td>${o.items.length} item${o.items.length === 1 ? '' : 's'}</td>
                  <td>${money(o.totalPrice)}</td>
                  <td>${o.paymentMethod}</td>
                  <td>
                    <select class="status-select order-status-select" data-id="${o._id}">
                      ${['Pending','Confirmed','Shipped','Delivered','Cancelled'].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                  </td>
                  <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              `).join('') || `<tr><td colspan="7" class="admin-empty-state">No orders yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.querySelectorAll('.order-status-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const res = await fetch(`/api/orders/${sel.dataset.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: sel.value }),
        });
        if (res.ok) showToast('Order status updated');
        else showToast('Could not update status', true);
      });
    });
  } catch {
    content.innerHTML = `<div class="admin-empty-state">Couldn't load orders.</div>`;
  }
}

/* ============================================================
   CUSTOMERS
   ============================================================ */
async function renderCustomers() {
  try {
    const res = await fetch('/api/auth/users', { credentials: 'include' });
    const data = await res.json();

    content.innerHTML = `
      <div class="admin-topbar"><div><h1>Customers</h1><p>${data.count} registered</p></div></div>
      <div class="admin-panel">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${data.users.map(u => `
                <tr>
                  <td>${u.name}</td>
                  <td>${u.email}</td>
                  <td>${u.phone || '—'}</td>
                  <td>${new Date(u.createdAt).toLocaleDateString()}</td>
                  <td><span class="status-badge ${u.isActive ? 'active' : 'inactive'}">${u.isActive ? 'Active' : 'Deactivated'}</span></td>
                  <td><button class="btn-ghost toggle-user-btn" data-id="${u._id}">${u.isActive ? 'Deactivate' : 'Reactivate'}</button></td>
                </tr>
              `).join('') || `<tr><td colspan="6" class="admin-empty-state">No customers yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.querySelectorAll('.toggle-user-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const res = await fetch(`/api/auth/users/${btn.dataset.id}/toggle-active`, { method: 'PUT', credentials: 'include' });
        if (res.ok) { showToast('Customer status updated'); renderCustomers(); }
        else showToast('Could not update', true);
      });
    });
  } catch {
    content.innerHTML = `<div class="admin-empty-state">Couldn't load customers.</div>`;
  }
}

/* ============================================================
   MESSAGES
   ============================================================ */
async function renderMessages() {
  try {
    const res = await fetch('/api/contact', { credentials: 'include' });
    const data = await res.json();

    content.innerHTML = `
      <div class="admin-topbar"><div><h1>Contact Messages</h1><p>${data.count} total</p></div></div>
      <div class="admin-panel">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Message</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              ${data.messages.map(m => `
                <tr>
                  <td>${m.name}</td>
                  <td>${m.email}</td>
                  <td style="max-width:280px;">${m.message}</td>
                  <td>${new Date(m.createdAt).toLocaleDateString()}</td>
                  <td>
                    ${m.isRead
                      ? `<span class="status-badge active">Read</span>`
                      : `<button class="btn-ghost mark-read-btn" data-id="${m._id}">Mark as read</button>`}
                  </td>
                </tr>
              `).join('') || `<tr><td colspan="5" class="admin-empty-state">No messages yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.querySelectorAll('.mark-read-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const res = await fetch(`/api/contact/${btn.dataset.id}/read`, { method: 'PUT', credentials: 'include' });
        if (res.ok) renderMessages();
      });
    });
  } catch {
    content.innerHTML = `<div class="admin-empty-state">Couldn't load messages.</div>`;
  }
}

/* ============================================================
   NEWSLETTER SUBSCRIBERS
   ============================================================ */
async function renderSubscribers() {
  try {
    const res = await fetch('/api/newsletter', { credentials: 'include' });
    const data = await res.json();

    content.innerHTML = `
      <div class="admin-topbar"><div><h1>Newsletter Subscribers</h1><p>${data.count} subscribed</p></div></div>
      <div class="admin-panel">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Email</th><th>Subscribed On</th></tr></thead>
            <tbody>
              ${data.subscribers.map(s => `
                <tr><td>${s.email}</td><td>${new Date(s.createdAt).toLocaleDateString()}</td></tr>
              `).join('') || `<tr><td colspan="2" class="admin-empty-state">No subscribers yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch {
    content.innerHTML = `<div class="admin-empty-state">Couldn't load subscribers.</div>`;
  }
}

/* ============================================================
   TESTIMONIALS
   ============================================================ */
async function renderTestimonials() {
  try {
    const res = await fetch('/api/testimonials/all', { credentials: 'include' });
    const data = await res.json();

    content.innerHTML = `
      <div class="admin-topbar"><div><h1>Testimonials</h1><p>${data.testimonials.length} total</p></div></div>

      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Add Testimonial</h3></div>
        <form id="testi-form" class="admin-form-grid two-col">
          <div class="field"><label>Customer Name</label><input id="t-name" type="text" required></div>
          <div class="field"><label>City</label><input id="t-city" type="text"></div>
          <div class="field"><label>Rating (1-5)</label><input id="t-rating" type="number" min="1" max="5" value="5" required></div>
          <div class="field"><label>Approve immediately?</label>
            <select id="t-approved"><option value="true">Yes, show on site</option><option value="false">No, keep pending</option></select>
          </div>
          <div class="field" style="grid-column:1/-1;"><label>Message</label><textarea id="t-message" rows="3" required></textarea></div>
          <button type="submit" class="btn btn-primary" style="grid-column:1/-1;">Add Testimonial</button>
        </form>
      </div>

      <div class="admin-panel">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Name</th><th>Rating</th><th>Message</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${data.testimonials.map(t => `
                <tr>
                  <td>${t.name}${t.city ? `<br><span style="color:var(--text-muted-on-light);font-size:0.8rem;">${t.city}</span>` : ''}</td>
                  <td>${'★'.repeat(t.rating)}</td>
                  <td style="max-width:280px;">${t.message}</td>
                  <td><span class="status-badge ${t.isApproved ? 'active' : 'pending'}">${t.isApproved ? 'Approved' : 'Pending'}</span></td>
                  <td>
                    <button class="btn-ghost approve-testi-btn" data-id="${t._id}" data-approved="${!t.isApproved}">${t.isApproved ? 'Unapprove' : 'Approve'}</button>
                    <button class="icon-btn danger delete-testi-btn" data-id="${t._id}" aria-label="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>
                  </td>
                </tr>
              `).join('') || `<tr><td colspan="5" class="admin-empty-state">No testimonials yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('testi-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('t-name').value.trim(),
        city: document.getElementById('t-city').value.trim(),
        rating: Number(document.getElementById('t-rating').value),
        message: document.getElementById('t-message').value.trim(),
        isApproved: document.getElementById('t-approved').value === 'true',
      };
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data2 = await res.json();
      if (res.ok) { showToast('Testimonial added'); renderTestimonials(); }
      else showToast(data2.message, true);
    });

    document.querySelectorAll('.approve-testi-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const res = await fetch(`/api/testimonials/${btn.dataset.id}/approve`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isApproved: btn.dataset.approved === 'true' }),
        });
        if (res.ok) renderTestimonials();
      });
    });
    document.querySelectorAll('.delete-testi-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this testimonial?')) return;
        const res = await fetch(`/api/testimonials/${btn.dataset.id}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) { showToast('Testimonial deleted'); renderTestimonials(); }
      });
    });
  } catch {
    content.innerHTML = `<div class="admin-empty-state">Couldn't load testimonials.</div>`;
  }
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAdmin();
  if (!user) return;

  document.getElementById('admin-user-name').textContent = user.name;

  document.getElementById('admin-logout-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login.html';
  });

  document.getElementById('admin-mobile-toggle')?.addEventListener('click', () => {
    document.getElementById('admin-sidebar').classList.toggle('is-open');
  });

  router();
});
