import './style.css'

const dialog = document.querySelector('#project-dialog')
const title = document.querySelector('#dialog-title')
const content = document.querySelector('#dialog-content')
const projects = {
  noire: { name: 'Noiré Cosmetics', art: 'art-noire', category: 'Branding · Packaging', description: 'A bold beauty brand with timeless elegance and edge. Deep burgundy, refined serif typography, and black packaging create a distinctive visual identity.' },
  elysium: { name: 'Elysium Studio', art: 'art-elysium', category: 'Branding · Web Design', description: 'A delicate floral identity expressed through soft blush stationery, considered typography, and an elegant digital direction.' },
  vellora: { name: 'Vellora Jewelry', art: 'art-vellora', category: 'Branding · E-commerce', description: 'A rich burgundy and gold visual world built around the beauty of fine details. An expressive identity for a contemporary jewelry concept.' },
  aurea: { name: 'Aurea Wellness', art: 'art-aurea', category: 'Branding · Web Design', description: 'A wellness brand concept that promotes balance, beauty, and self-care. Warm blush tones and minimal packaging create a calm, considered identity.' },
}
function openDialog(heading, markup) {
  title.textContent = heading
  content.innerHTML = markup
  dialog.showModal()
}
function openProject(key) {
  const project = projects[key]
  openDialog(project.name, `<p class="eyebrow">${project.category}</p><div class="project-image ${project.art}" role="img" aria-label="${project.name} visual identity"></div><p>${project.description}</p><p style="margin-top:16px">Illustrative brand concept with AI-generated campaign photography.</p>`)
}
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close())
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close() } })
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => openProject(button.dataset.project)))
document.querySelectorAll('.project').forEach((link, index) => link.addEventListener('click', event => { event.preventDefault(); openProject(Object.keys(projects)[index]) }))
const aboutButton = document.querySelector('#about-more')
aboutButton.setAttribute('aria-expanded', 'false')
aboutButton.setAttribute('aria-controls', 'about-expanded')
aboutButton.addEventListener('click', () => {
  const paragraph = document.querySelector('#about-expanded')
  paragraph.hidden = !paragraph.hidden
  aboutButton.setAttribute('aria-expanded', String(!paragraph.hidden))
  aboutButton.innerHTML = `${paragraph.hidden ? 'MORE ABOUT ME' : 'LESS ABOUT ME'} <span>→</span>`
})
document.querySelector('#show-cases').addEventListener('click', event => {
  const cases = document.querySelector('#extra-cases')
  cases.hidden = !cases.hidden
  event.currentTarget.setAttribute('aria-expanded', String(!cases.hidden))
})
document.querySelector('#start-project').addEventListener('click', () => {
  openDialog('Let’s create something beautiful.', `<p>Tell me a little about your project. This is a demo inquiry form; your information is not sent or saved.</p><form class="inquiry-form"><label for="name">YOUR NAME</label><input id="name" name="name" autocomplete="name" required maxlength="100"><label for="email">EMAIL ADDRESS</label><input id="email" name="email" type="email" autocomplete="email" required maxlength="254"><label for="message">YOUR PROJECT</label><textarea id="message" name="message" required maxlength="3000"></textarea><button class="button" type="submit">SEND DEMO INQUIRY <span>→</span></button><p role="status" id="inquiry-status"></p></form>`)
  content.querySelector('form').addEventListener('submit', event => {
    event.preventDefault()
    content.querySelector('#inquiry-status').textContent = 'Thank you! Demo inquiry complete. No information was sent or saved.'
    event.target.reset()
  })
})
document.querySelectorAll('[data-legal]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.legal === 'privacy') openDialog('Privacy policy', '<p>This concept portfolio has no analytics, accounts, or server-side form submission. Information entered into the demo inquiry form is not saved or sent. Google Fonts may receive a request from your browser to load the typefaces.</p>')
  else openDialog('Terms & conditions', '<p>This is an illustrative portfolio based on a supplied design reference. The studio profile, experience figures, contact information, and projects are demo content. The website does not establish a service agreement or accept payments.</p>')
}))
