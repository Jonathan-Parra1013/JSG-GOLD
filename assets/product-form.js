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
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          Añadir al Carrito
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
    if (!mainImg) return;

    document.querySelectorAll('[data-thumb-index]').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const src = thumb.getAttribute('data-media-src');
        if (src) mainImg.src = src;

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
