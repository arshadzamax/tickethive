import React from 'react'
import ScrollReveal from './ScrollReveal.tsx'
import { testimonials } from './landingData'

export default function TestimonialsSection() {
    return (
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
            <ScrollReveal>
                <div className="text-center mb-14">
                    <h2 className="text-3xl sm:text-4xl font-bold text-neutral-100">
                        Loved by{' '}
                        <span className="bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                            Organizers & Attendees
                        </span>
                    </h2>
                    <p className="mt-3 text-neutral-400 max-w-lg mx-auto">
                        Don't just take our word for it. Here's what people are saying.
                    </p>
                </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((t, i) => (
                    <ScrollReveal key={t.name} delay={i * 120}>
                        <div className="group relative h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] p-7 backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300">
                            {/* Quotation mark accent */}
                            <div className="absolute top-5 right-6 text-5xl font-serif text-white/[0.04] leading-none select-none">"</div>
                            
                            <p className="text-sm text-neutral-300 leading-relaxed italic mb-6 relative z-10">
                                "{t.quote}"
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 flex items-center justify-center text-sm font-bold text-emerald-300 border border-emerald-500/20">
                                    {t.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-neutral-200">{t.name}</div>
                                    <div className="text-xs text-neutral-500">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                ))}
            </div>
        </section>
    )
}
