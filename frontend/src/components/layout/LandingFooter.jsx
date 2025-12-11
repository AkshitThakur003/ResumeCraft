import React from 'react';
import { Twitter, Linkedin, Github } from 'lucide-react';

export const LandingFooter = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 lg:py-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-16">
          
          {/* Brand Section - Spans 4 columns on large screens */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-6 text-white">
               <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-brand-900/20 text-lg">R</div>
               <span className="font-bold text-xl tracking-tight">ResumeCraft</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
              Empowering professionals to take control of their careers through data-driven insights, intelligent automation, and semantic analysis.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all duration-300 group" aria-label="Twitter">
                <Twitter size={18} className="group-hover:scale-110 transition-transform" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all duration-300 group" aria-label="LinkedIn">
                <Linkedin size={18} className="group-hover:scale-110 transition-transform" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all duration-300 group" aria-label="GitHub">
                <Github size={18} className="group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
          
          {/* Links Section - Spans 8 columns on large screens, nested grid for links */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            
            {/* Column 1 */}
            <div>
              <h4 className="text-white font-semibold mb-6">Product</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#features" className="hover:text-brand-400 transition-colors inline-block">Features</a></li>
                <li><a href="#pricing" className="hover:text-brand-400 transition-colors inline-block">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-brand-400 transition-colors inline-block">Success Stories</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors inline-block">Changelog</a></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="text-white font-semibold mb-6">Resources</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-brand-400 transition-colors inline-block">Blog</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors inline-block">Resume Templates</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors inline-block">Career Guide</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors inline-block">Help Center</a></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-white font-semibold mb-6">Legal</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-brand-400 transition-colors inline-block">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors inline-block">Terms of Service</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors inline-block">Security</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors inline-block">Cookie Settings</a></li>
              </ul>
            </div>

          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} ResumeCraft Inc. All rights reserved.</p>
          
          <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50 hover:border-slate-600 transition-colors cursor-help group">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </div>
            <span className="font-medium text-xs text-slate-300 group-hover:text-white transition-colors">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

