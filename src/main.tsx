import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import './tool-overrides.css'
import './newsletter-overrides.css'
import './audio-downloader.css'
import './media.css'
import './navigation-overrides.css'
import './fixed-header.css'
import './ebooks.css'
import './website-creation.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
