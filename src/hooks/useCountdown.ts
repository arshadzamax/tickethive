import { useEffect, useRef, useState } from 'react'

export function useCountdown(target, onExpire) {
  const [now, setNow] = useState(Date.now())
  const expiredRef = useRef(false)
  useEffect(() => {
    expiredRef.current = false
  }, [target])
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  // coerce target to a numeric millisecond value if it's a Date or string
  let targetMs = 0
  if (target instanceof Date) {
    targetMs = target.getTime()
  } else if (typeof target === 'string' || typeof target === 'number') {
    // string might be ISO timestamp
    targetMs = Number(target)
    if (isNaN(targetMs) && typeof target === 'string') {
      targetMs = new Date(target).getTime()
    }
  }
  const msLeft = Math.max(0, (targetMs || 0) - now)
  const secondsLeft = Math.floor(msLeft / 1000)
  useEffect(() => {
    if (target && msLeft <= 0 && !expiredRef.current) {
      expiredRef.current = true
      if (onExpire) onExpire()
    }
  }, [msLeft, target, onExpire])
  return { secondsLeft }
}

