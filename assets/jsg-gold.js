/**
 * JSG GOLD - jsg-gold.js
 * Global theme utilities: toasts, header scroll, mobile menu, animations
 */

// ─────────────────────────────────────────
// JSGUtils — Global Helper Class
// ─────────────────────────────────────────
window.JSGUtils = {
  /**
   * Format Shopify money (cents integer) using the shop's money_format string
   * @param {number} cents - amount in cents (e.g. 38500000 for $385.000)
   * @param {string} format - Shopify money_format e.g. "${{amount}}"
   */
  formatMoney(cents, format) {
    if (!cents && cents !== 0) return '';
    const amount = (cents / 100).toFixed(0);
    const amountWithCommas = amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (format || '${{amount}}')
      .replace('{{amount}}', amountWithCommas)
      .replace('{{amount_no_decimals}}', amountWithCommas)
      .replace('{{amount_with_comma_separator}}', amountWithCommas);
  },

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: '✓',
      error: '✕',
      info: '👑'
    };

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `
      <span class="toast-icon" style="color: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#D4AF37'}">
        ${icons[type] || icons.info}
      </span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });

    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3800);
  }
};

// ─────────────────────────────────────────
// Sticky Header Shadow on Scroll
// ─────────────────────────────────────────
function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;

  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;
    if (currentY > 20) {
      header.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
    } else {
      header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
    }
    lastScrollY = currentY;
  }, { passive: true });
}

// ─────────────────────────────────────────
// Mobile Menu Toggle
// ─────────────────────────────────────────
function initMobileMenu() {
  const toggleBtn = document.querySelector('[data-menu-toggle]');
  const menu = document.getElementById('mobile-menu');
  if (!toggleBtn || !menu) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    menu.setAttribute('aria-hidden', !isOpen);
    toggleBtn.setAttribute('aria-expanded', isOpen);
  });

  // Close when clicking a link
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ─────────────────────────────────────────
// Smooth Scroll for anchor links
// ─────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ─────────────────────────────────────────
// Announce Bar — dismiss
// ─────────────────────────────────────────
function initAnnouncementBar() {
  const bar = document.querySelector('.announcement-bar');
  const dismiss = document.querySelector('[data-dismiss-announcement]');
  if (!bar || !dismiss) return;

  dismiss.addEventListener('click', () => {
    bar.style.transition = 'height 0.3s ease, opacity 0.3s ease';
    bar.style.height = bar.offsetHeight + 'px';
    requestAnimationFrame(() => {
      bar.style.height = '0';
      bar.style.opacity = '0';
      bar.style.overflow = 'hidden';
    });
    sessionStorage.setItem('jsg_announcement_dismissed', 'true');
  });

  if (sessionStorage.getItem('jsg_announcement_dismissed') === 'true') {
    bar.style.display = 'none';
  }
}

// ─────────────────────────────────────────
// Intersection Observer – Fade In on scroll
// ─────────────────────────────────────────
function initFadeInAnimations() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });

  document.querySelectorAll('.product-card, .testimonial-card, .trust-card, .category-card').forEach(el => {
    el.classList.add('fade-in-on-scroll');
    observer.observe(el);
  });
}

// ─────────────────────────────────────────
// Search Toggle Handler
// ─────────────────────────────────────────
function initSearchToggle() {
  document.querySelectorAll('[data-search-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const query = prompt('¿Qué joya en Oro Laminado 18K estás buscando? (ej. Cadena Cubana, Pulsera, Cristo)');
      if (query && query.trim() !== '') {
        window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
      }
    });
  });
}

// ─────────────────────────────────────────
// Newsletter Subscription Toast Handler
// ─────────────────────────────────────────
function initNewsletter() {
  document.querySelectorAll('form[action*="contact"], button:contains("SUSCRIBIRSE"), input[type="email"]').forEach(input => {
    const btn = input.tagName === 'BUTTON' ? input : input.nextElementSibling;
    if (btn && btn.tagName === 'BUTTON') {
      btn.addEventListener('click', (e) => {
        const emailInput = btn.previousElementSibling;
        if (emailInput && emailInput.value && emailInput.value.includes('@')) {
          e.preventDefault();
          window.JSGUtils.showToast('¡Gracias por suscribirte al Club VIP JSG GOLD! Te notificaremos de nuevos lanzamientos 18K.', 'success');
          emailInput.value = '';
        }
      });
    }
  });
}

// ─────────────────────────────────────────
// DOM Ready
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileMenu();
  initSmoothScroll();
  initAnnouncementBar();
  initFadeInAnimations();
  initSearchToggle();
  initNewsletter();

  console.log('%c💎 JSG GOLD Theme Loaded', 'color: #D4AF37; font-weight: bold; font-size: 14px;');
});
