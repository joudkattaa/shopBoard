import { productById, formatMoney, cartTotals, findProducts, productCategories } from './logic.js'

// Legacy Vite demo API: keep DOM work here, even though the storefront does not use it.
export function setupCounter(element) {
  let counter = 0
  const setCounter = (count) => {
    counter = count
    element.innerHTML = `Count is ${counter}`
  }
  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
}

export function initializeTheme(state, document = globalThis.document) {
  const root = document.documentElement
  const toggle = document.querySelector('#theme-toggle')
  const meta = document.querySelector('meta[name="theme-color"]')
  function apply(theme) {
    root.dataset.theme = theme
    const dark = theme === 'dark'
    toggle.setAttribute('aria-pressed', String(dark))
    toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode')
    toggle.setAttribute('title', dark ? 'Light mode' : 'Dark mode')
    meta?.setAttribute('content', dark ? '#4B101F' : '#fffafb')
  }
  apply(state.theme)
  toggle.addEventListener('click', (event = {}) => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    state.setTheme(next)
    const reducedMotion = document.defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    function updateTheme() {
      root.dataset.themeChanging = 'true'
      apply(state.theme)
      void root.offsetHeight
      const view = document.defaultView
      if (view?.requestAnimationFrame)
        view.requestAnimationFrame(() =>
          view.requestAnimationFrame(() => {
            delete root.dataset.themeChanging
          }),
        )
      else delete root.dataset.themeChanging
    }
    if (document.startViewTransition && !reducedMotion && event.detail !== 0)
      document.startViewTransition(updateTheme)
    else updateTheme()
  })
}

