import type { AppState } from '../state/state.types.ts'
import type { Category, SortOrder } from './products.types.ts'
import type { UIHelpers } from '../../shared/ui/ui.types.ts'
import {
  productById,
  findProducts,
  productCategories,
  isCategory,
  isSortOrder,
} from './products.logic.ts'

export function initializeCatalogLoading(
  state: AppState,
  renderProducts: () => void,
  document = globalThis.document,
  fetcher: typeof fetch = globalThis.fetch,
) {
  const status = document.querySelector('#catalog-status')
  const retry = document.querySelector('#catalog-retry')
  const grid = document.querySelector('#product-grid')
  const heading = document.querySelector('#products-title')
  if (!status || !retry || !grid || !('replaceChildren' in grid)) return
  const params = new URLSearchParams()
  if (import.meta.env?.DEV) {
    const pageQuery = new URLSearchParams(document.defaultView?.location.search ?? '')
    for (const key of ['delay', 'error', 'empty']) {
      const value = pageQuery.get('api-' + key)
      if (value) params.set(key, value)
    }
  }
  const query = params.size ? '?' + params.toString() : ''
  let restoreFocus = false
  function render() {
    if (!status || !retry || !grid) return
    const phase = state.catalogProductsStatus
    const pending = phase === 'idle' || phase === 'loading'
    grid.setAttribute('aria-busy', String(pending))
    retry.setAttribute('hidden', '')
    renderProducts()
    if (pending) status.textContent = 'Loading ROSEVEIL products?'
    else if (phase === 'error') {
      status.textContent = 'Unable to load products. Please try again.'
      retry.removeAttribute('hidden')
    } else
      status.textContent = state.catalogProducts.length
        ? ''
        : 'No products are available right now.'
    if (!pending && restoreFocus) {
      const target = phase === 'error' ? retry : heading
      if (target && 'focus' in target && typeof target.focus === 'function')
        target.focus({ preventScroll: true })
      restoreFocus = false
    }
  }
  retry.addEventListener('click', () => {
    if (state.catalogProductsStatus === 'loading') return
    restoreFocus = document.activeElement === retry
    void state.loadCatalogProducts(fetcher, query)
  })
  state.subscribeCatalogProducts(render)
  render()
  void state.loadCatalogProducts(fetcher, query)
}

export function initializeProductsUI(state: AppState, helpers: UIHelpers, closeMenu: () => void) {
  const { $, input, select, all, closest, icon, escape, formatMoney, productMedia, openContent } =
    helpers
  const filters: {
    category: Category | 'All'
    query: string
    sort: SortOrder
    featured: boolean
  } = { category: 'All', query: '', sort: 'default', featured: true }
  let renderedProductIds: string | undefined

  select('#category-select').innerHTML += productCategories
    .map((category) => `<option value="${category}">${category}</option>`)
    .join('')

  function renderProducts() {
    const ready = state.catalogProductsStatus === 'ready'
    const matches = ready
      ? findProducts(
          filters.category,
          filters.query,
          filters.featured,
          filters.sort,
          state.catalogProducts,
        )
      : []
    const productIds = matches.map((product) => product.id).join(',')
    // Keep existing nodes when a search/category change produces the same ordered products.
    if (productIds !== renderedProductIds) {
      $('#product-grid').innerHTML = matches
        .map(
          (product) =>
            `<article class="product-card"><button class="product-image-button" data-product="${product.id}" aria-label="View ${escape(product.name)}">${productMedia(product)}</button><div class="product-info"><p class="product-category">${escape(product.category)}</p><h3><button class="product-name" data-product="${product.id}">${escape(product.name)}</button></h3><p class="product-price">${formatMoney(product.price)}</p></div><button class="add-button" data-add="${product.id}" aria-label="Add ${escape(product.name)} to bag">${icon('bag')} ADD TO CART</button></article>`,
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
    $('#empty-state').hidden = !ready || state.catalogProducts.length === 0 || matches.length > 0
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

  function showProduct(id: string) {
    const product = productById(id, state.catalogProducts)
    if (!product) return
    openContent(
      product.name,
      `<div class="modal-product">${productMedia(product, 700)}<div><p class="eyebrow">${escape(product.category)}</p><p>${escape(product.description)}</p><p class="modal-price">${formatMoney(product.price)}</p><p>${escape(product.size)}</p><button class="button" data-add="${product.id}">${icon('bag')} ADD TO BAG</button><small>Illustrative product. Images and sizes are for this concept store. No real purchase or product claims.</small></div></div>`,
    )
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
    $('#search-panel').hidden = true
    $('#search-toggle').setAttribute('aria-expanded', 'false')
    $('#products').scrollIntoView({ behavior: 'auto' })
    $('#products-title').focus()
  })

  return {
    resetFilters,
    closeToolsOutside(target: Element) {
      if (!target.closest('.catalog-tools'))
        all('.catalog-tool[open]', HTMLDetailsElement).forEach((tool) => {
          tool.open = false
        })
    },
    closeHeaderSearchOutside(target: Element) {
      const panel = $('#search-panel')
      const toggle = $('#search-toggle')

      if (!panel.hidden && !panel.contains(target) && !toggle.contains(target)) {
        panel.hidden = true
        toggle.setAttribute('aria-expanded', 'false')
      }
    },
    handleClick(target: Element) {
      const productButton = closest(target, '[data-product]')
      if (productButton?.dataset.product) showProduct(productButton.dataset.product)
      const categoryLink = closest(target, '[data-category]')
      if (categoryLink && isCategory(categoryLink.dataset.category)) {
        filters.category = categoryLink.dataset.category
        filters.featured = false
        renderProducts()
        closeMenu()
      }
    },
    dismissSearch(event: KeyboardEvent) {
      const focusedTool = [...all('.catalog-tool[open]', HTMLDetailsElement)].find((tool) =>
        tool.contains(document.activeElement),
      )
      if (focusedTool) {
        event.preventDefault()
        focusedTool.open = false
        focusedTool.querySelector('summary')?.focus()
        return true
      }
      if (!$('#search-panel').hidden) {
        event.preventDefault()
        $('#search-panel').hidden = true
        $('#search-toggle').setAttribute('aria-expanded', 'false')
        $('#search-toggle').focus()
        return true
      }
      return false
    },
    startCatalog(onCatalogChange: () => void) {
      initializeCatalogLoading(state, () => {
        renderProducts()
        onCatalogChange()
      })
    },
  }
}
