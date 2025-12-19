import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingHeader } from '../components/layout/LandingHeader';
import { LandingFooter } from '../components/layout/LandingFooter';
import { Hero } from '../components/sections/Hero';
import { BentoGrid } from '../components/sections/BentoGrid';
import { Features } from '../components/sections/Features';
import { Testimonials } from '../components/sections/Testimonials';
import { Pricing } from '../components/sections/Pricing';
import { FAQ } from '../components/sections/FAQ';
import { useAuth } from '../contexts/AuthContext';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

// Lazy load GSAP to reduce initial bundle size
const loadGSAP = async () => {
  const gsap = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  gsap.default.registerPlugin(ScrollTrigger);
  return gsap.default;
};

export const LandingPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [gsapLoaded, setGsapLoaded] = useState(false);

  // Lazy load GSAP when component mounts
  useEffect(() => {
    loadGSAP().then(() => {
      setGsapLoaded(true);
    });
  }, []);

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
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-background">
      <LandingHeader />
      <main className="flex-grow">
        <ErrorBoundary fallback={<div className="p-8 text-center text-muted-foreground">Hero section unavailable</div>}>
          <Hero gsapReady={gsapLoaded} />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div className="p-8 text-center text-muted-foreground">Features section unavailable</div>}>
          <BentoGrid />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div className="p-8 text-center text-muted-foreground">Features section unavailable</div>}>
          <Features />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div className="p-8 text-center text-muted-foreground">Testimonials section unavailable</div>}>
          <Testimonials />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div className="p-8 text-center text-muted-foreground">Pricing section unavailable</div>}>
          <Pricing />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div className="p-8 text-center text-muted-foreground">FAQ section unavailable</div>}>
          <FAQ />
        </ErrorBoundary>
      </main>
      <LandingFooter />
    </div>
  );
};
