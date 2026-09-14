/**
 * JSG GOLD - Cart.js
 * Shopify Cart API integration with WhatsApp-only checkout
 * All cart operations use Shopify's native /cart/add.js, /cart/change.js endpoints
 */

class JSGCart {
  constructor() {
    this.drawer = document.getElementById('cart-drawer');
    this.backdrop = document.getElementById('cart-drawer-backdrop');
    this.itemsContainer = document.getElementById('cart-items');
    this.cartFooter = document.getElementById('cart-footer');
    this.cartCountEls = document.querySelectorAll('#cart-count');
    this.isOpen = false;

    this.init();
  }

  init() {
    this.bindDrawerTriggers();
    this.bindItemControls();
    this.bindWhatsAppCheckout();
    this.bindCartNote();
    this.refreshFreeShippingBar();
  }

  // ─────────────────────────────────────────
  // DRAWER OPEN / CLOSE
  // ─────────────────────────────────────────
  openDrawer() {
    this.backdrop.classList.add('active');
    this.backdrop.setAttribute('aria-hidden', 'false');
    this.drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.isOpen = true;

    // Focus trap
    this.drawer.focus();

    // Trigger cart refresh
    this.fetchAndRender();
  }

  closeDrawer() {
    this.backdrop.classList.remove('active');
    this.backdrop.setAttribute('aria-hidden', 'true');
    this.drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    this.isOpen = false;
  }

