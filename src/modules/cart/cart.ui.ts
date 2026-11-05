import type { AppState } from '../state/state.types.ts'
import type { UIHelpers } from '../../shared/ui/ui.types.ts'
import { productById } from '../products/products.logic.ts'
import { cartTotals } from './cart.logic.ts'

export function initializeCartUI(state: AppState, helpers: UIHelpers) {
  const {
    $,
    input,
    dialog,
    all,
    closest,
    icon,
    escape,
    formatMoney,
    productMedia,
    openContent,
    notify,
  } = helpers
  function renderCartCount() {
    const count = state.bag.items.reduce((sum, item) => sum + item.quantity, 0)
    $('#cart-count').textContent = String(count)
    $('#cart-heading-count').textContent = count ? `(${count})` : ''
    $('#cart-button').setAttribute(
      'aria-label',
      `Open shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`,
    )
  }

  function addProduct(id: string) {
    const product = productById(id, state.catalogProducts)
    if (!product) return
    const existing = state.bag.items.find((item) => item.id === id)
    if (existing?.quantity === 99) {
      notify('You’ve reached the limit of 99 for this item.')
      return
    }
    state.bag.addProduct(id)
    renderCartCount()
    notify(`${escape(product.name)} added to your bag.`)
  }

  function renderCart(focusAction?: string) {
    const clearBagButton = `<button id="clear-bag" class="cart-clear" type="button">${icon('close')}<span>Clear Bag</span></button>`
    if (state.bag.items.length && !state.catalogProducts.length) {
      $('#cart-content').innerHTML =
        `<p>Product prices are unavailable. Your saved bag is safe. Please retry loading the collection.</p>${clearBagButton}`
      return
    }
    const totals = cartTotals(state.bag.items, state.bag.promoCode, state.catalogProducts)
    if (!state.bag.items.length) {
      $('#cart-content').innerHTML =
        `<div class="cart-empty">${icon('bag')}<h3>Your next little luxury awaits.</h3><p>Your shopping bag is empty. Find something you’ll love.</p><button class="button" data-continue-shopping>EXPLORE THE COLLECTION</button></div>`
      return
    }
    const toFreeShipping = Math.max(0, 5001 - totals.merchandise)
    $('#cart-content').innerHTML =
      `<div class="shipping-note">${toFreeShipping ? `Add ${formatMoney(toFreeShipping)} more after discounts for free shipping.` : 'Lovely! Your bag qualifies for free shipping.'}<div class="shipping-progress"><span style="width:${Math.min(100, (totals.merchandise / 5001) * 100)}%"></span></div></div><ul class="cart-lines">${state.bag.items
        .map((item) => {
          const product = productById(item.id, state.catalogProducts)
          if (!product) return ''
          return `<li class="cart-line">${productMedia(product, 70)}<div><h3>${escape(product.name)}</h3><p>${formatMoney(product.price)} · ${escape(product.size)}</p><div class="quantity"><button data-quantity="${item.id}" data-delta="-1" aria-label="Decrease quantity of ${escape(product.name)}">−</button><span aria-label="Quantity">${item.quantity}</span><button data-quantity="${item.id}" data-delta="1" aria-label="Increase quantity of ${escape(product.name)}" ${item.quantity >= 99 ? 'disabled' : ''}>+</button></div></div><div><p class="cart-line-total">${formatMoney(product.price * item.quantity)}</p><button class="remove-line" data-remove="${item.id}" aria-label="Remove ${escape(product.name)}">Remove</button></div></li>`
        })
        .join(
          '',
        )}</ul>${clearBagButton}<form id="promo-form" class="promo-form"><label for="promo-code">Have a little treat? Enter your code.</label><div class="search-row"><input id="promo-code" name="promo" placeholder="GLOW20" value="${state.bag.promoCode}" maxlength="20" autocomplete="off"><button class="button secondary" type="submit">${state.bag.promoCode ? 'REMOVE' : 'APPLY'}</button></div><p id="promo-status" class="form-status" role="status">${state.bag.promoCode ? 'GLOW20 applied — enjoy 20% off your items.' : ''}</p></form><div class="cart-totals"><div><span>Subtotal</span><span>${formatMoney(totals.subtotal)}</span></div>${totals.discount ? `<div><span>GLOW20 · 20% off</span><span>−${formatMoney(totals.discount)}</span></div>` : ''}<div><span>Demo shipping</span><span>${totals.shipping ? formatMoney(totals.shipping) : 'FREE'}</span></div><div class="grand-total"><span>Total</span><span>${formatMoney(totals.total)}</span></div></div><button class="button cart-checkout" id="checkout-button">DEMO CHECKOUT ${icon('arrow')}</button><p class="cart-demo">A concept store. No payment is collected or real order placed.</p>`
    $('#promo-form').addEventListener('submit', (event) => {
      event.preventDefault()
      if (state.bag.promoCode) {
        state.bag.setPromoCode('')
        renderCartCount()
        renderCart('promo')
        return
      }
      const entered = input('#promo-code').value.trim().toUpperCase()
      if (entered !== 'GLOW20') {
        $('#promo-status').textContent = 'That code isn’t available. Try GLOW20 for 20% off.'
        return
      }
      state.bag.setPromoCode('GLOW20')
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
    if (!state.bag.items.length || !state.catalogProducts.length) return
    const totals = cartTotals(state.bag.items, state.bag.promoCode, state.catalogProducts)
    dialog('#cart-dialog').close()
    openContent(
      'A little glow is on its way.',
      `<p>Review your demo bag: ${totals.count} ${totals.count === 1 ? 'item' : 'items'} · <strong>${formatMoney(totals.total)}</strong> including demo shipping. This form completes a demonstration only. No payment or delivery will take place.</p><form id="checkout-form" class="form-stack"><div class="field-row"><div><label for="checkout-first">First name</label><input id="checkout-first" name="first" autocomplete="given-name" required maxlength="80"></div><div><label for="checkout-last">Last name</label><input id="checkout-last" name="last" autocomplete="family-name" required maxlength="80"></div></div><label for="checkout-email">Email address</label><input id="checkout-email" name="email" type="email" autocomplete="email" required maxlength="254"><button class="button" type="submit">COMPLETE DEMO ORDER ${icon('arrow')}</button><p class="cart-demo">Details are not saved or sent. No card information required.</p></form>`,
    )
    $('#checkout-form').addEventListener('submit', (event) => {
      event.preventDefault()
      const name = input('#checkout-first').value.trim()
      state.bag.clearCart()
      renderCartCount()
      openContent(
        'A beautiful little moment.',
        `<div class="confirmation">${icon('gift')}<h3>Thank you${name ? `, ${escape(name)}` : ''}!</h3><p>Your demo order is complete. No order was placed, no payment was taken, and your details were not saved.</p><button class="button" data-continue-shopping>CONTINUE EXPLORING</button></div>`,
      )
    })
  }

  $('#cart-content').addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest('#clear-bag')) {
      state.bag.clearCart()
      renderCartCount()
      renderCart()
      $('#cart-title').focus()
      notify('Your bag is now empty.')
      return
    }
    const quantityButton = closest(target, '[data-quantity]')
    const removeButton = closest(target, '[data-remove]')
    if (quantityButton?.dataset.quantity) {
      const id = quantityButton.dataset.quantity
      const delta = Number(quantityButton.dataset.delta)
      const line = state.bag.items.find((item) => item.id === id)
      if (!line) return
      state.bag.changeQuantity(id, delta)
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
      const name = productById(removeButton.dataset.remove, state.catalogProducts)?.name
      state.bag.removeProduct(removeButton.dataset.remove)
      renderCartCount()
      renderCart()
      $('#cart-content').querySelector('button')?.focus()
      notify(`${name} removed from your bag.`)
    }
    if (target.closest('#checkout-button')) showCheckout()
  })

  $('#cart-button').addEventListener('click', showCart)

  return {
    renderCartCount,
    refreshCatalog() {
      renderCartCount()
      if (dialog('#cart-dialog').open) renderCart()
    },
    handleAdd(target: Element) {
      const button = closest(target, '[data-add]')
      if (button?.dataset.add) addProduct(button.dataset.add)
    },
  }
}
