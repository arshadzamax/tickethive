import React from 'react'
import { useCountdown } from '../../hooks/useCountdown'

export default function CountdownTimer({
  target,
  onExpire,
}: {
  target?: string | number | Date | null
  onExpire?: () => void
}) {
  const { secondsLeft } = useCountdown(target, onExpire)
  if (!target) return null
  const m = Math.floor(secondsLeft / 60)
  const s = Math.max(0, secondsLeft % 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div className="text-sm text-yellow-300">{pad(m)}:{pad(s)}</div>
  )
}

