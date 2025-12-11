import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LandingHeader } from '../components/layout/LandingHeader';
import { LandingFooter } from '../components/layout/LandingFooter';
import { Hero } from '../components/sections/Hero';
import { BentoGrid } from '../components/sections/BentoGrid';
import { Features } from '../components/sections/Features';
import { Testimonials } from '../components/sections/Testimonials';
import { Pricing } from '../components/sections/Pricing';
import { FAQ } from '../components/sections/FAQ';
import { useAuth } from '../contexts/AuthContext';

// Register GSAP plugins once at the app root
gsap.registerPlugin(ScrollTrigger);

export const LandingPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Don't render landing page if authenticated (will redirect)
  if (loading || isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-slate-50">
      <LandingHeader />
      <main className="flex-grow">
        <Hero />
        <BentoGrid />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>
      <LandingFooter />
    </div>
  );
};
