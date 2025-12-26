import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { logger } from '../../utils/logger';

export const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [gsapReady, setGsapReady] = useState(false);
  const containerRef = useRef(null);
  const priceValueRef = useRef(null);
  const initialRender = useRef(true);

  // Pricing constants
  const monthlyPrice = 15;
  const discountPercentage = 0.20;
  const discountedMonthlyPrice = Math.round(monthlyPrice * (1 - discountPercentage)); // 12
  const annualTotal = discountedMonthlyPrice * 12;

  // ✅ Lazy load GSAP to reduce initial bundle size
  useEffect(() => {
    let isMounted = true;

    const loadGSAP = async () => {
      try {
        const gsap = (await import('gsap')).default;
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);
        if (isMounted) {
          setGsapReady(true);
        }
      } catch (error) {
        logger.error('Failed to load GSAP:', error);
        if (isMounted) {
          setGsapReady(false);
        }
      }
    };

    loadGSAP();

    return () => {
      isMounted = false;
    };
  }, []);

  // GSAP Micro-interactions for hover
  const handleMouseEnter = async (e) => {
    if (!gsapReady) return;
    const gsap = (await import('gsap')).default;
    const isPro = e.currentTarget.classList.contains("bg-slate-900");
    
    gsap.to(e.currentTarget, {
      scale: 1.02,
      boxShadow: isPro 
        ? "0 0 60px -12px rgba(59,130,246,0.15)" // Premium glow on hover (reduced intensity by ~5%)
        : "0 25px 50px -12px rgba(0, 0, 0, 0.15)", // Standard deep shadow for light card
      duration: 0.4,
      ease: "power2.out"
    });
  };

  const handleMouseLeave = async (e) => {
    if (!gsapReady) return;
    const gsap = (await import('gsap')).default;
    const isPro = e.currentTarget.classList.contains("bg-slate-900");

    gsap.to(e.currentTarget, {
      scale: 1,
      boxShadow: isPro
         ? "0 0 40px -10px rgba(59,130,246,0.10)" // Resting state: very subtle glow (reduced)
         : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      duration: 0.4,
      ease: "power2.out"
    });
  };

  // Scroll Reveal
  useEffect(() => {
    if (!gsapReady || !containerRef.current) return;

    let ctx;
    
    const initAnimations = async () => {
      const gsap = (await import('gsap')).default;
      
      ctx = gsap.context(() => {
       gsap.fromTo(".pricing-card", 
        { y: 50, opacity: 0 },
        {
          y: 0, 
          opacity: 1, 
          duration: 0.6, 
          stagger: 0.1, 
          scrollTrigger: {
            trigger: ".pricing-grid",
            start: "top 80%"
          }
        }
       );
      }, containerRef);
    };

    initAnimations();

    return () => {
      if (ctx) ctx.revert();
    };
  }, [gsapReady]);

  // Price Number Animation
  useLayoutEffect(() => {
    if (!priceValueRef.current) return;

    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    const start = isAnnual ? monthlyPrice : discountedMonthlyPrice;
    const end = isAnnual ? discountedMonthlyPrice : monthlyPrice;
    const obj = { val: start };

    gsap.to(obj, {
        val: end,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: () => {
            if (priceValueRef.current) {
                priceValueRef.current.textContent = Math.round(obj.val).toString();
            }
        }
    });
  }, [isAnnual, monthlyPrice, discountedMonthlyPrice]);

  return (
    <section ref={containerRef} id="pricing" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple, transparent pricing.</h2>
          <p className="text-slate-600 mb-8">Invest in your future for less than the cost of a coffee.</p>
          
          {/* Toggle - Glassmorphism pill container */}
          <div className="inline-flex items-center justify-center gap-4 bg-white/60 backdrop-blur-xl border border-white/60 py-2.5 px-6 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group select-none">
            <span 
              className={`text-sm font-medium transition-colors duration-300 cursor-pointer ${!isAnnual ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-600'}`}
              onClick={() => setIsAnnual(false)}
            >
              Monthly
            </span>
            
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-8 rounded-full p-1 transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 cursor-pointer border active:scale-95 backdrop-blur-sm
                ${isAnnual 
                  ? 'bg-brand-100/50 border-brand-200 shadow-[inset_0_2px_6px_rgba(59,130,246,0.15)]' 
                  : 'bg-slate-200/40 border-slate-300/50 shadow-[inset_0_2px_6px_rgba(0,0,0,0.06)]'
                }
              `}
              aria-label="Toggle pricing interval"
            >
              <div 
                className={`w-6 h-6 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.05)] border border-white/80 bg-white
                transform transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] 
                ${isAnnual ? 'translate-x-6' : 'translate-x-0'} relative`}
              >
                {/* Specular highlight for glass feel */}
                <div className="absolute top-0.5 left-1 right-1 h-2 bg-gradient-to-b from-white to-transparent opacity-90 rounded-t-full"></div>
              </div>
            </button>

            <span 
              className={`text-sm font-medium transition-colors duration-300 cursor-pointer ${isAnnual ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-600'}`}
              onClick={() => setIsAnnual(true)}
            >
              Yearly <span className="text-brand-600 text-xs font-bold bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full ml-1">-20%</span>
            </span>
          </div>
        </div>

        <div className="pricing-grid grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Starter Plan */}
          <div 
            className="pricing-card bg-white p-8 rounded-3xl border border-slate-200 shadow-sm opacity-0 translate-y-10 origin-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
            <p className="text-slate-500 text-sm mb-6">Perfect for polishing your existing resume.</p>
            <div className="flex flex-col mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">$0</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 h-4">
                    Forever free
                </p>
            </div>
            
            <Link 
              to="/register"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl transition-colors mb-8 block text-center"
            >
              Get Started Free
            </Link>
            <ul className="space-y-4">
              {['Basic Resume Analysis', '1 Active Job Tracker', 'Limited Keyword Matching', 'Standard Templates'].map((feat) => (
                <li key={feat} className="flex items-center gap-3 text-slate-600 text-sm">
                  <Check size={16} className="text-slate-400" />
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div 
            className="pricing-card bg-slate-900 p-8 rounded-3xl border border-slate-800 relative overflow-hidden shadow-[0_0_40px_-10px_rgba(59,130,246,0.10)] opacity-0 translate-y-10 origin-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="absolute top-0 right-0 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
            <h3 className="text-xl font-bold text-white mb-2">Pro Career</h3>
            <p className="text-slate-400 text-sm mb-6">Full AI power to land your dream job.</p>
            
            <div className="flex flex-col mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white flex">
                    $
                    <span ref={priceValueRef}>
                      {isAnnual ? discountedMonthlyPrice : monthlyPrice}
                    </span>
                  </span>
                  <span className="text-slate-400">/month</span>
                </div>
                <div className="h-4 relative overflow-hidden mt-1">
                  <p 
                    key={isAnnual ? 'yearly' : 'monthly'}
                    className="text-xs text-slate-500 absolute top-0 left-0 animate-fade-in-up"
                  >
                    {isAnnual ? `$${annualTotal} billed yearly` : 'Billed monthly'}
                  </p>
                </div>
            </div>
            
             <Link 
               to="/register"
               className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors mb-8 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 block text-center"
             >
              Start 7-Day Trial
            </Link>
            <ul className="space-y-4">
              {['Unlimited AI Analysis', 'Unlimited Job Tracking', 'Semantic JD Matching', 'Cover Letter Generator', 'Interview Prep Notes'].map((feat) => (
                <li key={feat} className="flex items-center gap-3 text-slate-300 text-sm">
                  <div className="bg-brand-500/20 p-0.5 rounded-full">
                    <Check size={14} className="text-brand-400" />
                  </div>
                  {feat}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
};

