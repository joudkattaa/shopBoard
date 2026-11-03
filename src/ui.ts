import type { AppState, Theme } from './modules/state/state.types.ts'
import type { Product, Category } from './modules/products/products.types.ts'
import type { SortOrder } from './logic.ts'
import {
  productById,
  formatMoney,
  cartTotals,
  findProducts,
  productCategories,
  isCategory,
  isSortOrder,
} from './logic.ts'

// Legacy Vite demo API: keep DOM work here, even though the storefront does not use it.
export function setupCounter(element: HTMLElement) {
  let counter = 0
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `Count is ${counter}`
  }
  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
}

export function initializeTheme(state: AppState, document = globalThis.document) {
  const root = document.documentElement
  const candidate = document.querySelector('#theme-toggle')
  if (!candidate) return
  const toggle = candidate
  const meta = document.querySelector('meta[name="theme-color"]')
  function apply(theme: Theme) {
    root.dataset.theme = theme
    const dark = theme === 'dark'
    toggle.setAttribute('aria-pressed', String(dark))
    toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode')
    toggle.setAttribute('title', dark ? 'Light mode' : 'Dark mode')
    meta?.setAttribute('content', dark ? '#4B101F' : '#fffafb')
  }
  apply(state.theme)
  toggle.addEventListener('click', (event) => {
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
    if (
      document.startViewTransition &&
      !reducedMotion &&
      (!('detail' in event) || event.detail !== 0)
    )
      document.startViewTransition(updateTheme)
    else updateTheme()
  })
}

export function initializeHeroEntrance(document = globalThis.document) {
  const candidateView = document.defaultView
  const scene = document.querySelector('.hero-layered-scene')
  const fallback = document.querySelector('.hero-artwork > picture')
  if (!scene || !fallback || !candidateView?.IntersectionObserver || !candidateView.matchMedia)
    return
  const view = candidateView

  const preference = view.matchMedia('(prefers-reduced-motion: reduce)')
  const images = [...scene.querySelectorAll('img')]
  let observer: IntersectionObserver | undefined
  let failed = false

  function showFallback() {
    observer?.disconnect()
    observer = undefined
    scene?.setAttribute('hidden', '')
    scene?.removeAttribute('data-entrance')
    fallback?.removeAttribute('hidden')
  }

  function activate() {
    if (preference.matches || failed) {
      showFallback()
      return
    }
    if (
      observer ||
      !images.length ||
      !images.every((image) => image.complete && image.naturalWidth > 0)
    )
      return
    let armed = true
    scene?.setAttribute('data-entrance', 'ready')
    scene?.removeAttribute('hidden')
    fallback?.setAttribute('hidden', '')
    observer = new view.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            armed = true
            scene?.setAttribute('data-entrance', 'ready')
          } else if (entry.intersectionRatio >= 0.12 && armed) {
            armed = false
            scene?.setAttribute('data-entrance', 'playing')
          }
        }
      },
      { threshold: [0, 0.12] },
    )
    if (scene) observer.observe(scene)
  }

  for (const image of images) {
    image.addEventListener('load', activate, { once: true })
    image.addEventListener(
      'error',
      () => {
        failed = true
        showFallback()
      },
      { once: true },
    )
  }
  preference.addEventListener('change', activate)
  activate()
}

