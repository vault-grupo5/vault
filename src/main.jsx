import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonte Manrope instalada pelo npm (@fontsource): vai junto no build do site,
// sem depender do Google Fonts. O navegador baixa só os caracteres que a página usa.
import '@fontsource-variable/manrope'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
