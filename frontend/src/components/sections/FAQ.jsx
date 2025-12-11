import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const faqs = [
  {
    question: "How does the AI analysis work?",
    answer: "We use advanced NLP (Natural Language Processing) to read your resume exactly how an ATS (Applicant Tracking System) and a human recruiter would. We compare your content against millions of successful profiles to identify gaps, weak verbs, and missing keywords."
  },
  {
    question: "Can I import my existing resume?",
    answer: "Absolutely. You can upload PDF or Word documents. Our parser extracts your data instantly so you don't have to re-type everything."
  },
  {
    question: "Is my data safe?",
    answer: "Yes. We use bank-level encryption and never sell your data to third parties. You can delete your account and all associated data at any time."
  },
  {
    question: "What is JD Matching?",
    answer: "Job Description Matching allows you to paste a job posting next to your resume. We calculate a match score and give you a specific list of keywords and skills you need to add to increase your chances of an interview."
  }
];

const FAQItem = ({ faq, isOpen, onClick, id }) => {
  const contentRef = useRef(null);
  const contentId = `${id}-content`;
  const headerId = `${id}-header`;
  
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // Ensure we kill any running animations to allow smooth interruption
    gsap.killTweensOf(el);

    if (isOpen) {
      // 1. Capture start height (useful if interrupting a close animation)
      const startHeight = el.offsetHeight;
      
      // 2. Measure target height by setting to auto temporarily
      gsap.set(el, { height: 'auto' });
      const targetHeight = el.scrollHeight;
      
      // 3. Reset to start height immediately
      gsap.set(el, { height: startHeight });

      // 4. Animate to target
      gsap.to(el, {
        height: targetHeight,
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
        onComplete: () => {
          // Set to auto after animation to accommodate window resizing/text wrapping
          gsap.set(el, { height: "auto" });
        }
      });
    } else {
      // 1. Explicitly set height to current pixel height (handles 'auto' state)
      gsap.set(el, { height: el.offsetHeight });
      
      // 2. Animate to closed
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }, [isOpen]);

  return (
    <div 
      className={`border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-brand-200 ${
        isOpen ? 'border-brand-200 ring-1 ring-brand-100 bg-slate-50/60 shadow-sm' : 'bg-white'
      }`}
    >
      <button 
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-inset rounded-2xl group select-none transition-all"
        onClick={onClick}
      >
        <span className={`font-semibold text-lg transition-colors duration-300 ${
          isOpen ? 'text-brand-700' : 'text-slate-900 group-hover:text-brand-600'
        }`}>
          {faq.question}
        </span>
        {/* Animated Chevron Wrapper */}
        <div 
          className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-[400ms] ease-in-out ${
            isOpen 
              ? 'bg-brand-100 text-brand-600 rotate-180' 
              : 'bg-slate-100 text-slate-500 rotate-0 group-hover:bg-brand-50 group-hover:text-brand-500'
          }`}
        >
          <ChevronDown size={20} />
        </div>
      </button>
      <div 
        id={contentId}
        role="region"
        aria-labelledby={headerId}
        ref={contentRef}
        className="overflow-hidden h-0 opacity-0 origin-top"
      >
        <div className="px-6 pb-6 pt-0 text-slate-600 leading-relaxed">
          {faq.answer}
        </div>
      </div>
    </div>
  );
};

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
       gsap.fromTo(".faq-title", 
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          scrollTrigger: {
            trigger: ".faq-title",
            start: "top 85%"
          }
        }
       );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="faq-title text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center opacity-0">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <FAQItem 
              key={index} 
              id={`faq-${index}`}
              faq={faq} 
              isOpen={openIndex === index} 
              onClick={() => setOpenIndex(openIndex === index ? null : index)} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

