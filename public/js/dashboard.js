/* ============================================================
   DASHBOARD JS — loads the logged-in user's profile,
   redirects to login if not authenticated, handles logout.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const nameEl = document.querySelector('[data-user-name]');
  const emailEl = document.querySelector('[data-user-email]');
  const initialEl = document.querySelector('[data-user-initial]');

  try {
    const res = await fetch('/api/auth/profile', { credentials: 'include' });
    if (!res.ok) throw new Error('Not authenticated');

    const data = await res.json();
    const user = data.user;

    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (initialEl) initialEl.textContent = user.name.charAt(0).toUpperCase();

  } catch (err) {
    // Not logged in — send back to login page
    window.location.href = '/login.html';
  }

  // ---------- Logout ----------
  document.querySelector('.logout-btn')?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login.html';
  });
});
