import React from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import createAppStore from './store.js'
import { useSeatSocketInit } from '../hooks/useSeatSocket.js'

const store = createAppStore()

function SocketInitializer({ children }) {
  useSeatSocketInit()
  return children
}

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <SocketInitializer>{children}</SocketInitializer>
      </BrowserRouter>
    </Provider>
  )
}
