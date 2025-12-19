import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Sparkles, FileText, Target, TrendingUp, Bot } from 'lucide-react';
import { logger } from '../../utils/logger';

export const Hero = ({ gsapReady: externalGsapReady }) => {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const textRef = useRef(null);
  const buttonsRef = useRef(null);
  const featuresRef = useRef(null);
  const visualRef = useRef(null);
  const [gsapReady, setGsapReady] = useState(false);

  // Lazy load GSAP if not provided externally
  useEffect(() => {
    if (externalGsapReady) {
      setGsapReady(true);
      return;
    }

    let isMounted = true;

    const loadGSAP = async () => {
      try {
        const gsap = await import('gsap');
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
  }, [externalGsapReady]);

  useEffect(() => {
    if (!gsapReady || !containerRef.current) return;

    let ctx;

    const initAnimations = async () => {
      const gsap = (await import('gsap')).default;
      
      ctx = gsap.context(() => {
      // 1. Initial Staggered Reveal
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Reveal Title Lines (simulating SplitText)
      tl.fromTo(".hero-title-line", 
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.15 }
      )
      // Reveal Subtext
      .fromTo(textRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.6"
      )
      // Reveal Buttons
      .fromTo(buttonsRef.current?.children || [],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
        "-=0.6"
      )
      // Reveal Feature Checks
      .fromTo(featuresRef.current?.children || [],
        { x: -10, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.05 },
        "-=0.4"
      )
      // Reveal Right Visual - Refined Premium Entrance
      .fromTo(visualRef.current,
        { 
          y: 100, 
          opacity: 0, 
          scale: 0.85, 
          rotation: 5, 
          transformOrigin: "center center",
          xPercent: -2,
          filter: "blur(12px)"
        },
        { 
          y: 0, 
          opacity: 1, 
          scale: 1.05, 
          rotation: 0, 
          xPercent: -2,
          filter: "blur(0px)",
          duration: 1.8, 
          ease: "power3.out" 
        },
        "-=0.8"
      );

      // 2. Continuous Floating Animation for Visual Elements
      gsap.to(".floating-card", {
        y: -15,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: {
          each: 1,
          from: "random"
        }
      });
      
      // 3. Background Particles Float
      gsap.utils.toArray(".bg-particle").forEach((particle) => {
        gsap.to(particle, {
          y: "random(-40, 40)",
          x: "random(-20, 20)",
          duration: "random(4, 8)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: "random(0, 5)"
        });
      });

      // 4. Background Gradient Blobs Animation (New)
      gsap.to(".hero-blob-1", {
        x: "random(-50, 50)",
        y: "random(-30, 30)",
        scale: "random(0.9, 1.1)",
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      gsap.to(".hero-blob-2", {
        x: "random(-50, 50)",
        y: "random(-30, 30)",
        scale: "random(0.9, 1.1)",
        duration: 12,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1
      });

      }, containerRef);

      return ctx;
    };

    initAnimations().then(animationCtx => {
      ctx = animationCtx;
    });

    return () => {
      if (ctx) ctx.revert();
    };
  }, [gsapReady]);

  return (
    <section ref={containerRef} className="relative pt-32 pb-20 lg:pt-48 lg:pb-40 overflow-hidden">
      {/* Subtle Geometric Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,white_60%,transparent_100%)] opacity-40 -z-30 pointer-events-none"></div>

      {/* Background Elements - Animated */}
      <div className="hero-blob-1 absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-200/40 rounded-full blur-[120px] -z-10 opacity-60 pointer-events-none"></div>
      <div className="hero-blob-2 absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-200/30 rounded-full blur-[120px] -z-10 opacity-50 pointer-events-none"></div>

      {/* Animated Waves - Refined & Organic */}
      <div className="absolute bottom-0 left-0 w-full h-auto overflow-hidden -z-20 pointer-events-none">
        
        {/* Wave 1 - Slowest (Back) */}
        <div className="relative w-[200%] h-32 sm:h-48 animate-wave-slower flex opacity-30">
           <svg className="w-1/2 h-full fill-brand-100" viewBox="0 0 1440 320" preserveAspectRatio="none">
             <path d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
           </svg>
           <svg className="w-1/2 h-full fill-brand-100" viewBox="0 0 1440 320" preserveAspectRatio="none">
             <path d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
           </svg>
        </div>

        {/* Wave 2 - Medium Speed (Middle) */}
        <div className="absolute bottom-0 left-0 w-[200%] h-32 sm:h-48 animate-wave-slow flex opacity-40 -translate-x-[200px]">
           <svg className="w-1/2 h-full fill-brand-50" viewBox="0 0 1440 320" preserveAspectRatio="none">
             <path d="M0,256L48,245.3C96,235,192,213,288,192C384,171,480,149,576,160C672,171,768,213,864,224C960,235,1056,213,1152,192C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
           </svg>
           <svg className="w-1/2 h-full fill-brand-50" viewBox="0 0 1440 320" preserveAspectRatio="none">
             <path d="M0,256L48,245.3C96,235,192,213,288,192C384,171,480,149,576,160C672,171,768,213,864,224C960,235,1056,213,1152,192C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
           </svg>
        </div>

        {/* Wave 3 - Faster (Front) */}
        <div className="absolute bottom-0 left-0 w-[200%] h-32 sm:h-48 animate-wave flex opacity-20 translate-y-2">
           <svg className="w-1/2 h-full fill-purple-100" viewBox="0 0 1440 320" preserveAspectRatio="none">
             <path d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,133.3C672,139,768,181,864,186.7C960,192,1056,160,1152,144C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
           </svg>
           <svg className="w-1/2 h-full fill-purple-100" viewBox="0 0 1440 320" preserveAspectRatio="none">
             <path d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,133.3C672,139,768,181,864,186.7C960,192,1056,160,1152,144C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
           </svg>
        </div>
      </div>

      {/* CSS-based Floating Decorative Elements (Parallax feel) - Refined for subtlety */}
      
      {/* 1. Top Left: Glassy Rounded Square - Slower */}
      <div 
        className="absolute top-[15%] left-[10%] w-16 h-16 rounded-2xl border border-brand-200/20 bg-white/5 backdrop-blur-[1px] rotate-[15deg] animate-float-slow -z-10 pointer-events-none" 
        style={{ animationDuration: '25s' }}
      ></div>

      {/* 2. Top Right: Blurred Gradient Orb - Slower */}
      <div 
        className="absolute top-[35%] right-[8%] w-32 h-32 bg-gradient-to-b from-purple-200/20 to-transparent rounded-full blur-2xl animate-float -z-10 pointer-events-none" 
        style={{ animationDuration: '20s', animationDelay: '1s' }}
      ></div>

      {/* 3. Bottom Left: Large Faint Ring - Slower */}
      <div 
        className="absolute bottom-[25%] left-[5%] w-40 h-40 rounded-full border border-slate-200/10 animate-float-delayed -z-10 pointer-events-none" 
        style={{ animationDuration: '28s', animationDelay: '0s' }}
      ></div>

      {/* 4. Top Center: Floating Pill - Slower */}
      <div 
        className="absolute top-[20%] left-[45%] w-20 h-8 rounded-full bg-blue-50/20 border border-blue-100/10 rotate-[-10deg] animate-float-subtle -z-10 pointer-events-none" 
        style={{ animationDuration: '18s', animationDelay: '2s' }}
      ></div>

      {/* 5. Right Side: Small Plus Sign */}
      <div 
        className="absolute bottom-[40%] right-[15%] text-brand-300/20 text-4xl font-thin animate-float -z-10 pointer-events-none select-none" 
        style={{ animationDuration: '15s', animationDelay: '4s' }}
      >
        +
      </div>

      {/* 6. Bottom Right: Small Dot */}
      <div 
        className="absolute bottom-[15%] right-[25%] w-4 h-4 bg-brand-400/10 rounded-full blur-[1px] animate-float-slow -z-10 pointer-events-none" 
        style={{ animationDuration: '14s', animationDelay: '1.5s' }}
      ></div>

      {/* 7. Top Center-Left: Large Faint Hexagon */}
      <div 
        className="absolute top-[10%] left-[35%] w-32 h-32 border border-slate-200/30 rounded-3xl rotate-12 animate-float-slow -z-10 pointer-events-none" 
        style={{ animationDuration: '35s', animationDelay: '5s' }}
      ></div>

      {/* 8. Center Right: Tiny Accent Diamond */}
      <div 
        className="absolute top-[55%] right-[40%] w-3 h-3 bg-brand-300/20 rotate-45 animate-float -z-10 pointer-events-none" 
        style={{ animationDuration: '24s', animationDelay: '2s' }}
      ></div>

      {/* 9. Bottom Left: Soft Blue Blur */}
      <div 
        className="absolute bottom-[10%] left-[-5%] w-64 h-64 bg-blue-50/30 rounded-full blur-3xl animate-float-slow -z-10 pointer-events-none" 
        style={{ animationDuration: '40s', animationDelay: '0s' }}
      ></div>

      {/* 10. Large Faint Triangle Outline */}
      <div
        className="absolute top-[25%] right-[30%] w-0 h-0 border-l-[50px] border-l-transparent border-b-[80px] border-b-brand-100/10 border-r-[50px] border-r-transparent rotate-12 animate-float -z-10 pointer-events-none"
        style={{ animationDuration: '30s', animationDelay: '3s' }}
      ></div>

      {/* 11. Subtle Code Brackets */}
      <div 
        className="absolute bottom-[30%] left-[20%] text-slate-300/10 text-6xl font-mono font-bold rotate-[-5deg] animate-float-delayed -z-10 pointer-events-none select-none"
        style={{ animationDuration: '22s', animationDelay: '1s' }}
      >
        {`{ }`}
      </div>

      {/* 12. Dashed Circle */}
       <div 
        className="absolute top-[15%] right-[20%] w-24 h-24 rounded-full border-2 border-dashed border-slate-200/20 animate-float-slow -z-10 pointer-events-none" 
        style={{ animationDuration: '32s', animationDelay: '7s' }}
      ></div>

      {/* 13. Gradient Pill - Top Right */}
      <div 
        className="absolute top-[8%] right-[35%] w-20 h-6 rounded-full bg-gradient-to-r from-brand-100/20 to-purple-100/20 border border-white/20 -rotate-6 animate-float-slow -z-10 pointer-events-none"
        style={{ animationDuration: '22s', animationDelay: '1.5s' }}
      ></div>

      {/* 14. Soft Orb - Bottom Center-Right */}
      <div 
        className="absolute bottom-[18%] right-[45%] w-16 h-16 bg-brand-400/5 rounded-full blur-xl animate-float -z-10 pointer-events-none"
        style={{ animationDuration: '19s', animationDelay: '4s' }}
      ></div>

      {/* 15. Tiny Grid Dots - Top Left */}
      <div 
        className="absolute top-[30%] left-[18%] flex gap-1.5 opacity-30 animate-float-delayed -z-10 pointer-events-none"
        style={{ animationDuration: '25s', animationDelay: '2s' }}
      >
        <div className="w-1.5 h-1.5 bg-slate-400/20 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-slate-400/20 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-slate-400/20 rounded-full"></div>
      </div>

       {/* 16. Faint Code Symbol - Bottom Right */}
      <div 
        className="absolute bottom-[35%] right-[5%] text-slate-300/10 text-5xl font-mono font-bold rotate-[15deg] animate-float-slow -z-10 pointer-events-none select-none"
        style={{ animationDuration: '28s', animationDelay: '6s' }}
      >
        {`/>`}
      </div>

      {/* GSAP Controlled Particles */}
      <div className="bg-particle absolute top-32 left-[8%] w-3 h-3 bg-brand-400 rounded-full opacity-20 -z-10 pointer-events-none"></div>
      <div className="bg-particle absolute top-1/3 right-[5%] w-5 h-5 border border-purple-300/50 rounded-full opacity-20 -z-10 pointer-events-none"></div>
      <div className="bg-particle absolute bottom-40 left-[40%] w-20 h-20 bg-blue-100/50 rounded-full blur-xl opacity-30 -z-10 pointer-events-none"></div>
      <div className="bg-particle absolute top-[20%] left-[60%] w-6 h-6 border-2 border-brand-100/50 rounded-full opacity-20 -z-10 pointer-events-none"></div>
      <div className="bg-particle absolute top-[15%] right-[8%] w-2 h-2 bg-slate-200 rounded-full opacity-40 -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center relative z-10">
        
        {/* Left Content */}
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 px-4 py-1.5 rounded-full text-brand-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
            <Sparkles size={14} className="text-brand-500 fill-brand-500" />
            <span>AI-Powered Career Architect</span>
          </div>
          
          <h1 ref={titleRef} className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-4 sm:mb-6 tracking-tight">
            <div className="overflow-hidden"><span className="hero-title-line block">Craft the career</span></div>
            <div className="overflow-hidden">
              <span className="hero-title-line block text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600">
                you deserve.
              </span>
            </div>
          </h1>
          
          <p ref={textRef} className="text-base sm:text-lg lg:text-xl text-slate-600 mb-6 sm:mb-8 leading-relaxed max-w-lg opacity-0 translate-y-4">
            Stop sending resumes into the void. Our semantic vector engine matches your profile to JDs, tracks applications, and prepares you for interviews.
          </p>
          
          <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10">
            <Link 
              to="/register"
              className="bg-slate-900 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 touch-action-manipulation"
            >
              Analyze My Resume
              <span className="bg-white/20 rounded px-1.5 py-0.5 text-xs font-mono text-white/90">FREE</span>
            </Link>
            <button className="bg-white text-slate-700 border border-slate-200 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 touch-action-manipulation">
              View Sample
            </button>
          </div>

          <div ref={featuresRef} className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle2 size={16} className="text-green-500 sm:w-[18px] sm:h-[18px]" />
              <span>ATS Friendly</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle2 size={16} className="text-green-500 sm:w-[18px] sm:h-[18px]" />
              <span>GPT-4o Insights</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle2 size={16} className="text-green-500 sm:w-[18px] sm:h-[18px]" />
              <span>Privacy First</span>
            </div>
          </div>
        </div>

        {/* Right Visual - Abstract Dashboard Mockup */}
        <div ref={visualRef} className="relative hidden md:block h-[400px] lg:h-[600px] transform md:scale-90 lg:scale-105 -translate-x-[2%] group/visual">
          
          {/* Main Card - Resume Score */}
          <div className="floating-card absolute top-10 left-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-20">
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Product Designer</h3>
                  <p className="text-xs text-slate-500">Senior Level • San Francisco</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">94% Match</span>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">Keywords Found</span>
                  <span className="font-bold text-brand-600">18/20</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-500 h-full w-[90%] rounded-full"></div>
                </div>
              </div>
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">Impact Quantification</span>
                  <span className="font-bold text-amber-500">Needs Work</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full w-[40%] rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
               <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse"></div>
               <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Floating Element - Application Tracker */}
          <div className="floating-card absolute top-64 -right-4 w-64 bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 p-4 z-30" style={{animationDelay: "1.5s"}}>
            <div className="flex items-center gap-2 mb-3">
               <div className="w-2 h-2 rounded-full bg-brand-500"></div>
               <span className="text-xs font-bold text-slate-400 uppercase">Latest Activity</span>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Target size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Applied to Stripe</p>
                  <p className="text-xs text-slate-500">2 mins ago via Magic Link</p>
                </div>
              </div>
               <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <TrendingUp size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Interview Request</p>
                  <p className="text-[10px] text-slate-500">Airbnb • System Design</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Avatar - Appears on hover */}
          <div className="absolute top-[15%] -right-4 z-40 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] opacity-0 scale-50 translate-y-8 group-hover/visual:opacity-100 group-hover/visual:scale-100 group-hover/visual:translate-y-0">
             <div className="relative animate-float-slow">
                {/* Greeting Bubble */}
                <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap">
                   <div className="bg-white/90 backdrop-blur-sm border border-slate-200 px-4 py-2 rounded-2xl rounded-tr-sm shadow-lg text-sm font-medium text-slate-700 transform origin-right scale-0 opacity-0 transition-all duration-300 delay-300 group-hover/visual:scale-100 group-hover/visual:opacity-100">
                      Hi there! Ready to optimize? 🚀
                   </div>
                </div>

                {/* Avatar Circle */}
                <div className="w-16 h-16 bg-white rounded-full shadow-2xl border-4 border-white flex items-center justify-center relative">
                   <div className="absolute inset-0 bg-brand-50 rounded-full animate-ping opacity-20 duration-1000"></div>
                   <div className="w-full h-full bg-gradient-to-br from-brand-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden relative">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.4),transparent)]"></div>
                      <Bot className="text-white w-8 h-8 relative z-10" strokeWidth={1.5} />
                   </div>
                   {/* Status Dot */}
                   <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full z-20"></div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

