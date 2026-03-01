import React, { useEffect, useState } from 'react'

export default function Toast() {
  const [msg, setMsg] = useState('')
  const [show, setShow] = useState(false)
  useEffect(() => {
    const handler = e => {
      setMsg(e.detail?.message || '')
      setShow(true)
      setTimeout(() => setShow(false), 2400)
    }
    window.addEventListener('th_toast', handler)
    return () => window.removeEventListener('th_toast', handler)
  }, [])
  if (!show) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 th-toast text-sm flex items-center gap-3">
      <div className="w-3 h-3 rounded-full bg-white/20" />
      <div className="text-neutral-100">{msg}</div>
    </div>
  )
}

