import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Zap, Layers, ArrowRight, MousePointer2, Check } from 'lucide-react';
import { logger } from '../../utils/logger';

export const Features = () => {
  const sectionRef = useRef(null);
  const [gsapReady, setGsapReady] = useState(false);

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

  useEffect(() => {
    if (!gsapReady || !sectionRef.current) return;

    let ctx;
    
    const initAnimations = async () => {
      const gsap = (await import('gsap')).default;
      
      ctx = gsap.context(() => {
        // Animate each feature block as it comes into view
        const featureBlocks = gsap.utils.toArray(".feature-block");
        featureBlocks.forEach((block) => {
          gsap.fromTo(block, 
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: {
                trigger: block,
                start: "top 80%",
                toggleActions: "play none none reverse"
              }
            }
          );
        });
      }, sectionRef);
    };

    initAnimations();

    return () => {
      if (ctx) ctx.revert();
    };
  }, [gsapReady]);

  return (
    <section ref={sectionRef} className="py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 space-y-24">
        
        {/* Feature 1: AI Analysis */}
        <div className="feature-block grid lg:grid-cols-2 gap-16 items-center opacity-0 translate-y-10">
          <div className="order-2 lg:order-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-purple-500 rounded-3xl rotate-3 blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 relative overflow-hidden transform hover:scale-[1.01] transition-transform duration-500">
               {/* Scanning Overlay */}
               <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.8)] z-20 animate-scan"></div>

               {/* Inner content wrapper with float animation */}
               <div className="space-y-5 relative z-10 animate-float-subtle">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                     {/* AI Score Indicator */}
                     <div className="w-12 h-12 rounded-full bg-white shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center text-brand-600 font-bold text-lg relative overflow-visible animate-breathe">
                        <span className="relative z-10">85</span>
                        {/* Pulsing ring effects */}
                        <div className="absolute inset-0 bg-brand-400 rounded-full animate-pulse-ring opacity-0"></div>
                        <div className="absolute inset-0 bg-brand-400 rounded-full animate-pulse-ring opacity-0" style={{ animationDelay: '1s' }}></div>
                     </div>
                     <div className="flex-1">
                        <div className="h-2.5 bg-slate-200 rounded-full mb-2 w-full overflow-hidden">
                           <div className="h-full w-[85%] bg-brand-500 rounded-full relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                           </div>
                        </div>
                        <p className="text-xs font-medium text-slate-500">Resume Score</p>
                     </div>
                  </div>
                  
                  {/* Floating Advice Card */}
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-3 animate-float-fast shadow-sm backdrop-blur-sm bg-opacity-80">
                     <div className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse"></div>
                     <div>
                        <p className="text-sm font-semibold text-slate-800">Weak Action Verb</p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Replace <span className="line-through text-red-400">"Helped"</span> with <span className="text-green-600 font-medium bg-green-50 px-1 rounded">"Spearheaded"</span> to show leadership.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
          
          {/* Feature 1 Text Content */}
          <div className="order-1 lg:order-2 group">
            <div className="relative overflow-hidden w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-600 mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-brand-500/20 group-hover:bg-brand-200">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:animate-shimmer z-10 pointer-events-none" />
              <Zap size={24} className="relative z-20 transition-transform duration-500" />
            </div>
            <div className="transition-transform duration-500 ease-out group-hover:scale-[1.03] origin-left">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Real-time Magic Advice.</h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                Our AI doesn't just tell you something is wrong; it fixes it. Receive context-aware suggestions to improve phrasing, grammar, and impact quantification instantly.
              </p>
              <ul className="space-y-3">
                 {['Instant grammar checks', 'Tone analysis', 'Keyword optimization'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-slate-700">
                       <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                          <Check size={12} />
                       </div>
                       {item}
                    </li>
                 ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Feature 2: Job Tracker */}
        <div className="feature-block grid lg:grid-cols-2 gap-16 items-center opacity-0 translate-y-10">
           {/* Feature 2 Text Content */}
           <div className="order-1 lg:order-1 group">
            <div className="relative overflow-hidden w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-lg group-hover:shadow-blue-500/20 group-hover:bg-blue-200">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:animate-shimmer z-10 pointer-events-none" />
              <Layers size={24} className="relative z-20 transition-transform duration-500" />
            </div>
            <div className="transition-transform duration-500 ease-out group-hover:scale-[1.03] origin-left">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Organize the chaos.</h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                Stop using spreadsheets. Our Kanban board is specifically designed for job hunting, with automated reminders to follow up after 3, 7, and 14 days.
              </p>
               <button className="text-brand-600 font-semibold hover:text-brand-700 flex items-center gap-2 group/btn">
                 See how it works <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          
          <div className="order-2 lg:order-2 relative group">
             <div className="absolute inset-0 bg-blue-400/10 rounded-full blur-3xl transform translate-y-12 animate-pulse-slow"></div>
             
             {/* Visual Columns Background */}
             <div className="grid grid-cols-2 gap-4 h-64 relative z-0">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50"></div>
                {/* Target Column Highlighted */}
                <div className="border-2 border-dashed border-brand-200/50 rounded-2xl bg-brand-50/30 transition-all duration-300 animate-pulse"></div>
             </div>

             <div className="absolute inset-0 p-4 grid grid-cols-2 gap-4">
                {/* Column Headers */}
                <div className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider mb-2">Applied</div>
                <div className="text-xs font-bold text-brand-400 text-center uppercase tracking-wider mb-2">Interviewing</div>

                {/* Animated Cursor */}
                <div className="absolute z-30 text-slate-900 pointer-events-none animate-cursor-move top-[100px] left-[25%] drop-shadow-xl">
                  <MousePointer2 className="fill-slate-900 stroke-white" size={24} />
                </div>

                {/* Netflix Card - Dragging Animation */}
                <div className="col-start-1 row-start-2 self-start">
                  <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 animate-drag-drop relative z-20 w-full">
                     <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-white bg-slate-900 px-2 py-0.5 rounded-full">NETFLIX</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                     </div>
                     <p className="font-bold text-slate-900 text-sm">Senior Engineer</p>
                     <p className="text-xs text-slate-500">Applied 2d ago</p>
                  </div>
                </div>

                {/* Static/Floating Cards */}
                <div className="col-start-2 row-start-2 self-center mt-8">
                   <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 animate-float-delayed z-10 opacity-90 scale-95 origin-center">
                     <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded-full">UBER</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                     </div>
                     <p className="font-bold text-slate-900 text-sm">Product Manager</p>
                     <p className="text-xs text-slate-500">Offer Received</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

         {/* Feature 3: Magic Link */}
        <div className="feature-block grid lg:grid-cols-2 gap-16 items-center opacity-0 translate-y-10">
          <div className="order-2 lg:order-1 relative">
             <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500">
                {/* Background Glow */}
                <div className="absolute top-[-50%] right-[-50%] w-80 h-80 bg-brand-500 blur-[100px] opacity-30 animate-pulse-slow"></div>
                
                <h3 className="font-mono text-sm text-brand-300 mb-6 flex items-center gap-2">
                   <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                   SECURE_LOGIN_V2
                </h3>
                
                <div className="space-y-3 relative z-10">
                   {/* Email Input Simulation */}
                   <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">AL</div>
                         <div className="h-6 flex items-center overflow-hidden">
                           <div className="animate-type overflow-hidden whitespace-nowrap border-r-2 border-brand-400 pr-1">
                              <span className="text-sm text-white">alex@example.com</span>
                           </div>
                         </div>
                      </div>
                      <div className="w-20 h-6 bg-brand-600/20 rounded-md flex items-center justify-center">
                         <span className="text-[10px] font-bold text-brand-400 animate-pulse">VERIFIED</span>
                      </div>
                   </div>

                   {/* Magic Link Card */}
                   <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 p-4 rounded-xl border border-slate-700 relative overflow-hidden animate-float-subtle" style={{ animationDelay: '1s' }}>
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>
                       <p className="text-sm text-slate-300 mb-1">Login link sent to</p>
                       <p className="text-white font-medium">alex@example.com</p>
                       <div className="mt-3 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-400 w-2/3 rounded-full"></div>
                       </div>
                   </div>
                </div>

                <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                   <ShieldCheck size={14} className="text-green-400" />
                   End-to-end Encrypted
                </div>
             </div>
          </div>
          
          {/* Feature 3 Text Content */}
          <div className="order-1 lg:order-2 group">
            <div className="relative overflow-hidden w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-purple-500/20 group-hover:bg-purple-200">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:animate-shimmer z-10 pointer-events-none" />
              <ShieldCheck size={24} className="relative z-20 transition-transform duration-500" />
            </div>
            <div className="transition-transform duration-500 ease-out group-hover:scale-[1.03] origin-left">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Frictionless Onboarding.</h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                No more passwords to remember. Use our secure Magic Link technology to log in instantly from any device. Your data is encrypted at rest and in transit.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

