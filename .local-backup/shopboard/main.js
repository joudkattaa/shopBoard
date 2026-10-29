import './style.css'

const products = [
  { name: 'Aero Step Vortex', category: 'Running', price: 129, image: 'photo-1549298916-b41d501d3772', badge: 'BESTSELLER', rating: '4.8' },
  { name: 'Urban Pulse', category: 'Lifestyle', price: 145, image: 'photo-1543508282-6319a3e2621f', badge: '', rating: '4.9' },
  { name: 'Swift Flow', category: 'Training', price: 139, image: 'photo-1600185365926-3a2ce3cdb9eb', badge: 'NEW ARRIVAL', rating: '4.7' },
  { name: 'Court High', category: 'Basketball', price: 119, image: 'photo-1552346154-21d32810aba3', badge: 'THE COURT EDIT', rating: '4.8' },
  { name: 'Everyday Runner', category: 'Running', price: 124, image: 'photo-1539185441755-769473a23570', badge: '', rating: '4.9' },
]
document.querySelector('#product-grid').innerHTML = products.map((p, i) => `<article class="product-card" data-category="${p.category}"><div class="product-photo"><img src="https://images.unsplash.com/${p.image}?auto=format&fit=crop&w=600&q=85" alt="${p.name} sneakers" loading="lazy" width="600" height="600"/>${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}<button class="favorite" aria-label="Save ${p.name}" aria-pressed="false">♡</button><button class="add-button" data-index="${i}" aria-label="Add ${p.name} to bag">Add to bag <span>+</span></button></div><div class="product-info"><h3>${p.name}</h3><p>${p.category} essentials</p><div class="product-bottom"><strong>$${p.price}.00</strong><span class="rating">★ <span>${p.rating}</span></span><small>36–45</small></div></div></article>`).join('')
const bag = []
const dialog = document.querySelector('#bag-dialog')
const bagButton = document.querySelector('#bag-button')
let timer
function updateBag() {
  document.querySelector('#bag-count').textContent = bag.length
  bagButton.setAttribute('aria-label', `Open shopping bag, ${bag.length} items`)
  document.querySelector('#bag-items').replaceChildren(...bag.map(p => { const li = document.createElement('li'); li.textContent = `${p.name} — $${p.price.toFixed(2)}`; return li }))
  document.querySelector('#bag-total').textContent = bag.length ? `Total: $${bag.reduce((sum, p) => sum + p.price, 0).toFixed(2)}` : 'Your bag is empty.'
  document.querySelector('#clear-bag').disabled = !bag.length
}
function notify(message) {
  const status = document.querySelector('#bag-status')
  status.textContent = message
  clearTimeout(timer)
  timer = setTimeout(() => { status.textContent = '' }, 3500)
}
document.querySelectorAll('.add-button').forEach(button => button.addEventListener('click', () => { const p = products[button.dataset.index]; bag.push(p); updateBag(); notify(`${p.name} added to your bag.`) }))
document.querySelectorAll('.favorite').forEach(button => button.addEventListener('click', () => { const saved = button.getAttribute('aria-pressed') !== 'true'; button.setAttribute('aria-pressed', saved); button.textContent = saved ? '♥' : '♡'; notify(saved ? 'Added to your favorites for this visit.' : 'Removed from your favorites.') }))
bagButton.addEventListener('click', () => dialog.showModal())
document.querySelector('#close-bag').addEventListener('click', () => dialog.close())
document.querySelector('#clear-bag').addEventListener('click', () => { bag.length = 0; updateBag() })
updateBag()
let category = 'All'
const search = document.querySelector('#product-search')
function filterProducts() {
  let count = 0
  document.querySelectorAll('.product-card').forEach((card, i) => { card.hidden = (category !== 'All' && card.dataset.category !== category) || !`${products[i].name} ${products[i].category}`.toLowerCase().includes(search.value.trim().toLowerCase()); if (!card.hidden) count++ })
  document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', button.dataset.filter === category))
  document.querySelector('#filter-status').textContent = `${count} shoes shown${category === 'All' ? '' : ` in ${category}`}.`
  document.querySelector('#empty-state').hidden = count > 0
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; filterProducts() }))
document.querySelectorAll('[data-sport]').forEach(link => link.addEventListener('click', () => { category = link.dataset.sport; search.value = ''; filterProducts() }))
search.addEventListener('input', filterProducts)
document.querySelector('#show-all').addEventListener('click', () => { category = 'All'; search.value = ''; filterProducts() })
filterProducts()
document.querySelector('#registration-form').addEventListener('submit', event => { event.preventDefault(); document.querySelector('#form-status').textContent = 'You’re on the move! Demo complete — no details were saved.'; event.target.reset() })
