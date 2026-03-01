import React from 'react'
import ScrollReveal from './ScrollReveal.jsx'
import { features } from './landingData.js'

export default function FeaturesSection() {
    return (
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
            <ScrollReveal>
                <div className="text-center mb-14">
                    <h2 className="text-3xl sm:text-4xl font-bold text-neutral-100">
                        Built for <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Performance</span>
                    </h2>
                    <p className="mt-3 text-neutral-400 max-w-lg mx-auto">Enterprise-grade architecture with real-time capabilities at its core.</p>
                </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {features.map((f, i) => (
                    <ScrollReveal key={f.title} delay={i * 100}>
                        <div className="group relative h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 backdrop-blur-sm hover:bg-white/[0.05] hover:border-white/[0.14] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-black/20">
                            <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                            <div className="text-3xl mb-4">{f.icon}</div>
                            <h3 className="text-lg font-semibold text-neutral-100 mb-2">{f.title}</h3>
                            <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
                        </div>
                    </ScrollReveal>
                ))}
            </div>
        </section>
    )
}
