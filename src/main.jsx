import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Providers from './app/providers.jsx'

const root = createRoot(document.getElementById('root'))
root.render(
  <Providers>
    <App />
  </Providers>
)

