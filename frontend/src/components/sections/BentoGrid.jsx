import React, { useEffect, useRef } from 'react';
import { Search, BellRing, Kanban, BrainCircuit, FileText } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const IconTooltip = ({ content, children, theme = 'dark' }) => {
  const bgClass = theme === 'dark' ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200';
  const arrowClass = theme === 'dark' ? 'border-r-slate-900' : 'border-r-white';
  
  return (
    <div className="relative group/tooltip w-fit">
      {children}
      <div className={`absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 text-xs font-medium rounded-lg opacity-0 -translate-x-2 group-hover/tooltip:opacity-100 group-hover/tooltip:translate-x-0 transition-all duration-300 whitespace-nowrap pointer-events-none z-50 shadow-xl border ${bgClass}`}>
        {content}
        <div className={`absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent ${arrowClass}`}></div>
      </div>
    </div>
  );
};

export const BentoGrid = () => {
  const gridRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Staggered reveal of grid items
      ScrollTrigger.batch(".bento-card", {
        onEnter: (batch) => {
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.8,
            ease: "power3.out"
          });
        },
        start: "top 85%",
        once: true
      });
    }, gridRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={gridRef} id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto opacity-0 translate-y-10 bento-card">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Complete command center.</h2>
          <p className="text-slate-600">Everything you need to manage your job search, from first draft to final offer, in one unified workspace.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px] md:auto-rows-[320px]">
          
          {/* Card 1: AI Analyzer (Large) */}
          <div className="bento-card opacity-0 translate-y-10 md:col-span-2 bg-slate-50 hover:bg-brand-50 rounded-3xl p-8 border border-slate-100 overflow-hidden relative group 
            transition-all duration-500 ease-out
            hover:border-brand-200 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.2)] hover:scale-[1.02]">
            
            <div className="relative z-10">
              <div className="transition-all duration-300 ease-in-out group-hover:-translate-y-1 group-hover:opacity-100 opacity-80">
                <IconTooltip content="Vector-based profile comparison">
                  <div className="w-12 h-12 bg-white group-hover:bg-white/80 transition-colors duration-300 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 text-brand-600">
                    <BrainCircuit size={24} />
                  </div>
                </IconTooltip>
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Deep AI Analysis</h3>
                    <p className="text-slate-600 max-w-md">Our vector engine deconstructs your resume against millions of successful profiles to give you actionable, sentence-level improvements.</p>
                </div>
              </div>
            </div>
            {/* Decor element */}
            <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-white to-transparent z-0 group-hover:from-white/50 transition-colors duration-300"></div>
            <div className="absolute right-[-20px] bottom-[-20px] bg-white border border-slate-200 p-4 rounded-xl shadow-lg rotate-[-5deg] group-hover:rotate-0 group-hover:scale-105 transition-all duration-500">
                <div className="flex gap-2 items-center text-xs font-mono text-slate-400 mb-2">ANALYSIS_LOG_01</div>
                <div className="space-y-2">
                    <div className="w-48 h-2 bg-slate-100 rounded-full"></div>
                    <div className="w-36 h-2 bg-slate-100 rounded-full"></div>
                    <div className="w-40 h-2 bg-brand-100 rounded-full"></div>
                </div>
            </div>
          </div>

          {/* Card 2: Job Tracker (Vertical) */}
          <div className="bento-card opacity-0 translate-y-10 md:row-span-2 bg-slate-900 hover:bg-slate-800 rounded-3xl p-8 border border-slate-800 relative overflow-hidden group 
            transition-all duration-500 ease-out
            hover:border-slate-600 hover:shadow-2xl hover:shadow-brand-900/40 hover:scale-[1.02]">
            
            <div className="relative z-10">
              <div className="transition-all duration-300 ease-in-out group-hover:-translate-y-1 group-hover:opacity-100 opacity-80">
                <IconTooltip content="Drag-and-drop application tracking" theme="light">
                  <div className="w-12 h-12 bg-slate-800 group-hover:bg-slate-700 transition-colors duration-300 rounded-xl shadow-sm border border-slate-700 flex items-center justify-center mb-4 text-blue-400">
                    <Kanban size={24} />
                  </div>
                </IconTooltip>
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Kanban Workflow</h3>
                    <p className="text-slate-400">Drag, drop, and automate your status updates.</p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
               <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 mb-3 shadow-lg transform -rotate-2 group-hover:rotate-0 transition-transform duration-500 delay-75 group-hover:border-slate-600">
                  <div className="h-2 w-12 bg-red-500/20 rounded-full mb-2"></div>
                  <div className="h-2 w-3/4 bg-slate-600 rounded-full"></div>
               </div>
               <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 shadow-lg transform rotate-2 group-hover:rotate-0 transition-transform duration-500 group-hover:border-slate-600">
                  <div className="h-2 w-12 bg-green-500/20 rounded-full mb-2"></div>
                  <div className="h-2 w-full bg-slate-600 rounded-full"></div>
               </div>
            </div>
          </div>

          {/* Card 3: JD Match */}
          <div className="bento-card opacity-0 translate-y-10 bg-white hover:bg-orange-50 rounded-3xl p-8 border border-slate-200 group
            transition-all duration-500 ease-out
            hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10 hover:scale-[1.02]">
             <div className="relative z-10">
               <div className="transition-all duration-300 ease-in-out group-hover:-translate-y-1 group-hover:opacity-100 opacity-80">
                 <IconTooltip content="Identify missing keywords instantly">
                   <div className="w-12 h-12 bg-orange-50 group-hover:bg-orange-100 transition-colors duration-300 rounded-xl flex items-center justify-center mb-4 text-orange-600">
                      <Search size={24} />
                    </div>
                  </IconTooltip>
                  <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Semantic Match</h3>
                      <p className="text-slate-500 text-sm">Paste a JD and see exactly what keywords you're missing in real-time.</p>
                  </div>
               </div>
             </div>
          </div>

           {/* Card 4: Notification Hub */}
           <div className="bento-card opacity-0 translate-y-10 bg-white hover:bg-purple-50 rounded-3xl p-8 border border-slate-200 group
            transition-all duration-500 ease-out
            hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.02]">
             <div className="relative z-10">
               <div className="transition-all duration-300 ease-in-out group-hover:-translate-y-1 group-hover:opacity-100 opacity-80">
                 <IconTooltip content="Instant application updates">
                   <div className="w-12 h-12 bg-purple-50 group-hover:bg-purple-100 transition-colors duration-300 rounded-xl flex items-center justify-center mb-4 text-purple-600">
                      <BellRing size={24} />
                    </div>
                  </IconTooltip>
                  <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Smart Alerts</h3>
                      <p className="text-slate-500 text-sm">Get notified when a recruiter views your profile or an application stalls.</p>
                  </div>
               </div>
             </div>
          </div>

           {/* Card 5: Research Notes (Span 2) */}
           <div className="bento-card opacity-0 translate-y-10 md:col-span-2 bg-gradient-to-br from-brand-50 to-white hover:from-brand-100 hover:to-brand-50 rounded-3xl p-8 border border-brand-100 relative overflow-hidden group 
            transition-all duration-500 ease-out
            hover:border-brand-300 hover:shadow-xl hover:shadow-brand-500/10 hover:scale-[1.02]">
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="max-w-xs transition-all duration-300 ease-in-out group-hover:opacity-100 opacity-80 group-hover:-translate-y-1">
                     <IconTooltip content="Contextual research & salary data">
                       <div className="w-12 h-12 bg-white group-hover:bg-white/80 transition-colors duration-300 rounded-xl shadow-sm border border-brand-100 flex items-center justify-center mb-4 text-brand-600">
                        <FileText size={24} />
                      </div>
                    </IconTooltip>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Interview Notes</h3>
                        <p className="text-slate-600">Keep company research, interview questions, and salary data attached directly to the job card.</p>
                    </div>
                  </div>
                  <div className="flex-grow bg-white rounded-xl shadow-sm border border-brand-100 p-4 rotate-1 group-hover:-rotate-1 group-hover:scale-105 transition-transform duration-500">
                      <div className="flex gap-2 mb-3 border-b border-slate-100 pb-2">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <p className="font-mono text-xs text-slate-400">Researching: Acme Corp Values...</p>
                  </div>
                </div>
              </div>
           </div>

        </div>
      </div>
    </section>
  );
};

