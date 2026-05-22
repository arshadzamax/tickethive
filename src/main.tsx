import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Providers from './app/providers.tsx'

const root = createRoot(document.getElementById('root')!)
root.render(
  <Providers>
    <App />
  </Providers>
)

