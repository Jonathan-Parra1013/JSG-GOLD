/**
 * JSG GOLD - product-form.js
 * Handles product page: variant selection, price update, gallery,
 * and WhatsApp "Buy Now" (single product direct to WhatsApp)
 */

class JSGProductForm {
  constructor() {
    this.productData = window.productData;
    this.currentVariant = this.getVariantById(window.selectedVariantId);

    if (!this.productData) return;

    this.init();
  }

  init() {
    this.bindOptionChips();
    this.bindGallery();
    this.bindWhatsAppBuyNow();
  }

  // ─────────────────────────────────────────
  // VARIANT SELECTION
  // Option chips update hidden variant ID input + price
  // ─────────────────────────────────────────
  bindOptionChips() {
    const chips = document.querySelectorAll('.option-chip[data-option-position]');

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const position = parseInt(chip.getAttribute('data-option-position'), 10);
        const value = chip.getAttribute('data-option-value');

        // Update active chip in this option group
        const siblings = document.querySelectorAll(`.option-chip[data-option-position="${position}"]`);
        siblings.forEach(s => {
          s.classList.remove('active');
          s.setAttribute('aria-pressed', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');

        // Update displayed selected value
        const valDisplay = document.getElementById(`option-val-${position}`);
        if (valDisplay) valDisplay.textContent = value;

        // Find matching variant
        this.updateSelectedVariant();
      });
    });
  }

  getSelectedOptions() {
    const options = [];
    let pos = 1;
    while (true) {
      const activeChip = document.querySelector(`.option-chip[data-option-position="${pos}"].active`);
      if (!activeChip) break;
      options.push(activeChip.getAttribute('data-option-value'));
      pos++;
    }
    return options;
  }

  getVariantById(id) {
    return (this.productData.variants || []).find(v => v.id === id) || null;
  }

  getVariantByOptions(options) {
    return (this.productData.variants || []).find(variant => {
      return options.every((option, idx) => variant[`option${idx + 1}`] === option);
    }) || null;
  }

  updateSelectedVariant() {
    const options = this.getSelectedOptions();
    const variant = this.getVariantByOptions(options);

    if (!variant) return;

    this.currentVariant = variant;

    // Update hidden input
    const idInput = document.getElementById('variant-id');
    if (idInput) idInput.value = variant.id;

    // Update price display
    const priceEl = document.getElementById('product-price');
    if (priceEl) {
      priceEl.textContent = JSGUtils.formatMoney(variant.price, window.JSGGold.moneyFormat);
    }

    // Update Add to Cart button state
    const addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) {
      if (variant.available) {
        addBtn.disabled = false;
        addBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span>AÑADIR AL CARRITO</span>
        `;
      } else {
        addBtn.disabled = true;
        addBtn.innerHTML = `Agotado Temporalmente`;
      }
    }

    // Update WhatsApp Buy Now button data
    const waBuyBtn = document.querySelector('[data-action="whatsapp-buy-now"]');
    if (waBuyBtn) {
      waBuyBtn.setAttribute('data-variant-title', variant.title !== 'Default Title' ? variant.title : '');
      waBuyBtn.setAttribute('data-variant-price', JSGUtils.formatMoney(variant.price, window.JSGGold.moneyFormat));
      waBuyBtn.disabled = !variant.available;
    }

    // Update URL without reload (SEO-friendly)
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', newUrl.toString());
  }

  // ─────────────────────────────────────────
  // PRODUCT GALLERY — Thumbnails
  // ─────────────────────────────────────────
  bindGallery() {
    const mainImg = document.getElementById('main-product-image');
    const mainLink = document.querySelector('.detail-main-image-link');
    if (!mainImg) return;

    document.querySelectorAll('[data-thumb-index]').forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        e.preventDefault();
        const src = thumb.getAttribute('data-media-src');
        const zoomSrc = thumb.getAttribute('data-media-zoom-src') || src;
        if (!src) return;

        // Smooth transition effect
        mainImg.style.opacity = '0.35';
        mainImg.style.transition = 'opacity 0.18s ease-in-out';

        setTimeout(() => {
          // CRITICAL: Remove srcset so browser renders the new src immediately
          mainImg.removeAttribute('srcset');
          mainImg.src = src;

          if (mainLink) {
            mainLink.href = zoomSrc;
            mainLink.setAttribute('data-pswp-src', zoomSrc);
          }

          mainImg.style.opacity = '1';
        }, 120);

        document.querySelectorAll('[data-thumb-index]').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
  }

  // ─────────────────────────────────────────
  // WHATSAPP "BUY NOW" — Single Product
  // Builds personalized WhatsApp message with product details
  // ─────────────────────────────────────────
  bindWhatsAppBuyNow() {
    document.querySelectorAll('[data-action="whatsapp-buy-now"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const productTitle = btn.getAttribute('data-product-title') || this.productData.title;
        const variantTitle = btn.getAttribute('data-variant-title') || '';
        const price = btn.getAttribute('data-variant-price') || JSGUtils.formatMoney(this.currentVariant?.price || 0, window.JSGGold.moneyFormat);
        const productUrl = btn.getAttribute('data-product-url') || window.location.href;
        const waNumber = window.JSGGold.whatsappNumber;

        const variantLine = variantTitle && variantTitle !== 'Default Title'
          ? `Variante / Medida: ${variantTitle}%0A`
          : '';

        const msg = `¡Hola JSG Gold! 👑 Quiero comprar esta joya:%0A%0A`
          + `*${encodeURIComponent(productTitle)}*%0A`
          + variantLine
          + `Precio: *${price}*%0A`
          + `Link: ${encodeURIComponent(productUrl)}%0A%0A`
          + `Método de pago: *Pago Contra Entrega* (pagaré al recibir 💵)%0A%0A`
          + `Por favor indíquenme el tiempo de entrega y confirmen disponibilidad. ¡Gracias!`;

        window.open(`https://api.whatsapp.com/send?phone=${waNumber}&text=${msg}`, '_blank', 'noopener,noreferrer');
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('[data-product-form]')) {
    new JSGProductForm();
  }
});