export function initializeUI(state: AppState) {
  initializeTheme(state)
  initializeHeroEntrance()

  function required<T extends Element>(selector: string, kind: { new (): T }): T {
    const element = document.querySelector(selector)
    if (!(element instanceof kind)) throw new Error('Missing or invalid element: ' + selector)
    return element
  }
  function all<T extends Element>(
    selector: string,
    kind: { new (): T },
    root: ParentNode = document,
  ): T[] {
    return Array.from(root.querySelectorAll(selector)).filter(
      (element): element is T => element instanceof kind,
    )
  }
  function closest(target: Element, selector: string): HTMLElement | null {
    const element = target.closest(selector)
    return element instanceof HTMLElement ? element : null
  }
  const $ = (selector: string) => required(selector, HTMLElement)
  const input = (selector: string) => required(selector, HTMLInputElement)
  const select = (selector: string) => required(selector, HTMLSelectElement)
  const dialog = (selector: string) => required(selector, HTMLDialogElement)
  const form = (selector: string) => required(selector, HTMLFormElement)
  const icon = (name: string) =>
    `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  const escape = (value: unknown) =>
    String(value).replace(/[&<>"']/g, (character) => entities[character] ?? character)
  function productMedia(product: Product, size = 600) {
    const base = `/roseveil/${product.image}`
    const sizes =
      size === 70
        ? '70px'
        : size === 700
          ? '280px'
          : '(min-width: 1200px) 250px, (min-width: 900px) 25vw, (min-width: 600px) 34vw, 50vw'
    return `<img src="${base}.webp" srcset="${base}-240.webp 240w, ${base}-480.webp 480w, ${base}-800.webp 800w, ${base}.webp 1254w" sizes="${sizes}" alt="${product.name}" width="${size}" height="${size}" loading="${size === 600 ? 'lazy' : 'eager'}" decoding="async">`
  }
  const filters: {
    category: Category | 'All'
    query: string
    sort: SortOrder
    featured: boolean
  } = { category: 'All', query: '', sort: 'default', featured: true }
  let renderedProductIds: string | undefined
  let toastTimer: ReturnType<typeof setTimeout> | undefined
  select('#category-select').innerHTML += productCategories
    .map((category) => `<option value="${category}">${category}</option>`)
    .join('')

  function notify(message: string) {
    clearTimeout(toastTimer)
    $('#toast').textContent = message
    toastTimer = setTimeout(() => {
      $('#toast').textContent = ''
    }, 3800)
  }

  function renderCartCount() {
    const { count } = cartTotals(state.cart, state.promoCode)
    $('#cart-count').textContent = String(count)
    $('#cart-heading-count').textContent = count ? `(${count})` : ''
    $('#cart-button').setAttribute(
      'aria-label',
      `Open shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`,
    )
  }

  function openContent(title: string, html: string) {
    $('#content-title').textContent = title
    $('#content-body').innerHTML = html
    if (!dialog('#content-dialog').open) dialog('#content-dialog').showModal()
    $('#content-title').focus()
  }

  function renderProducts() {
    const matches = findProducts(filters.category, filters.query, filters.featured, filters.sort)
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
    input('#catalog-search').value = filters.query
    input('#product-search').value = filters.query
    select('#category-select').value = filters.category
    select('#price-sort').value = filters.sort
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
          : 'The Roseveil Collection'
    $('#products-eyebrow').textContent = filters.featured
      ? 'CURATED FAVORITES'
      : 'EXPLORE THE COLLECTION'
    $('#filter-status').textContent =
      `${matches.length} ${matches.length === 1 ? 'product' : 'products'} shown${filters.category !== 'All' ? ` in ${filters.category}` : ''}.`
    $('#empty-state').hidden = matches.length > 0
    $('#view-all').innerHTML =
      `${!filters.featured && !filtered ? 'VIEW FEATURED PRODUCTS' : 'VIEW ALL PRODUCTS'} ${icon('arrow')}`
    all('.main-nav [data-category]', HTMLElement).forEach((link) => {
      link.classList.toggle(
        'active',
        !filters.featured && link.dataset.category === filters.category,
      )
    })
    all('.collection-links [data-category], .category-card[data-category]', HTMLElement).forEach(
      (link) => {
        if (!filters.featured && link.dataset.category === filters.category)
          link.setAttribute('aria-current', 'true')
        else link.removeAttribute('aria-current')
      },
    )
    const home = $('.main-nav a[href="#top"]')
    home.classList.toggle('active', filters.featured && !filtered)
  }

  function resetFilters(featured = false) {
    const resetHadFocus = [$('#clear-filters'), $('#empty-reset')].some(
      (element) => element === document.activeElement,
    )
    Object.assign(filters, { category: 'All', query: '', sort: 'default', featured })
    input('#product-search').value = ''
    renderProducts()
    if (resetHadFocus) $('#products-title').focus()
  }

  function addProduct(id: string) {
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

  function showProduct(id: string) {
    const product = productById(id)
    if (!product) return
    openContent(
      product.name,
      `<div class="modal-product">${productMedia(product, 700)}<div><p class="eyebrow">${product.category}</p><p>${product.description}</p><p class="modal-price">${formatMoney(product.price)}</p><p>${product.size}</p><button class="button" data-add="${product.id}">${icon('bag')} ADD TO BAG</button><small>Illustrative product. Images and sizes are for this concept store. No real purchase or product claims.</small></div></div>`,
    )
  }

  function renderCart(focusAction?: string) {
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
          if (!product) return ''
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
      const entered = input('#promo-code').value.trim().toUpperCase()
      if (entered !== 'GLOW20') {
        $('#promo-status').textContent = 'That code isn’t available. Try GLOW20 for 20% off.'
        return
      }
      state.setPromoCode('GLOW20')
      renderCartCount()
      renderCart('promo')
    })
    if (focusAction === 'promo') input('#promo-code').focus()
  }

  function showCart() {
    renderCart()
    dialog('#cart-dialog').showModal()
    $('#cart-title').focus()
  }

  function showCheckout() {
    if (!state.cart.length) return
    const totals = cartTotals(state.cart, state.promoCode)
    dialog('#cart-dialog').close()
    openContent(
      'A little glow is on its way.',
      `<p>Review your demo bag: ${totals.count} ${totals.count === 1 ? 'item' : 'items'} · <strong>${formatMoney(totals.total)}</strong> including demo shipping. This form completes a demonstration only. No payment or delivery will take place.</p><form id="checkout-form" class="form-stack"><div class="field-row"><div><label for="checkout-first">First name</label><input id="checkout-first" name="first" autocomplete="given-name" required maxlength="80"></div><div><label for="checkout-last">Last name</label><input id="checkout-last" name="last" autocomplete="family-name" required maxlength="80"></div></div><label for="checkout-email">Email address</label><input id="checkout-email" name="email" type="email" autocomplete="email" required maxlength="254"><button class="button" type="submit">COMPLETE DEMO ORDER ${icon('arrow')}</button><p class="cart-demo">Details are not saved or sent. No card information required.</p></form>`,
    )
    $('#checkout-form').addEventListener('submit', (event) => {
      event.preventDefault()
      const name = input('#checkout-first').value.trim()
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
    form('#profile-form').addEventListener('submit', (event) => {
      event.preventDefault()
      state.setProfile({ name: input('#profile-name').value.trim() })
      if (event.currentTarget instanceof HTMLFormElement) event.currentTarget.reset()
      showAccount()
    })
  }

  function continueShopping() {
    all('dialog[open]', HTMLDialogElement).forEach((dialog) => dialog.close())
    resetFilters()
    $('#products').scrollIntoView({ behavior: 'auto' })
    $('#products-title').focus()
  }

  const info: Record<string, { title: string; html: string }> = {
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
    form('#contact-form').addEventListener('submit', (event) => {
      event.preventDefault()
      $('#contact-status').textContent =
        'Thank you for saying hello! Demo complete — no message was sent or saved.'
      if (event.currentTarget instanceof HTMLFormElement) event.currentTarget.reset()
    })
  }

  all('.catalog-tool', HTMLDetailsElement).forEach((tool) => {
    tool.addEventListener('toggle', () => {
      if (tool.open) {
        all('input, select', HTMLElement, tool)[0]?.focus()
        all('.catalog-tool', HTMLDetailsElement).forEach((other) => {
          if (other !== tool) other.open = false
        })
      }
    })
  })

  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    if (!target.closest('.catalog-tools'))
      all('.catalog-tool[open]', HTMLDetailsElement).forEach((tool) => {
        tool.open = false
      })
    const addButton = closest(target, '[data-add]')
    if (addButton?.dataset.add) addProduct(addButton.dataset.add)
    const productButton = closest(target, '[data-product]')
    if (productButton?.dataset.product) showProduct(productButton.dataset.product)
    const categoryLink = closest(target, '[data-category]')
    if (categoryLink && isCategory(categoryLink.dataset.category)) {
      filters.category = categoryLink.dataset.category
      filters.featured = false
      renderProducts()
      closeMenu()
    }
    const closeButton = closest(target, '[data-close-dialog]')
    if (closeButton) closeButton.closest('dialog')?.close()
    if (closest(target, '[data-continue-shopping]')) continueShopping()
    const infoButton = closest(target, '[data-info]')
    if (infoButton) {
      closeMenu()
      const key = infoButton.dataset.info
      if (key === 'contact') showContact()
      else if (key && Object.hasOwn(info, key)) openContent(info[key].title, info[key].html)
    }
  })

  $('#cart-content').addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const quantityButton = closest(target, '[data-quantity]')
    const removeButton = closest(target, '[data-remove]')
    if (quantityButton?.dataset.quantity) {
      const id = quantityButton.dataset.quantity
      const delta = Number(quantityButton.dataset.delta)
      const line = state.cart.find((item) => item.id === id)
      if (!line) return
      state.changeQuantity(id, delta)
      renderCartCount()
      renderCart()
      const next = [...all('[data-quantity]', HTMLButtonElement, $('#cart-content'))].find(
        (button) =>
          button.dataset.quantity === id &&
          Number(button.dataset.delta) === delta &&
          !button.disabled,
      )
      ;(next || $('#cart-content').querySelector('button'))?.focus()
    }
    if (removeButton?.dataset.remove) {
      const name = productById(removeButton.dataset.remove)?.name
      state.removeProduct(removeButton.dataset.remove)
      renderCartCount()
      renderCart()
      $('#cart-content').querySelector('button')?.focus()
      notify(`${name} removed from your bag.`)
    }
    if (target.closest('#checkout-button')) showCheckout()
  })

  $('#cart-button').addEventListener('click', showCart)
  $('#account-button').addEventListener('click', showAccount)
  $('#view-all').addEventListener('click', () =>
    resetFilters(
      !filters.featured &&
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
    if (!panel.hidden) input('#product-search').focus()
  })
  function updateSearch(input: HTMLInputElement) {
    filters.query = input.value
    filters.featured = false
    renderProducts()
  }
  input('#product-search').addEventListener('input', () => updateSearch(input('#product-search')))
  input('#catalog-search').addEventListener('input', () => updateSearch(input('#catalog-search')))
  $('#catalog-controls').addEventListener('submit', (event) => event.preventDefault())
  select('#category-select').addEventListener('change', () => {
    const value = select('#category-select').value
    if (!isCategory(value)) return
    filters.category = value
    filters.featured = false
    renderProducts()
  })
  select('#price-sort').addEventListener('change', () => {
    const value = select('#price-sort').value
    if (!isSortOrder(value)) return
    filters.sort = value
    filters.featured = false
    renderProducts()
  })
  $('#search-form').addEventListener('submit', (event) => {
    event.preventDefault()
    filters.query = input('#product-search').value
    filters.featured = false
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
    if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open]'))
      return
    const focusedTool = [...all('.catalog-tool[open]', HTMLDetailsElement)].find((tool) =>
      tool.contains(document.activeElement),
    )
    if (focusedTool) {
      event.preventDefault()
      focusedTool.open = false
      focusedTool.querySelector('summary')?.focus()
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
  form('#newsletter').addEventListener('submit', (event) => {
    event.preventDefault()
    $('#newsletter-status').textContent =
      'A little glow, just for you. Demo signup complete — no email was saved or sent.'
    if (event.currentTarget instanceof HTMLFormElement) event.currentTarget.reset()
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
