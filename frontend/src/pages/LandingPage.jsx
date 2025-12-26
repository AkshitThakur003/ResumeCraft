import React, { useEffect } from 'react';
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
import { ErrorBoundary } from '../components/ui';

// ✅ Lazy load GSAP - components will handle their own GSAP loading
// This reduces initial bundle size and improves page load time

export const LandingPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard (non-blocking)
  useEffect(() => {
    // Only redirect if we're sure user is authenticated (after check completes)
    // Don't wait for loading to complete - render page immediately
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // ✅ Render immediately - don't wait for auth check
  // Auth check happens in background via AuthContext
  // If user is authenticated, redirect will happen after check completes
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-background">
      <LandingHeader />
      <main className="flex-grow">
        <ErrorBoundary fallback={<div className="p-8 text-center text-muted-foreground">Hero section unavailable</div>}>
          <Hero gsapReady={true} />
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
