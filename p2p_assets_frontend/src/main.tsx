import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'
import tciLogo from './assets/TCI_Logo.jpg'

// Set favicon from bundled asset (Vite rewrites with base /aiml/p2p_assetapp/ so it works in live)
const link = document.querySelector<HTMLLinkElement>('link#favicon') ?? document.querySelector<HTMLLinkElement>('link[rel="icon"]')
if (link) {
  link.rel = 'icon'
  link.type = 'image/jpeg'
  link.href = tciLogo
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