  bindDrawerTriggers() {
    // Open cart
    document.querySelectorAll('[data-cart-trigger]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDrawer();
      });
    });

    // Close cart
    document.querySelectorAll('[data-cart-close]').forEach(btn => {
      btn.addEventListener('click', () => this.closeDrawer());
    });

    // Close on backdrop click
    if (this.backdrop) {
      this.backdrop.addEventListener('click', (e) => {
        if (e.target === this.backdrop) this.closeDrawer();
      });
    }

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.closeDrawer();
    });
  }

  // ─────────────────────────────────────────
  // CART API — ADD TO CART
  // ─────────────────────────────────────────
  async addItem(variantId, quantity = 1, properties = {}) {
    const btn = document.querySelector(`[data-add-to-cart]`);
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="btn-spinner"></span> Agregando...`;
    }

    try {
      const response = await fetch(window.JSGGold.routes.cart_add_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          id: variantId,
          quantity: quantity,
          properties: properties
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.description || 'No se pudo agregar al carrito.');
      }

      const data = await response.json();
      await this.fetchAndRender();
      this.openDrawer();

      JSGUtils.showToast(`¡${data.product_title} agregado al carrito! 👑`, 'success');
    } catch (error) {
      JSGUtils.showToast(error.message || 'Error al agregar al carrito. Intenta de nuevo.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          Añadir al Carrito
        `;
      }
    }
  }

  // ─────────────────────────────────────────
  // CART API — UPDATE ITEM QUANTITY
  // ─────────────────────────────────────────
  async updateItem(key, quantity) {
    try {
      const response = await fetch(window.JSGGold.routes.cart_change_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ id: key, quantity: quantity })
      });

      if (!response.ok) throw new Error('No se pudo actualizar el carrito.');

      await this.fetchAndRender();
    } catch (error) {
      JSGUtils.showToast('Error al actualizar el carrito.', 'error');
    }
  }

  // ─────────────────────────────────────────
  // CART API — FETCH CART AND RE-RENDER
  // ─────────────────────────────────────────
  async fetchAndRender() {
    try {
      const response = await fetch(`${window.JSGGold.routes.cart_url}.js`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      const cart = await response.json();
      this.renderCart(cart);
      this.updateCountBadges(cart.item_count);
      this.refreshFreeShippingBar(cart.total_price);
    } catch (e) {
      console.error('[JSGCart] Failed to fetch cart:', e);
    }
  }

  // ─────────────────────────────────────────
  // RENDER CART ITEMS (from cart JSON)
  // ─────────────────────────────────────────
  renderCart(cart) {
    if (!this.itemsContainer) return;

    if (cart.item_count === 0) {
      this.itemsContainer.innerHTML = this.getEmptyState();
      if (this.cartFooter) this.cartFooter.style.display = 'none';
      return;
    }

    if (this.cartFooter) this.cartFooter.style.display = 'block';

    const subtotalFormatted = JSGUtils.formatMoney(cart.total_price, window.JSGGold.moneyFormat);

    this.itemsContainer.innerHTML = cart.items.map(item => `
      <div class="cart-item" data-key="${item.key}" data-variant-id="${item.variant_id}">
        <a href="${item.url}" class="cart-item__image-link" tabindex="-1" aria-hidden="true">
          <img src="${item.image || ''}"
               alt="${this.escapeHtml(item.title)}"
               class="cart-item__img"
               loading="lazy"
               width="80"
               height="80">
        </a>
        <div class="cart-item__info">
          <a href="${item.url}" class="cart-item__name">${this.escapeHtml(item.product_title)}</a>
          ${item.variant_title && item.variant_title !== 'Default Title'
            ? `<div class="cart-item__variant">${this.escapeHtml(item.variant_title)}</div>`
            : ''}
          <div class="cart-item__price">${JSGUtils.formatMoney(item.final_line_price, window.JSGGold.moneyFormat)}</div>
          <div class="cart-qty-ctrl" role="group" aria-label="Cantidad de ${this.escapeHtml(item.product_title)}">
            <button class="qty-btn"
                    data-action="decrease-qty"
                    data-key="${item.key}"
                    data-quantity="${item.quantity - 1}"
                    aria-label="Reducir cantidad"
                    ${item.quantity <= 1 ? 'aria-disabled="true"' : ''}>−</button>
            <span class="qty-value" aria-live="polite">${item.quantity}</span>
            <button class="qty-btn"
                    data-action="increase-qty"
                    data-key="${item.key}"
                    data-quantity="${item.quantity + 1}"
                    aria-label="Aumentar cantidad">+</button>
          </div>
        </div>
        <button class="cart-item__remove"
                data-action="remove-item"
                data-key="${item.key}"
                data-quantity="0"
                aria-label="Eliminar ${this.escapeHtml(item.product_title)} del carrito">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `).join('');

    // Update subtotal display
    const subtotalEl = document.getElementById('cart-subtotal');
    if (subtotalEl) subtotalEl.textContent = subtotalFormatted;

    // Re-bind item controls
    this.bindItemControls();
  }

  getEmptyState() {
    return `
      <div class="cart-empty-state">
        <div class="cart-empty-icon" aria-hidden="true">
          <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
        </div>
        <h4>Tu carrito está vacío</h4>
        <p>Descubre nuestra joyería masculina en Oro Laminado 18K.</p>
        <a href="/collections/all" class="btn btn-gold shine-hover" data-cart-close>
          Ver Catálogo de Joyas
        </a>
      </div>
    `;
  }

  bindItemControls() {
    document.querySelectorAll('[data-action="decrease-qty"], [data-action="increase-qty"], [data-action="remove-item"]').forEach(btn => {
      // Remove old listeners by cloning
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', async (e) => {
        const key = newBtn.getAttribute('data-key');
        const quantity = parseInt(newBtn.getAttribute('data-quantity'), 10);
        await this.updateItem(key, quantity);
      });
    });
  }

  // ─────────────────────────────────────────
  // UPDATE CART COUNT BADGES
  // ─────────────────────────────────────────
  updateCountBadges(count) {
    document.querySelectorAll('#cart-count, .mobile-cart-badge').forEach(el => {
      el.textContent = count;
      el.classList.toggle('hidden', count === 0);
    });
  }

  // ─────────────────────────────────────────
  // FREE SHIPPING PROGRESS BAR
  // ─────────────────────────────────────────
  refreshFreeShippingBar(totalPriceCents = null) {
    const bar = document.getElementById('free-shipping-bar');
    if (!bar) return;

    const threshold = parseInt(bar.getAttribute('data-threshold') || 250000, 10);
    const thresholdCents = threshold * 100; // Shopify prices are in cents

    const fill = document.getElementById('shipping-progress-fill');
    const text = document.getElementById('shipping-progress-text');
    if (!fill || !text) return;

    const doUpdate = (total) => {
      if (total >= thresholdCents) {
        fill.style.width = '100%';
        text.innerHTML = `🎉 <strong>¡Tienes ENVÍO GRATIS asegurado!</strong>`;
      } else {
        const remaining = thresholdCents - total;
        const percent = Math.min(100, Math.round((total / thresholdCents) * 100));
        fill.style.width = `${percent}%`;
        const remainingFormatted = JSGUtils.formatMoney(remaining, window.JSGGold.moneyFormat);
        text.innerHTML = `Agrega <strong>${remainingFormatted}</strong> más para obtener <strong>ENVÍO GRATIS</strong>`;
      }
    };

    if (totalPriceCents !== null) {
      doUpdate(totalPriceCents);
    } else {
      fetch(`${window.JSGGold.routes.cart_url}.js`)
        .then(r => r.json())
        .then(cart => doUpdate(cart.total_price))
        .catch(() => {});
    }
  }

  // ─────────────────────────────────────────
  // CART NOTE (saved automatically)
  // ─────────────────────────────────────────
  bindCartNote() {
    const noteEl = document.querySelector('[data-cart-note]');
    if (!noteEl) return;

    let debounceTimer;
    noteEl.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          await fetch(window.JSGGold.routes.cart_update_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ note: noteEl.value })
          });
        } catch (e) {}
      }, 800);
    });
  }

  // ─────────────────────────────────────────
  // WHATSAPP CHECKOUT (Cart → WhatsApp)
  // The ONLY payment method: Pago Contra Entrega via WhatsApp
  // ─────────────────────────────────────────
  bindWhatsAppCheckout() {
    const btn = document.getElementById('whatsapp-checkout-btn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      // Get current cart state
      let cart;
      try {
        const res = await fetch(`${window.JSGGold.routes.cart_url}.js`);
        cart = await res.json();
      } catch (e) {
        JSGUtils.showToast('Error al leer el carrito. Intenta de nuevo.', 'error');
        return;
      }

      if (!cart || cart.item_count === 0) {
        JSGUtils.showToast('Tu carrito está vacío. Agrega joyas primero.', 'info');
        return;
      }

      const waNumber = window.JSGGold.whatsappNumber;
      const prefix = (window.JSGGold.checkoutPrefix || '¡Hola JSG Gold! 👑 Quiero realizar el siguiente pedido de joyería en Oro Laminado 18K:');

      // Build WhatsApp message
      let msg = `${prefix}%0A%0A`;

      cart.items.forEach(item => {
        const price = JSGUtils.formatMoney(item.final_price, window.JSGGold.moneyFormat);
        const lineTotal = JSGUtils.formatMoney(item.final_line_price, window.JSGGold.moneyFormat);
        msg += `• *${this.escapeWA(item.product_title)}*%0A`;
        if (item.variant_title && item.variant_title !== 'Default Title') {
          msg += `  Variante: ${this.escapeWA(item.variant_title)}%0A`;
        }
        msg += `  Cantidad: ${item.quantity} × ${price} = *${lineTotal}*%0A%0A`;
      });

      const total = JSGUtils.formatMoney(cart.total_price, window.JSGGold.moneyFormat);
      msg += `*TOTAL A PAGAR: ${total}* (Contra Entrega — Pago al Recibir 💵)%0A%0A`;
      msg += `Por favor confírmenme la disponibilidad y el tiempo de entrega. 🚀%0A`;
      msg += `Gracias, JSG Gold!`;

      const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}&text=${msg}`;

      // Open WhatsApp
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      // Close drawer
      this.closeDrawer();

      JSGUtils.showToast('¡Redirigiendo a WhatsApp para confirmar tu pedido!', 'success');
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  escapeWA(text) {
    return encodeURIComponent(text).replace(/%20/g, '+');
  }
}


// ─────────────────────────────────────────────────────────────────────
// Product Form Submission Interceptor (prevents page navigation)
// Works on collection pages and product cards (quick add)
// ─────────────────────────────────────────────────────────────────────
function initAddToCartForms() {
  document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (!form.matches('[data-product-form], [data-quick-add-form]')) return;

    e.preventDefault();

    const variantIdInput = form.querySelector('[name="id"]');
    if (!variantIdInput) return;

    const variantId = parseInt(variantIdInput.value, 10);
    const quantity = parseInt(form.querySelector('[name="quantity"]')?.value || 1, 10);

    // Build optional properties from any hidden fields
    const properties = {};
    form.querySelectorAll('[name^="properties["]').forEach(input => {
      const key = input.name.replace('properties[', '').replace(']', '');
      properties[key] = input.value;
    });

    await window.JSGCartInstance.addItem(variantId, quantity, properties);
  });
}

// ─────────────────────────────────────────────────────────────────────
// Sort By (Collection page)
// ─────────────────────────────────────────────────────────────────────
function initSortBy() {
  const sortSelect = document.querySelector('[data-sort-by]');
  if (!sortSelect) return;

  sortSelect.addEventListener('change', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('sort_by', sortSelect.value);
    window.location.href = url.toString();
  });
}

// ─────────────────────────────────────────────────────────────────────
// DOM Ready — Initialize everything
// ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.JSGCartInstance = new JSGCart();
  initAddToCartForms();
  initSortBy();
});
