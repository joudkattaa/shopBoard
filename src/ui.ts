import type { AppState, Theme } from './modules/state/state.types.ts'
import type { Product } from './modules/products/products.types.ts'
import { cartTotals } from './modules/cart/cart.logic.ts'
import { initializeCartUI } from './modules/cart/cart.ui.ts'
import { initializeProductsUI } from './modules/products/products.ui.ts'

const formatMoney = (cents: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)

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
    return `<img src="${base}.webp" srcset="${base}-240.webp 240w, ${base}-480.webp 480w, ${base}-800.webp 800w, ${base}.webp 1254w" sizes="${sizes}" alt="${escape(product.name)}" width="${size}" height="${size}" loading="${size === 600 ? 'lazy' : 'eager'}" decoding="async">`
  }
  let toastTimer: ReturnType<typeof setTimeout> | undefined

  function notify(message: string) {
    clearTimeout(toastTimer)
    $('#toast').textContent = message
    toastTimer = setTimeout(() => {
      $('#toast').textContent = ''
    }, 3800)
  }

  function openContent(title: string, html: string) {
    $('#content-title').textContent = title
    $('#content-body').innerHTML = html
    if (!dialog('#content-dialog').open) dialog('#content-dialog').showModal()
    $('#content-title').focus()
  }

  const helpers = {
    $,
    input,
    select,
    dialog,
    all,
    closest,
    icon,
    escape,
    formatMoney,
    productMedia,
    openContent,
    notify,
  }
  const cartUI = initializeCartUI(state, helpers)
  const productsUI = initializeProductsUI(state, helpers, closeMenu)

  function showAccount() {
    if (state.profile) {
      openContent(
        'Your beauty space',
        `<p>Welcome back, <strong>${escape(state.profile.name)}</strong>. Your demo profile is available for this visit. Your shopping bag has ${cartTotals(state.bag.items, '', state.catalogProducts).count} items.</p><button class="button" id="profile-shop">EXPLORE THE COLLECTION</button><button class="text-button" id="profile-reset">Clear my demo profile</button>`,
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
    productsUI.resetFilters()
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

  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    productsUI.closeToolsOutside(target)
    productsUI.closeHeaderSearchOutside(target)
    cartUI.handleAdd(target)
    productsUI.handleClick(target)
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

  $('#account-button').addEventListener('click', showAccount)
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
    if (productsUI.dismissSearch(event)) return
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

  cartUI.renderCartCount()
  productsUI.startCatalog(() => cartUI.refreshCatalog())
}
