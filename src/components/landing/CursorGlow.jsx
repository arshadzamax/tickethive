import React, { useRef, useEffect } from 'react'

export default function CursorGlow() {
    const ref = useRef(null)

    useEffect(() => {
        const handler = (e) => {
            if (ref.current) {
                ref.current.style.background =
                    `radial-gradient(650px circle at ${e.clientX}px ${e.clientY}px, rgba(6,182,212,0.06), transparent 40%)`
            }
        }
        window.addEventListener('mousemove', handler)
        return () => window.removeEventListener('mousemove', handler)
    }, [])

    return (
        <div
            ref={ref}
            className="pointer-events-none fixed inset-0 z-30 hidden lg:block"
        />
    )
}
