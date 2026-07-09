/* ============================================================
   CATEGORIES PAGE JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('categories-grid');

  // Deterministic visual per category name, falls back to a cycling list
  // for any category not explicitly mapped (keeps things visually varied
  // once an admin adds new categories later).
  const VISUAL_MAP = {
    'Sweaters': 'ph-sweater-stripe',
    'Outerwear': 'ph-denim',
    'Dresses': 'ph-blush',
    'Home Decor': 'ph-cream-plain',
    'Accessories': 'ph-mustard',
  };
  const FALLBACK_VISUALS = ['ph-forest', 'ph-checker', 'ph-mint-stripe', 'ph-rust-knit', 'ph-charcoal-floral'];

  function visualFor(name, index) {
    return VISUAL_MAP[name] || FALLBACK_VISUALS[index % FALLBACK_VISUALS.length];
  }

  function imageToClass(imagePath) {
    if (!imagePath) return null;
    if ((imagePath.startsWith('/images/uploads/') || imagePath.startsWith('http'))) return null; // real uploaded photo
    const file = imagePath.split('/').pop().replace(/\.[^.]+$/, '');
    return file.replace(/^placeholder-/, 'ph-');
  }

  // Renders a real product photo for the category if one exists, otherwise
  // falls back to the brand-color gradient block.
  function categoryVisualHTML(realImage, fallbackClass) {
    if (realImage && (realImage.startsWith('/images/uploads/') || realImage.startsWith('http'))) {
      return `<img src="${realImage}" class="cat-visual" style="object-fit:cover;">`;
    }
    return `<div class="cat-visual ${fallbackClass}"></div>`;
  }

  function renderSkeletons() {
    grid.innerHTML = Array.from({ length: 6 }).map(() => `
      <div class="category-full-card skeleton" style="aspect-ratio:1/1.1;"></div>
    `).join('');
  }

  renderSkeletons();

  try {
    const catRes = await fetch('/api/categories');
    const catData = await catRes.json();
    const categories = catData.categories || [];

    if (!categories.length) {
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted-on-light);padding:4rem 0;">No categories yet — check back soon.</p>`;
      return;
    }

    // Fetch a product count + representative photo for each category
    const categoryData = await Promise.all(
      categories.map(cat =>
        fetch(`/api/products?category=${cat._id}&limit=1`)
          .then(r => r.json())
          .then(d => ({ count: d.total || 0, image: d.products?.[0]?.images?.[0] || null }))
          .catch(() => ({ count: 0, image: null }))
      )
    );

    // Only show categories that actually have at least one product —
    // an empty category with a placeholder photo looks unfinished.
    const visibleCategories = categories.filter((cat, i) => categoryData[i].count > 0);

    if (!visibleCategories.length) {
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted-on-light);padding:4rem 0;">No categories with products yet — check back soon.</p>`;
      return;
    }

    grid.innerHTML = categories.map((cat, i) => {
      if (categoryData[i].count === 0) return '';
      return `
      <a href="/shop.html?category=${cat._id}" class="category-full-card">
        ${categoryVisualHTML(categoryData[i].image, visualFor(cat.name, i))}
        <div class="category-full-label">
          <span class="count">${categoryData[i].count} piece${categoryData[i].count === 1 ? '' : 's'}</span>
          <h3>${cat.name}</h3>
          <p>${cat.description || ''}</p>
        </div>
      </a>
    `;
    }).join('');

  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem 0;">
        <p style="color:var(--text-muted-on-light);margin-bottom:1rem;">Couldn't load categories.</p>
        <button class="btn btn-primary" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
});
