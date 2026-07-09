/* ============================================================
   THRIF ME UP — MAIN JS (Home page interactions)
   Vanilla JS only, no framework. Progressive enhancement:
   the page is usable even if JS fails to load.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Sticky navbar shadow on scroll ---------- */
  const navbar = document.querySelector('.navbar');
  const onScroll = () => {
    if (window.scrollY > 12) navbar.classList.add('is-scrolled');
    else navbar.classList.remove('is-scrolled');

    backToTop.classList.toggle('is-visible', window.scrollY > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const menuToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const menuClose = document.querySelector('.mobile-menu-close');

  const openMenu = () => {
    mobileMenu.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    menuToggle.setAttribute('aria-expanded', 'true');
  };
  const closeMenu = () => {
    mobileMenu.classList.remove('is-open');
    document.body.style.overflow = '';
    menuToggle.setAttribute('aria-expanded', 'false');
  };
  menuToggle?.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  /* ---------- Scroll reveal (respects prefers-reduced-motion via CSS) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Staggered delay based on position in its section for a nicer cascade
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- Wishlist toggle (visual only on this static page —
     wired to /api/wishlist once auth/backend routes exist) ---------- */
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const nowActive = btn.classList.toggle('is-active');
      btn.setAttribute('aria-pressed', String(nowActive));
      showToast(
        nowActive ? 'Added to your wishlist' : 'Removed from wishlist',
        nowActive ? 'success' : 'default'
      );
    });
  });

  /* ---------- Quick add to cart ---------- */
  document.querySelectorAll('.quick-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.product-card');
      const name = card?.querySelector('h5')?.textContent || 'Item';
      showToast(`${name} added to cart`, 'success');
    });
  });

  /* ---------- Tabs: New Arrivals / Best Sellers ---------- */
  const tabGroups = document.querySelectorAll('[data-tab-group]');
  tabGroups.forEach(group => {
    const buttons = group.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll(`[data-tab-panel="${group.dataset.tabGroup}"]`);
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        panels.forEach(p => p.hidden = p.dataset.tab !== btn.dataset.tab);
      });
    });
  });

  /* ---------- Newsletter form validation ---------- */
  const newsletterForm = document.querySelector('.newsletter-form');
  newsletterForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = newsletterForm.querySelector('input[type="email"]');
    const msg = newsletterForm.parentElement.querySelector('.form-msg');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(input.value.trim())) {
      msg.textContent = 'Please enter a valid email address.';
      msg.className = 'form-msg error';
      input.focus();
      return;
    }

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: input.value.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong.');

      msg.textContent = data.message;
      msg.className = 'form-msg success';
      input.value = '';
      showToast('Subscribed to the newsletter', 'success');
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'form-msg error';
    }
  });

  /* ---------- Contact form validation ---------- */
  const contactForm = document.querySelector('.contact-form');
  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    contactForm.querySelectorAll('[required]').forEach(field => {
      const errorEl = field.closest('.field').querySelector('.error-text');
      if (!field.value.trim()) {
        errorEl.textContent = 'This field is required.';
        valid = false;
      } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        errorEl.textContent = 'Please enter a valid email.';
        valid = false;
      } else {
        errorEl.textContent = '';
      }
    });

    if (!valid) return;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('c-name').value.trim(),
          email: document.getElementById('c-email').value.trim(),
          message: document.getElementById('c-message').value.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not send message.');

      showToast(data.message, 'success');
      contactForm.reset();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  /* ---------- Toast helper ---------- */
  function showToast(message, type = 'default') {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast is-visible${type === 'error' ? ' toast-error' : ''}`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  /* ---------- Back to top ---------- */
  const backToTop = document.querySelector('.back-to-top');
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

});