export function initializeUI(state) {
  initializeTheme(state)

  const $ = (selector) => document.querySelector(selector)
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
    )
  function productMedia(product, size = 600) {
    const base = `/roseveil/${product.image}`
    const sizes =
      size === 70
        ? '70px'
        : size === 700
          ? '280px'
          : '(min-width: 1200px) 250px, (min-width: 900px) 25vw, (min-width: 600px) 34vw, 50vw'
    return `<img src="${base}.webp" srcset="${base}-240.webp 240w, ${base}-480.webp 480w, ${base}-800.webp 800w, ${base}.webp 1254w" sizes="${sizes}" alt="${product.name}" width="${size}" height="${size}" loading="${size === 600 ? 'lazy' : 'eager'}" decoding="async">`
  }
  const filters = { category: 'All', query: '', sort: 'default', bestsellers: false }
  let renderedProductIds
  let toastTimer
  $('#category-select').innerHTML += productCategories
    .map((category) => `<option value="${category}">${category}</option>`)
    .join('')

  function notify(message) {
    clearTimeout(toastTimer)
    $('#toast').textContent = message
    toastTimer = setTimeout(() => {
      $('#toast').textContent = ''
    }, 3800)
  }

  function renderCartCount() {
    const { count } = cartTotals(state.cart, state.promoCode)
    $('#cart-count').textContent = count
    $('#cart-heading-count').textContent = count ? `(${count})` : ''
    $('#cart-button').setAttribute(
      'aria-label',
      `Open shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`,
    )
  }

  function openContent(title, html) {
    $('#content-title').textContent = title
    $('#content-body').innerHTML = html
    if (!$('#content-dialog').open) $('#content-dialog').showModal()
    $('#content-title').focus()
  }

  function renderProducts() {
    const matches = findProducts(filters.category, filters.query, filters.bestsellers, filters.sort)
    const productIds = matches.map((product) => product.id).join(',')
    // Keep existing nodes when a search/category change produces the same ordered products.
    if (productIds !== renderedProductIds) {
      $('#product-grid').innerHTML = matches
        .map(
          (product) =>
            `<article class="product-card"><button class="product-image-button" data-product="${product.id}" aria-label="View ${product.name}">${productMedia(product)}</button><div class="product-info"><p class="product-category">${product.category}</p><h3><button class="product-name" data-product="${product.id}">${product.name}</button></h3><p class="product-price">${formatMoney(product.price)}</p></div><button class="add-button" data-add="${product.id}" aria-label="Add ${product.name} to bag">${icon('bag')} ADD TO CART</button></article>`,
        )
        .join('')
      renderedProductIds = productIds
    }
    const filtered =
      filters.category !== 'All' || Boolean(filters.query) || filters.sort !== 'default'
    $('#catalog-search').value = filters.query
    $('#product-search').value = filters.query
    $('#category-select').value = filters.category
    $('#price-sort').value = filters.sort
    $('#active-filters').hidden = !filtered
    $('#filter-description').textContent = [
      filters.category !== 'All' ? filters.category : '',
      filters.query ? `Search: “${filters.query}”` : '',
      `${matches.length} products`,
    ]
      .filter(Boolean)
      .join(' · ')
    $('#products-title').textContent =
      filters.category !== 'All'
        ? filters.category
        : filters.query
          ? 'Find Your Next Favorite'
          : filters.bestsellers
            ? 'The Roseveil Edit'
            : 'The Roseveil Collection'
    $('#products-eyebrow').textContent = filters.bestsellers
      ? 'BEST SELLERS'
      : 'EXPLORE THE COLLECTION'
    $('#filter-status').textContent =
      `${matches.length} ${matches.length === 1 ? 'product' : 'products'} shown${filters.category !== 'All' ? ` in ${filters.category}` : ''}.`
    $('#empty-state').hidden = matches.length > 0
    $('#view-all').innerHTML =
      `${!filters.bestsellers && !filtered ? 'VIEW BEST SELLERS' : 'VIEW ALL PRODUCTS'} ${icon('arrow')}`
    document.querySelectorAll('.main-nav [data-category]').forEach((link) => {
      link.classList.toggle(
        'active',
        !filters.bestsellers && link.dataset.category === filters.category,
      )
    })
    document
      .querySelectorAll('.collection-links [data-category], .category-card[data-category]')
      .forEach((link) => {
        if (!filters.bestsellers && link.dataset.category === filters.category)
          link.setAttribute('aria-current', 'true')
        else link.removeAttribute('aria-current')
      })
    const home = $('.main-nav a[href="#top"]')
    home.classList.toggle('active', filters.bestsellers && !filtered)
  }

  function resetFilters(bestsellers = false) {
    const resetHadFocus = [$('#clear-filters'), $('#empty-reset')].includes(document.activeElement)
    Object.assign(filters, { category: 'All', query: '', sort: 'default', bestsellers })
    $('#product-search').value = ''
    renderProducts()
    if (resetHadFocus) $('#products-title').focus()
  }

  function addProduct(id) {
    const product = productById(id)
    if (!product) return
    const existing = state.cart.find((item) => item.id === id)
    if (existing?.quantity === 99) {
      notify('You’ve reached the limit of 99 for this item.')
      return
    }
    state.addProduct(id)
    renderCartCount()
    notify(`${product.name} added to your bag.`)
  }

  function showProduct(id) {
    const product = productById(id)
    if (!product) return
    openContent(
      product.name,
      `<div class="modal-product">${productMedia(product, 700)}<div><p class="eyebrow">${product.category}</p><p>${product.description}</p><p class="modal-price">${formatMoney(product.price)}</p><p>${product.size}</p><button class="button" data-add="${product.id}">${icon('bag')} ADD TO BAG</button><small>Illustrative product. Images and sizes are for this concept store. No real purchase or product claims.</small></div></div>`,
    )
  }

  function renderCart(focusAction) {
    const totals = cartTotals(state.cart, state.promoCode)
    if (!state.cart.length) {
      $('#cart-content').innerHTML =
        `<div class="cart-empty">${icon('bag')}<h3>Your next little luxury awaits.</h3><p>Your shopping bag is empty. Find something you’ll love.</p><button class="button" data-continue-shopping>EXPLORE THE COLLECTION</button></div>`
      return
    }
    const toFreeShipping = Math.max(0, 5001 - totals.merchandise)
    $('#cart-content').innerHTML =
      `<div class="shipping-note">${toFreeShipping ? `Add ${formatMoney(toFreeShipping)} more after discounts for free shipping.` : 'Lovely! Your bag qualifies for free shipping.'}<div class="shipping-progress"><span style="width:${Math.min(100, (totals.merchandise / 5001) * 100)}%"></span></div></div><ul class="cart-lines">${state.cart
        .map((item) => {
          const product = productById(item.id)
          return `<li class="cart-line">${productMedia(product, 70)}<div><h3>${product.name}</h3><p>${formatMoney(product.price)} · ${product.size}</p><div class="quantity"><button data-quantity="${item.id}" data-delta="-1" aria-label="Decrease quantity of ${product.name}">−</button><span aria-label="Quantity">${item.quantity}</span><button data-quantity="${item.id}" data-delta="1" aria-label="Increase quantity of ${product.name}" ${item.quantity >= 99 ? 'disabled' : ''}>+</button></div></div><div><p class="cart-line-total">${formatMoney(product.price * item.quantity)}</p><button class="remove-line" data-remove="${item.id}" aria-label="Remove ${product.name}">Remove</button></div></li>`
        })
        .join(
          '',
        )}</ul><form id="promo-form" class="promo-form"><label for="promo-code">Have a little treat? Enter your code.</label><div class="search-row"><input id="promo-code" name="promo" placeholder="GLOW20" value="${state.promoCode}" maxlength="20" autocomplete="off"><button class="button secondary" type="submit">${state.promoCode ? 'REMOVE' : 'APPLY'}</button></div><p id="promo-status" class="form-status" role="status">${state.promoCode ? 'GLOW20 applied — enjoy 20% off your items.' : ''}</p></form><div class="cart-totals"><div><span>Subtotal</span><span>${formatMoney(totals.subtotal)}</span></div>${totals.discount ? `<div><span>GLOW20 · 20% off</span><span>−${formatMoney(totals.discount)}</span></div>` : ''}<div><span>Demo shipping</span><span>${totals.shipping ? formatMoney(totals.shipping) : 'FREE'}</span></div><div class="grand-total"><span>Total</span><span>${formatMoney(totals.total)}</span></div></div><button class="button cart-checkout" id="checkout-button">DEMO CHECKOUT ${icon('arrow')}</button><p class="cart-demo">A concept store. No payment is collected or real order placed.</p>`
    $('#promo-form').addEventListener('submit', (event) => {
      event.preventDefault()
      if (state.promoCode) {
        state.setPromoCode('')
        renderCartCount()
        renderCart('promo')
        return
      }
      const entered = $('#promo-code').value.trim().toUpperCase()
      if (entered !== 'GLOW20') {
        $('#promo-status').textContent = 'That code isn’t available. Try GLOW20 for 20% off.'
        return
      }
      state.setPromoCode('GLOW20')
      renderCartCount()
      renderCart('promo')
    })
    if (focusAction === 'promo') $('#promo-code').focus()
  }

  function showCart() {
    renderCart()
    $('#cart-dialog').showModal()
    $('#cart-title').focus()
  }

  function showCheckout() {
    if (!state.cart.length) return
    const totals = cartTotals(state.cart, state.promoCode)
    $('#cart-dialog').close()
    openContent(
      'A little glow is on its way.',
      `<p>Review your demo bag: ${totals.count} ${totals.count === 1 ? 'item' : 'items'} · <strong>${formatMoney(totals.total)}</strong> including demo shipping. This form completes a demonstration only. No payment or delivery will take place.</p><form id="checkout-form" class="form-stack"><div class="field-row"><div><label for="checkout-first">First name</label><input id="checkout-first" name="first" autocomplete="given-name" required maxlength="80"></div><div><label for="checkout-last">Last name</label><input id="checkout-last" name="last" autocomplete="family-name" required maxlength="80"></div></div><label for="checkout-email">Email address</label><input id="checkout-email" name="email" type="email" autocomplete="email" required maxlength="254"><button class="button" type="submit">COMPLETE DEMO ORDER ${icon('arrow')}</button><p class="cart-demo">Details are not saved or sent. No card information required.</p></form>`,
    )
    $('#checkout-form').addEventListener('submit', (event) => {
      event.preventDefault()
      const name = $('#checkout-first').value.trim()
      state.clearCart()
      renderCartCount()
      openContent(
        'A beautiful little moment.',
        `<div class="confirmation">${icon('gift')}<h3>Thank you${name ? `, ${escape(name)}` : ''}!</h3><p>Your demo order is complete. No order was placed, no payment was taken, and your details were not saved.</p><button class="button" data-continue-shopping>CONTINUE EXPLORING</button></div>`,
      )
    })
  }

  function showAccount() {
    if (state.profile) {
      openContent(
        'Your beauty space',
        `<p>Welcome back, <strong>${escape(state.profile.name)}</strong>. Your demo profile is available for this visit. Your shopping bag has ${cartTotals(state.cart).count} items.</p><button class="button" id="profile-shop">EXPLORE THE COLLECTION</button><button class="text-button" id="profile-reset">Clear my demo profile</button>`,
      )
      $('#profile-shop').addEventListener('click', continueShopping)
      $('#profile-reset').addEventListener('click', () => {
        state.setProfile(null)
        showAccount()
      })
      return
    }
    openContent(
      'A little space for you.',
      `<p>Create a demo profile for this visit. No real account is created. Use a made-up password; form details and passwords are not sent or saved.</p><form id="profile-form" class="form-stack"><label for="profile-name">Your name</label><input id="profile-name" name="name" autocomplete="given-name" required maxlength="80"><label for="profile-email">Email address</label><input id="profile-email" name="email" type="email" autocomplete="email" required maxlength="254"><label for="profile-password">Demo password</label><input id="profile-password" name="password" type="password" autocomplete="new-password" required minlength="8" maxlength="128" aria-describedby="profile-password-hint"><small id="profile-password-hint">At least 8 characters. Use a made-up password for this demonstration.</small><button class="button" type="submit">ENTER MY BEAUTY SPACE</button></form>`,
    )
    $('#profile-form').addEventListener('submit', (event) => {
      event.preventDefault()
      state.setProfile({ name: $('#profile-name').value.trim() })
      event.target.reset()
      showAccount()
    })
  }

  function continueShopping() {
    document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close())
    resetFilters()
    $('#products').scrollIntoView({ behavior: 'auto' })
    $('#products-title').focus()
  }

  const info = {
    shipping: {
      title: 'A little note on shipping',
      html: '<p>This is a concept store, so products are not physically shipped. In the demo bag, orders over $50 after discounts qualify for free shipping; other non-empty orders show a $5.95 demo shipping fee.</p><p>Use GLOW20 in the bag for 20% off merchandise. Shipping eligibility is recalculated after the discount.</p>',
    },
    returns: {
      title: 'Returns & a little reassurance',
      html: '<p>No real orders or payments are accepted on this concept website. There are no deliveries or returns to process.</p><p>To change your demo bag, adjust quantities or remove an item before completing the demo checkout.</p>',
    },
    privacy: {
      title: 'Your privacy',
      html: '<p>Your product selections, discount code, and light or dark theme preference are stored only in this browser so your bag survives a refresh. You can remove them by emptying your bag or clearing this site’s browser data.</p><p>Demo profile, newsletter, checkout, and contact details are not sent or saved. There are no analytics or advertising trackers. Google Fonts receives a browser request to load the typefaces.</p>',
    },
    terms: {
      title: 'A note about this store',
      html: '<p>Roseveil Cosmetics is an illustrative storefront. Product images are AI-generated concepts; prices, sizes, descriptions, and offers demonstrate the shopping experience.</p><p>No real sales, payments, deliveries, customer accounts, or cosmetic performance claims are offered. Completing a demo checkout does not create a purchase agreement.</p>',
    },
    faq: {
      title: 'A few helpful answers',
      html: '<div class="article-list"><details open><summary>Can I buy these products?</summary><p>This is a concept store. You can explore products and try the bag and checkout, but no real payment or order is processed.</p></details><details><summary>How does GLOW20 work?</summary><p>Open your bag and apply GLOW20 for 20% off merchandise. It cannot be stacked with another code.</p></details><details><summary>When is shipping free?</summary><p>The demo shipping fee is waived when merchandise totals more than $50 after discounts.</p></details><details><summary>Will my bag stay here?</summary><p>Yes, product selections are saved in this browser when local storage is available. Personal form details are not saved.</p></details></div>',
    },
    journal: {
      title: 'The beauty journal',
      html: '<p>Small ideas for a more considered everyday ritual.</p><div class="article-list"><article><h3>Make a moment of it</h3><p>Clear a little space, slow down, and let your beauty routine be a quiet pause in your day. Follow the instructions on any products you use.</p></article><article><h3>Your own palette</h3><p>A wash of soft rose, a hint of champagne, a warm neutral. Explore colors you enjoy and make your makeup edit your own.</p></article><article><h3>The art of a thoughtful gift</h3><p>Start with their favorite colors and little daily pleasures. A handwritten note makes a beautiful finishing touch.</p></article></div>',
    },
  }

  function showContact() {
    openContent(
      'Let’s connect.',
      '<p>A question, a little inspiration, or just hello? Try our demo contact form. Messages are not sent or saved.</p><form id="contact-form" class="form-stack"><label for="contact-name">Your name</label><input id="contact-name" name="name" autocomplete="name" required maxlength="100"><label for="contact-email">Email address</label><input id="contact-email" name="email" type="email" autocomplete="email" required maxlength="254"><label for="contact-message">Your message</label><textarea id="contact-message" name="message" required maxlength="3000"></textarea><button class="button" type="submit">SEND DEMO MESSAGE</button><p id="contact-status" class="form-status" role="status"></p></form>',
    )
    $('#contact-form').addEventListener('submit', (event) => {
      event.preventDefault()
      $('#contact-status').textContent =
        'Thank you for saying hello! Demo complete — no message was sent or saved.'
      event.target.reset()
    })
  }

  document.querySelectorAll('.catalog-tool').forEach((tool) => {
    tool.addEventListener('toggle', () => {
      if (tool.open) {
        tool.querySelector('input, select')?.focus()
        document.querySelectorAll('.catalog-tool').forEach((other) => {
          if (other !== tool) other.open = false
        })
      }
    })
  })

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.catalog-tools'))
      document.querySelectorAll('.catalog-tool[open]').forEach((tool) => {
        tool.open = false
      })
    const addButton = event.target.closest('[data-add]')
    if (addButton) addProduct(addButton.dataset.add)
    const productButton = event.target.closest('[data-product]')
    if (productButton) showProduct(productButton.dataset.product)
    const categoryLink = event.target.closest('[data-category]')
    if (categoryLink) {
      filters.category = categoryLink.dataset.category
      filters.bestsellers = false
      renderProducts()
      closeMenu()
    }
    const closeButton = event.target.closest('[data-close-dialog]')
    if (closeButton) closeButton.closest('dialog').close()
    if (event.target.closest('[data-continue-shopping]')) continueShopping()
    const infoButton = event.target.closest('[data-info]')
    if (infoButton) {
      closeMenu()
      const key = infoButton.dataset.info
      if (key === 'contact') showContact()
      else if (info[key]) openContent(info[key].title, info[key].html)
    }
  })

  $('#cart-content').addEventListener('click', (event) => {
    const quantityButton = event.target.closest('[data-quantity]')
    const removeButton = event.target.closest('[data-remove]')
    if (quantityButton) {
      const id = quantityButton.dataset.quantity
      const delta = Number(quantityButton.dataset.delta)
      const line = state.cart.find((item) => item.id === id)
      if (!line) return
      state.changeQuantity(id, delta)
      renderCartCount()
      renderCart()
      const next = [...$('#cart-content').querySelectorAll('[data-quantity]')].find(
        (button) =>
          button.dataset.quantity === id &&
          Number(button.dataset.delta) === delta &&
          !button.disabled,
      )
      ;(next || $('#cart-content').querySelector('button'))?.focus()
    }
    if (removeButton) {
      const name = productById(removeButton.dataset.remove)?.name
      state.removeProduct(removeButton.dataset.remove)
      renderCartCount()
      renderCart()
      $('#cart-content').querySelector('button')?.focus()
      notify(`${name} removed from your bag.`)
    }
    if (event.target.closest('#checkout-button')) showCheckout()
  })

  $('#cart-button').addEventListener('click', showCart)
  $('#account-button').addEventListener('click', showAccount)
  $('#view-all').addEventListener('click', () =>
    resetFilters(
      !filters.bestsellers &&
        filters.category === 'All' &&
        !filters.query &&
        filters.sort === 'default',
    ),
  )
  $('#clear-filters').addEventListener('click', () => resetFilters())
  $('#empty-reset').addEventListener('click', () => resetFilters())
  $('#search-toggle').addEventListener('click', () => {
    const panel = $('#search-panel')
    panel.hidden = !panel.hidden
    $('#search-toggle').setAttribute('aria-expanded', String(!panel.hidden))
    if (!panel.hidden) $('#product-search').focus()
  })
  function updateSearch(input) {
    filters.query = input.value
    filters.bestsellers = false
    renderProducts()
  }
  $('#product-search').addEventListener('input', (event) => updateSearch(event.target))
  $('#catalog-search').addEventListener('input', (event) => updateSearch(event.target))
  $('#catalog-controls').addEventListener('submit', (event) => event.preventDefault())
  $('#category-select').addEventListener('change', (event) => {
    filters.category = event.target.value
    filters.bestsellers = false
    renderProducts()
  })
  $('#price-sort').addEventListener('change', (event) => {
    filters.sort = event.target.value
    filters.bestsellers = false
    renderProducts()
  })
  $('#search-form').addEventListener('submit', (event) => {
    event.preventDefault()
    filters.query = $('#product-search').value
    filters.bestsellers = false
    renderProducts()
    $('#products').scrollIntoView({ behavior: 'auto' })
    $('#products-title').focus()
  })
  function closeMenu() {
    const focusWasInside = $('#main-nav').contains(document.activeElement)
    $('#main-nav').classList.remove('is-open')
    $('#menu-toggle').setAttribute('aria-expanded', 'false')
    $('#menu-toggle').setAttribute('aria-label', 'Open navigation')
    if (focusWasInside && $('#menu-toggle').getClientRects().length) $('#menu-toggle').focus()
  }
  $('#menu-toggle').addEventListener('click', () => {
    const open = $('#main-nav').classList.toggle('is-open')
    $('#menu-toggle').setAttribute('aria-expanded', String(open))
    $('#menu-toggle').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation')
  })
  document
    .querySelectorAll('.main-nav a:not([data-category])')
    .forEach((link) => link.addEventListener('click', closeMenu))
  document.addEventListener('keydown', (event) => {
    // Native modal dialogs own Escape, Tab and Shift+Tab; never focus their background.
    if (event.key !== 'Escape' || event.defaultPrevented || $('dialog[open]')) return
    const focusedTool = [...document.querySelectorAll('.catalog-tool[open]')].find((tool) =>
      tool.contains(document.activeElement),
    )
    if (focusedTool) {
      event.preventDefault()
      focusedTool.open = false
      focusedTool.querySelector('summary').focus()
      return
    }
    if (!$('#search-panel').hidden && $('#search-panel').contains(document.activeElement)) {
      event.preventDefault()
      $('#search-panel').hidden = true
      $('#search-toggle').setAttribute('aria-expanded', 'false')
      $('#search-toggle').focus()
      return
    }
    if ($('#menu-toggle').getAttribute('aria-expanded') === 'true') {
      event.preventDefault()
      closeMenu()
      $('#menu-toggle').focus()
    }
  })
  $('#about-more').addEventListener('click', () => {
    const story = $('#about-story')
    story.hidden = !story.hidden
    $('#about-more').setAttribute('aria-expanded', String(!story.hidden))
    $('#about-more').textContent = story.hidden ? 'LEARN MORE' : 'SHOW LESS'
  })
  $('#newsletter').addEventListener('submit', (event) => {
    event.preventDefault()
    $('#newsletter-status').textContent =
      'A little glow, just for you. Demo signup complete — no email was saved or sent.'
    event.target.reset()
  })
  $('#copy-code').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('GLOW20')
      notify('GLOW20 copied! Apply it in your bag for 20% off.')
    } catch {
      notify('Use GLOW20 in your bag for 20% off.')
    }
  })
  document.querySelectorAll('dialog').forEach((dialog) =>
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return
      const rect = dialog.getBoundingClientRect()
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close()
    }),
  )

  renderCartCount()
  renderProducts()
}
