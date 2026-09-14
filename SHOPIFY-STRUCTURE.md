# JSG GOLD - Shopify Theme Structure

JSG-GOLD/
├── assets/
│   ├── jsg-gold.css              # Estilos principales
│   ├── jsg-gold.js               # JavaScript principal
│   ├── cart.js                   # Cart API integration
│   ├── product-form.js           # Product form + WhatsApp checkout
│   └── theme.js                  # Theme utilities
│
├── config/
│   └── settings_schema.json      # Theme Editor settings
│
├── layout/
│   └── theme.liquid              # Layout principal (header, footer)
│
├── locales/
│   └── es.default.json           # Traducciones en español
│
├── sections/
│   ├── header.liquid             # Navbar con carrito Shopify
│   ├── hero-banner.liquid        # Hero personalizable desde editor
│   ├── featured-collection.liquid # Catálogo con colección de Shopify
│   ├── trust-bar.liquid          # Badges de confianza
│   ├── about-jsg.liquid          # Sobre Nosotros con tabla 18K
│   ├── testimonials.liquid       # Testimonios editables
│   ├── footer.liquid             # Footer completo
│   └── announcement-bar.liquid   # Barra de anuncios
│
├── snippets/
│   ├── product-card.liquid       # Tarjeta de producto del catálogo
│   ├── cart-drawer.liquid        # Drawer lateral del carrito
│   ├── whatsapp-checkout.liquid  # Botón CTA de checkout por WhatsApp
│   └── icon-*.liquid             # Íconos SVG
│
└── templates/
    ├── index.liquid              # Página de inicio
    ├── collection.liquid         # Catálogo / Página de colección
    ├── product.liquid            # Página de producto individual
    ├── cart.liquid               # Carrito
    ├── customers/
    │   ├── account.liquid        # Mi cuenta (pedidos de Shopify)
    │   ├── login.liquid          # Login de Shopify
    │   ├── register.liquid       # Registro de Shopify
    │   └── addresses.liquid      # Direcciones de Shopify
    └── page.liquid               # Página genérica (Nosotros, etc.)
