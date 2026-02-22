'use client';

import type React from 'react';
import { useEffect, useState } from 'react';

// Badge component for consistency
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center justify-start gap-[8px] overflow-hidden rounded-[90px] border border-[rgba(2,6,23,0.08)] bg-white px-[14px] py-[6px] shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] shadow-xs">
      <div className="relative flex h-[14px] w-[14px] items-center justify-center overflow-hidden">
        {icon}
      </div>
      <div className="flex flex-col justify-center text-center font-sans text-xs leading-3 font-medium text-[#37322F]">
        {text}
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const testimonials = [
    {
      quote:
        'In just a few minutes, we transformed our data into actionable insights. The process was seamless and incredibly efficient!',
      name: 'Jamie Marshall',
      company: 'Co-founder, Exponent',
      image:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Sep%2011%2C%202025%2C%2011_35_19%20AM-z4zSRLsbOQDp7MJS1t8EXmGNB6Al9Z.png',
    },
    {
      quote:
        'Brillance has revolutionized how we handle custom contracts. The automation saves us hours every week and eliminates errors completely.',
      name: 'Sarah Chen',
      company: 'VP Operations, TechFlow',
      image:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Sep%2011%2C%202025%2C%2010_54_18%20AM-nbiecp92QNdTudmCrHr97uekrIPzCP.png',
    },
    {
      quote:
        'The billing automation is a game-changer. What used to take our team days now happens automatically with perfect accuracy.',
      name: 'Marcus Rodriguez',
      company: 'Finance Director, InnovateCorp',
      image:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Sep%2011%2C%202025%2C%2011_01_05%20AM-TBOe92trRxKn4G5So1m9D2h7LRH4PG.png',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
      }, 300);
    }, 12000); // increased from 6000ms to 12000ms for longer testimonial display

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleNavigationClick = (index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTestimonial(index);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 300);
  };

  return (
    <div className="flex w-full flex-col items-center justify-center border-b border-[rgba(55,50,47,0.12)]">
      {/* Header Section */}

      {/* Testimonial Content */}
      <div className="flex items-center justify-start self-stretch overflow-hidden border border-t-0 border-r-0 border-b border-l-0 bg-background px-2">
        <div className="flex flex-1 flex-col items-end justify-center gap-6 py-16 md:flex-row md:py-17">
          <div className="flex flex-col items-start justify-center gap-4 self-stretch px-3 md:flex-row md:px-12">
            <img
              className="h-50 w-48 rounded-lg object-cover transition-all duration-700 ease-in-out md:h-50 md:w-48"
              style={{
                opacity: isTransitioning ? 0.6 : 1,
                transform: isTransitioning ? 'scale(0.95)' : 'scale(1)',
                transition: 'opacity 0.7s ease-in-out, transform 0.7s ease-in-out',
              }}
              src={testimonials[activeTestimonial].image || '/placeholder.svg'}
              alt={testimonials[activeTestimonial].name}
            />
            <div className="flex flex-1 flex-col items-start justify-start gap-6 overflow-hidden px-6 py-6 pt-0 pb-0 shadow-[0px_0px_0px_0.75px_rgba(50,45,43,0.12)] shadow-none">
              <div
                className="line-clamp-5 flex h-[200px] flex-col justify-start self-stretch overflow-hidden font-sans text-2xl leading-10 font-medium tracking-tight text-[#49423D] transition-all duration-700 ease-in-out md:h-[210px] md:text-[32px] md:leading-[42px]"
                style={{
                  filter: isTransitioning ? 'blur(4px)' : 'blur(0px)',
                  transition: 'filter 0.7s ease-in-out',
                }}
              >
                "{testimonials[activeTestimonial].quote}"
              </div>
              <div
                className="flex flex-col items-start justify-start gap-1 self-stretch transition-all duration-700 ease-in-out"
                style={{
                  filter: isTransitioning ? 'blur(4px)' : 'blur(0px)',
                  transition: 'filter 0.7s ease-in-out',
                }}
              >
                <div className="flex flex-col justify-center self-stretch font-sans text-lg leading-[26px] font-medium text-[rgba(73,66,61,0.90)]">
                  {testimonials[activeTestimonial].name}
                </div>
                <div className="flex flex-col justify-center self-stretch font-sans text-lg leading-[26px] font-medium text-[rgba(73,66,61,0.70)]">
                  {testimonials[activeTestimonial].company}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-start justify-start gap-[14px] pr-6">
            <button
              onClick={() =>
                handleNavigationClick(
                  (activeTestimonial - 1 + testimonials.length) % testimonials.length,
                )
              }
              className="flex h-9 w-9 items-center justify-center gap-2 overflow-hidden rounded-full border border-[rgba(0,0,0,0.15)] shadow-[0px_1px_2px_rgba(0,0,0,0.08)] transition-colors hover:bg-gray-50"
            >
              <div className="relative h-6 w-6 overflow-hidden">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="#46413E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
            <button
              onClick={() => handleNavigationClick((activeTestimonial + 1) % testimonials.length)}
              className="flex h-9 w-9 items-center justify-center gap-2 overflow-hidden rounded-full border border-[rgba(0,0,0,0.15)] shadow-[0px_1px_2px_rgba(0,0,0,0.08)] transition-colors hover:bg-gray-50"
            >
              <div className="relative h-6 w-6 overflow-hidden">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="#46413E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
