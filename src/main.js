import './style.css'
import './theme.css'
import { createState } from './state.js'
import { initializeUI } from './ui.js'

const state = createState()
initializeUI(state)
