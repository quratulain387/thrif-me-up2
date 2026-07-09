/* ============================================================
   AUTH JS — handles both Register and Login forms.
   Calls the real backend at /api/auth/register and /api/auth/login.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const form = document.querySelector('[data-auth-form]');
  if (!form) return;

  const mode = form.dataset.authForm; // "register" or "login"
  const alertBox = document.querySelector('.auth-alert');
  const submitBtn = form.querySelector('button[type="submit"]');

  // ---------- Password visibility toggle ----------
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? 'Show' : 'Hide';
    });
  });

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `auth-alert is-visible ${type}`;
  }

  function setLoading(isLoading) {
    submitBtn.dataset.loading = String(isLoading);
    submitBtn.textContent = isLoading
      ? 'Please wait…'
      : (mode === 'register' ? 'Create Account' : 'Log In');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.classList.remove('is-visible');

    // ---- Basic client-side validation ----
    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      showAlert('Please enter a valid email address.', 'error');
      return;
    }
    if (password.length < 6) {
      showAlert('Password must be at least 6 characters.', 'error');
      return;
    }

    const payload = { email, password };

    if (mode === 'register') {
      const name = form.querySelector('#name').value.trim();
      const confirmPassword = form.querySelector('#confirmPassword').value;
      const phone = form.querySelector('#phone')?.value.trim();

      if (!name) {
        showAlert('Please enter your name.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showAlert('Passwords do not match.', 'error');
        return;
      }
      payload.name = name;
      payload.phone = phone;
    }

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
      setLoading(true);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // so the JWT cookie gets set/sent
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong. Please try again.');
      }

      showAlert(
        mode === 'register' ? 'Account created! Redirecting…' : 'Welcome back! Redirecting…',
        'success'
      );

      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        if (redirect) {
          window.location.href = decodeURIComponent(redirect);
        } else if (data.user?.role === 'admin') {
          window.location.href = '/admin.html';
        } else {
          window.location.href = '/dashboard.html';
        }
      }, 900);

    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  });
});
