import React from 'react'

import CursorGlow from '../components/landing/CursorGlow.jsx'
import LandingNav from '../components/landing/LandingNav.jsx'
import HeroSection from '../components/landing/HeroSection.jsx'
import BookingTicker from '../components/landing/BookingTicker.jsx'
import FeaturesSection from '../components/landing/FeaturesSection.jsx'
import HowItWorksSection from '../components/landing/HowItWorksSection.jsx'
import TestimonialsSection from '../components/landing/TestimonialsSection.jsx'
import LiveEventsSection from '../components/landing/LiveEventsSection.jsx'
import PortalSection from '../components/landing/PortalSection.jsx'
import LandingFooter from '../components/landing/LandingFooter.jsx'

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
