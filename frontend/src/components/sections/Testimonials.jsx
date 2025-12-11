import React from 'react';

const testimonials = [
  {
    text: "I applied to 50 jobs with no response. After using ResumeCraft's analyzer, I got 3 interviews in a week.",
    author: "Sarah Jenkins",
    role: "UX Designer at Spotify",
    image: "https://picsum.photos/seed/sarah/100/100"
  },
  {
    text: "The JD matching feature is a game changer. It showed me exactly what keywords I was missing.",
    author: "David Chen",
    role: "Product Manager at Airbnb",
    image: "https://picsum.photos/seed/david/100/100"
  },
  {
    text: "Finally, a job tracker that actually feels good to use. The Kanban board kept me sane.",
    author: "Elena Rodriguez",
    role: "Frontend Dev at Vercel",
    image: "https://picsum.photos/seed/elena/100/100"
  },
  {
    text: "Worth every penny. The AI suggestions are indistinguishable from a human career coach.",
    author: "Michael Chang",
    role: "Data Scientist at Meta",
    image: "https://picsum.photos/seed/michael/100/100"
  },
    {
    text: "Simple, clean, and powerful. I built my resume in 10 minutes and it looks better than ever.",
    author: "Jessica Lee",
    role: "Marketing Lead at Stripe",
    image: "https://picsum.photos/seed/jessica/100/100"
  }
];

// Duplicate array for seamless loop
const loopTestimonials = [...testimonials, ...testimonials, ...testimonials];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 bg-white overflow-hidden relative">
      <div className="text-center mb-16 max-w-2xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Hired by the best.</h2>
        <p className="text-slate-600">Join thousands of professionals who landed their dream roles using ResumeCraft.</p>
      </div>

      <div className="relative w-full overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10"></div>

        <div className="flex animate-marquee w-max hover:[animation-play-state:paused]">
          {loopTestimonials.map((t, i) => (
            <div key={i} className="w-[350px] md:w-[400px] flex-shrink-0 px-4">
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-brand-100 hover:shadow-lg transition-all duration-300 h-full">
                 <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(star => (
                        <svg key={star} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                 </div>
                <p className="text-slate-700 text-lg font-medium mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <img src={t.image} alt={t.author} className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.author}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

