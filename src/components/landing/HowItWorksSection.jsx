import React from 'react'
import ScrollReveal from './ScrollReveal.jsx'
import { steps } from './landingData.js'

export default function HowItWorksSection() {
    return (
        <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
            <ScrollReveal>
                <div className="text-center mb-14">
                    <h2 className="text-3xl sm:text-4xl font-bold text-neutral-100">
                        How It <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Works</span>
                    </h2>
                    <p className="mt-3 text-neutral-400 max-w-lg mx-auto">Three simple steps from sign-up to seated.</p>
                </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {steps.map((step, i) => (
                    <ScrollReveal key={step.number} delay={i * 150}>
                        <div className="relative text-center">
                            {i < steps.length - 1 && (
                                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-white/10 to-transparent" />
                            )}
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-3xl mb-5">
                                {step.icon}
                            </div>
                            <div className="text-xs font-semibold text-emerald-400 tracking-widest uppercase mb-2">Step {step.number}</div>
                            <h3 className="text-xl font-semibold text-neutral-100 mb-2">{step.title}</h3>
                            <p className="text-sm text-neutral-400 max-w-xs mx-auto">{step.desc}</p>
                        </div>
                    </ScrollReveal>
                ))}
            </div>
        </section>
    )
}
