import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight, FileText } from 'lucide-react';
import { ICON_SIZES, ICON_STROKE_WIDTH } from '../../constants/icons';

export const LandingHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const lastScrollY = useRef(0);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleToggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const handleCloseMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    // Initialize lastScrollY to current position to prevent wrong direction detection on initial scroll
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY.current;
      const isScrolledPastHeader = currentScrollY > 100;

      // Update styled state
      setScrolled(currentScrollY > 20);

      // Smart hide/show logic with GSAP
      if (isScrollingDown && isScrolledPastHeader && !mobileMenuOpen) {
        gsap.to(header, {
          y: '-100%',
          duration: 0.3,
          ease: 'power2.out',
          overwrite: true
        });
      } else {
        gsap.to(header, {
          y: '0%',
          duration: 0.3,
          ease: 'power2.out',
          overwrite: true
        });
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <header 
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        scrolled 
          ? 'bg-background/75 backdrop-blur-md border-border/60 py-3 shadow-sm supports-[backdrop-filter]:bg-background/60' 
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer select-none">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 p-2">
            <FileText className="h-8 w-8 text-primary" strokeWidth={ICON_STROKE_WIDTH.normal} />
          </div>
          <span className="h4 text-foreground">ResumeCraft</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Log in
          </Link>
          <Link 
            to="/register" 
            className="group flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            Get Started
            <ArrowRight className={`${ICON_SIZES.sm} group-hover:translate-x-1 transition-transform`} strokeWidth={ICON_STROKE_WIDTH.normal} />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-foreground"
          onClick={handleToggleMobileMenu}
        >
          {mobileMenuOpen ? <X className={ICON_SIZES.lg} strokeWidth={ICON_STROKE_WIDTH.normal} /> : <Menu className={ICON_SIZES.lg} strokeWidth={ICON_STROKE_WIDTH.normal} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-background border-b border-border shadow-xl p-6 flex flex-col gap-4 md:hidden animate-fade-in-up origin-top">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="h5 text-foreground py-2 border-b border-border"
              onClick={handleCloseMobileMenu}
            >
              {link.name}
            </a>
          ))}
          <div className="flex flex-col gap-3 mt-4">
            <Link 
              to="/login" 
              className="w-full py-3 text-center text-foreground font-medium border border-border rounded-xl"
              onClick={handleCloseMobileMenu}
            >
              Log in
            </Link>
            <Link 
              to="/register" 
              className="w-full py-3 text-center bg-primary text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/20"
              onClick={handleCloseMobileMenu}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

