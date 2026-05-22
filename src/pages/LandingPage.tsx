import React from 'react'

import CursorGlow from '../components/landing/CursorGlow.tsx'
import LandingNav from '../components/landing/LandingNav.tsx'
import HeroSection from '../components/landing/HeroSection.tsx'
import BookingTicker from '../components/landing/BookingTicker.tsx'
import FeaturesSection from '../components/landing/FeaturesSection.tsx'
import HowItWorksSection from '../components/landing/HowItWorksSection.tsx'
import TestimonialsSection from '../components/landing/TestimonialsSection.tsx'
import LiveEventsSection from '../components/landing/LiveEventsSection.tsx'
import PortalSection from '../components/landing/PortalSection.tsx'
import LandingFooter from '../components/landing/LandingFooter.tsx'

export default function LandingPage() {

    return (
        <div className="min-h-screen bg-[#060a14] text-neutral-100 overflow-hidden">
            <CursorGlow />

            {/* Animated background orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <div className="landing-orb landing-orb-1" />
                <div className="landing-orb landing-orb-2" />
                <div className="landing-orb landing-orb-3" />
            </div>

            <LandingNav />
            <HeroSection />
            <BookingTicker />
            <FeaturesSection />
            <HowItWorksSection />
            <TestimonialsSection />
            <LiveEventsSection />
            <PortalSection />
            <LandingFooter />
        </div>
    )
}
