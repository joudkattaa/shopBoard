import './style.css'
import './theme.css'
import './responsive.css'
import { createState } from './state.ts'
import { initializeUI } from './ui.ts'

const state = createState()
initializeUI(state)
