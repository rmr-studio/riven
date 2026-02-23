'use client';

import type React from 'react';

import SmartSimpleBrilliant from '@/components/feature-modules/landing/components/bento-card';
import YourWorkInSync from '@/components/feature-modules/landing/components/bento-chat';
import NumbersThatSpeak from '@/components/feature-modules/landing/components/bento-graph';
import EffortlessIntegration from '@/components/feature-modules/landing/components/bento-integration';
import CTASection from '@/components/feature-modules/landing/components/CTA';
import FAQSection from '@/components/feature-modules/landing/components/faq';
import DocumentationSection from '@/components/feature-modules/landing/components/Features';
import FooterSection from '@/components/feature-modules/landing/components/Footer';
import PricingSection from '@/components/feature-modules/landing/components/pricing';
import { SkylineHero } from '@/components/feature-modules/landing/components/skyline-hero';
import TestimonialsSection from '@/components/feature-modules/landing/components/testimonials';
import { ModeToggle } from '@/components/ui/themeToggle';
import { useEffect, useRef, useState } from 'react';

// Reusable Badge Component
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="bg-page-badge border-page-border-solid flex items-center justify-start gap-[8px] overflow-hidden rounded-[90px] border px-[14px] py-[6px] shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] shadow-xs dark:shadow-[0px_0px_0px_4px_rgba(232,230,227,0.05)]">
      <div className="relative flex h-[14px] w-[14px] items-center justify-center overflow-hidden">
        {icon}
      </div>
      <div className="text-page-badge-foreground flex flex-col justify-center text-center font-sans text-xs leading-3 font-medium">
        {text}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [activeCard, setActiveCard] = useState(0);
  const [progress, setProgress] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (!mountedRef.current) return;

      setProgress((prev) => {
        if (prev >= 100) {
          if (mountedRef.current) {
            setActiveCard((current) => (current + 1) % 3);
          }
          return 0;
        }
        return prev + 2; // 2% every 100ms = 5 seconds total
      });
    }, 100);

    return () => {
      clearInterval(progressInterval);
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleCardClick = (index: number) => {
    if (!mountedRef.current) return;
    setActiveCard(index);
    setProgress(0);
  };

  const getDashboardContent = () => {
    switch (activeCard) {
      case 0:
        return (
          <div className="text-sm text-[#828387]">Customer Subscription Status and Details</div>
        );
      case 1:
        return (
          <div className="text-sm text-[#828387]">Analytics Dashboard - Real-time Insights</div>
        );
      case 2:
        return (
          <div className="text-sm text-[#828387]">Data Visualization - Charts and Metrics</div>
        );
      default:
        return (
          <div className="text-sm text-[#828387]">Customer Subscription Status and Details</div>
        );
    }
  };

  return (
    <div className="bg-page-background relative flex min-h-screen w-full flex-col items-center justify-start overflow-x-hidden">
      {/* Z-10 */}
      <SkylineHero />
      {/* Z-20 */}
      <div className="relative z-20 flex w-full flex-col items-center justify-start">
        {/* Main container with proper margins */}
        <div className="relative flex min-h-screen w-full max-w-none flex-col items-start justify-start px-4 sm:px-6 md:px-8 lg:w-[1060px] lg:max-w-[1060px] lg:px-0">
          {/* Left vertical line */}
          <div className="bg-page-border-solid absolute top-0 left-4 z-20 h-full w-[1px] shadow-[1px_0px_0px_white] sm:left-6 md:left-8 lg:left-0 dark:shadow-[1px_0px_0px_rgba(26,24,22,0.5)]"></div>

          {/* Right vertical line */}
          <div className="bg-page-border-solid absolute top-0 right-4 z-20 h-full w-[1px] shadow-[1px_0px_0px_white] sm:right-6 md:right-8 lg:right-0 dark:shadow-[1px_0px_0px_rgba(26,24,22,0.5)]"></div>

          <div className="border-page-border-solid relative z-20 flex flex-col items-center justify-center gap-4 self-stretch overflow-hidden border-b pt-[9px] sm:gap-6 md:gap-8 lg:gap-[66px]">
            {/* Navigation */}
            <div className="absolute top-0 left-0 z-20 flex h-12 w-full items-center justify-center px-6 sm:h-14 sm:px-8 md:h-16 md:px-12 lg:h-[84px] lg:px-0">
              <div className="border-page-border-solid absolute top-6 left-0 h-0 w-full border-t shadow-[0px_1px_0px_white] sm:top-7 md:top-8 lg:top-[42px] dark:shadow-[0px_1px_0px_rgba(26,24,22,0.5)]"></div>

              <div className="bg-page-background relative z-30 flex h-10 w-full max-w-[calc(100%-32px)] items-center justify-between overflow-hidden rounded-[50px] px-3 py-1.5 pr-2 shadow-[0px_0px_0px_2px_white] backdrop-blur-sm sm:h-11 sm:max-w-[calc(100%-48px)] sm:px-4 sm:py-2 sm:pr-3 md:h-12 md:max-w-[calc(100%-64px)] md:px-4 lg:w-[700px] lg:max-w-[700px] dark:shadow-[0px_0px_0px_2px_rgba(37,35,33,0.8)]">
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-start">
                    <div className="text-page-foreground flex flex-col justify-center font-sans text-sm leading-5 font-medium sm:text-base md:text-lg lg:text-xl">
                      Brillance
                    </div>
                  </div>
                  <div className="flex hidden flex-row items-start justify-start gap-2 pl-3 sm:flex sm:gap-3 sm:pl-4 md:gap-4 md:pl-5 lg:gap-4 lg:pl-5">
                    <div className="flex items-center justify-start">
                      <div className="text-page-muted flex flex-col justify-center font-sans text-xs leading-[14px] font-medium md:text-[13px]">
                        Products
                      </div>
                    </div>
                    <div className="flex items-center justify-start">
                      <div className="text-page-muted flex flex-col justify-center font-sans text-xs leading-[14px] font-medium md:text-[13px]">
                        Pricing
                      </div>
                    </div>
                    <div className="flex items-center justify-start">
                      <div className="text-page-muted flex flex-col justify-center font-sans text-xs leading-[14px] font-medium md:text-[13px]">
                        Docs
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex h-6 items-start justify-start gap-2 sm:h-7 sm:gap-3 md:h-8">
                  <ModeToggle />
                  <div className="bg-page-card flex items-center justify-center overflow-hidden rounded-full px-2 py-1 shadow-[0px_1px_2px_rgba(55,50,47,0.12)] sm:px-3 sm:py-[6px] md:px-[14px] dark:shadow-[0px_1px_2px_rgba(0,0,0,0.3)]">
                    <div className="text-page-foreground flex flex-col justify-center font-sans text-xs leading-5 font-medium md:text-[13px]">
                      Log in
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="flex w-full flex-col items-center justify-start px-2 pt-16 pr-0 pb-8 pl-0 sm:px-4 sm:pt-20 sm:pr-0 sm:pb-12 sm:pl-0 md:px-8 md:pt-24 md:pb-16 lg:px-0 lg:pt-[216px]">
              <div className="flex w-full max-w-[937px] flex-col items-center justify-center gap-3 sm:gap-4 md:gap-5 lg:w-[937px] lg:gap-6">
                <div className="flex flex-col items-center justify-center gap-4 self-stretch rounded-[3px] sm:gap-5 md:gap-6 lg:gap-8">
                  <div className="text-page-foreground xs:text-[28px] flex w-full max-w-[748.71px] flex-col justify-center px-2 text-center font-serif text-[24px] leading-[1.1] font-normal sm:px-4 sm:text-[36px] sm:leading-[1.15] md:px-0 md:text-[52px] md:leading-[1.2] lg:w-[748.71px] lg:text-[80px] lg:leading-24">
                    Effortless custom contract
                    <br />
                    billing by Brillance
                  </div>
                  <div className="text-page-muted flex w-full max-w-[506.08px] flex-col justify-center px-2 text-center font-sans text-sm leading-[1.4] font-medium sm:px-4 sm:text-lg sm:leading-[1.45] md:px-0 md:text-xl md:leading-[1.5] lg:w-[506.08px] lg:text-lg lg:leading-7">
                    Streamline your billing process with seamless automation
                    <br className="hidden sm:block" />
                    for every custom contract, tailored by Brillance.
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-6 flex w-full max-w-[497px] flex-col items-center justify-center gap-6 sm:mt-8 sm:gap-8 md:mt-10 md:gap-10 lg:mt-12 lg:w-[497px] lg:gap-12">
                <div className="flex items-center justify-start gap-4 backdrop-blur-[8.25px]">
                  <div className="bg-page-button relative flex h-10 items-center justify-center overflow-hidden rounded-full px-6 py-2 shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] sm:h-11 sm:px-8 sm:py-[6px] md:h-12 md:px-10 lg:px-12 dark:shadow-[0px_0px_0px_2.5px_rgba(0,0,0,0.2)_inset]">
                    <div className="absolute top-[-0.5px] left-0 h-[41px] w-20 bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply sm:w-24 md:w-28 lg:w-44"></div>
                    <div className="text-page-button-foreground flex flex-col justify-center font-sans text-sm leading-5 font-medium sm:text-base md:text-[15px]">
                      Start for free
                    </div>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute top-[232px] left-1/2 z-0 -translate-x-1/2 transform sm:top-[248px] md:top-[264px] lg:top-[320px]">
                <img
                  src="/mask-group-pattern.svg"
                  alt=""
                  className="h-auto w-[936px] opacity-30 mix-blend-multiply sm:w-[1404px] sm:opacity-40 md:w-[2106px] md:opacity-50 lg:w-[2808px] dark:opacity-10 dark:mix-blend-screen"
                  style={{
                    filter: 'hue-rotate(15deg) saturate(0.7) brightness(1.2)',
                  }}
                />
              </div>

              <div className="relative z-5 my-8 mb-0 flex w-full max-w-[960px] flex-col items-center justify-center gap-2 px-2 pt-2 pb-6 sm:my-12 sm:px-4 sm:pt-4 sm:pb-8 md:my-16 md:px-6 md:pb-10 lg:my-16 lg:w-[960px] lg:px-11 lg:pb-0">
                <div className="bg-page-card flex h-[200px] w-full max-w-[960px] flex-col items-start justify-start overflow-hidden rounded-[6px] shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)] sm:h-[280px] sm:rounded-[8px] md:h-[450px] lg:h-[695.55px] lg:w-[960px] lg:rounded-[9.06px] dark:shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.3)]">
                  {/* Dashboard Content */}
                  <div className="flex flex-1 items-start justify-start self-stretch">
                    {/* Main Content */}
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="relative h-full w-full overflow-hidden">
                        {/* Product Image 1 - Plan your schedules */}
                        <div
                          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                            activeCard === 0
                              ? 'blur-0 scale-100 opacity-100'
                              : 'scale-95 opacity-0 blur-sm'
                          }`}
                        >
                          <img
                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dsadsadsa.jpg-xTHS4hGwCWp2H5bTj8np6DXZUyrxX7.jpeg"
                            alt="Schedules Dashboard - Customer Subscription Management"
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Product Image 2 - Data to insights */}
                        <div
                          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                            activeCard === 1
                              ? 'blur-0 scale-100 opacity-100'
                              : 'scale-95 opacity-0 blur-sm'
                          }`}
                        >
                          <img
                            src="/analytics-dashboard-with-charts-graphs-and-data-vi.jpg"
                            alt="Analytics Dashboard"
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Product Image 3 - Data visualization */}
                        <div
                          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                            activeCard === 2
                              ? 'blur-0 scale-100 opacity-100'
                              : 'scale-95 opacity-0 blur-sm'
                          }`}
                        >
                          <img
                            src="/data-visualization-dashboard-with-interactive-char.jpg"
                            alt="Data Visualization Dashboard"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-page-border-solid border-page-border-solid flex items-start justify-center self-stretch border-t border-b">
                <div className="relative w-4 self-stretch overflow-hidden sm:w-6 md:w-8 lg:w-12">
                  {/* Left decorative pattern */}
                  <div className="absolute top-[-120px] left-[-40px] flex w-[120px] flex-col items-start justify-start sm:left-[-50px] sm:w-[140px] md:left-[-58px] md:w-[162px]">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="outline-page-border-solid h-3 origin-top-left rotate-[-45deg] self-stretch outline outline-[0.5px] outline-offset-[-0.25px] sm:h-4"
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-1 flex-col items-stretch justify-center gap-0 px-0 sm:px-2 md:flex-row md:px-0">
                  {/* Feature Cards */}
                  <FeatureCard
                    title="Plan your schedules"
                    description="Streamline customer subscriptions and billing with automated scheduling tools."
                    isActive={activeCard === 0}
                    progress={activeCard === 0 ? progress : 0}
                    onClick={() => handleCardClick(0)}
                  />
                  <FeatureCard
                    title="Analytics & insights"
                    description="Transform your business data into actionable insights with real-time analytics."
                    isActive={activeCard === 1}
                    progress={activeCard === 1 ? progress : 0}
                    onClick={() => handleCardClick(1)}
                  />
                  <FeatureCard
                    title="Collaborate seamlessly"
                    description="Keep your team aligned with shared dashboards and collaborative workflows."
                    isActive={activeCard === 2}
                    progress={activeCard === 2 ? progress : 0}
                    onClick={() => handleCardClick(2)}
                  />
                </div>

                <div className="relative w-4 self-stretch overflow-hidden sm:w-6 md:w-8 lg:w-12">
                  {/* Right decorative pattern */}
                  <div className="absolute top-[-120px] left-[-40px] flex w-[120px] flex-col items-start justify-start sm:left-[-50px] sm:w-[140px] md:left-[-58px] md:w-[162px]">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="outline-page-border-solid h-3 origin-top-left rotate-[-45deg] self-stretch outline outline-[0.5px] outline-offset-[-0.25px] sm:h-4"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Social Proof Section */}
              <div className="border-page-border-solid flex w-full flex-col items-center justify-center border-b">
                <div className="border-page-border-solid flex items-center justify-center gap-6 self-stretch border-b px-4 py-8 sm:px-6 sm:py-12 md:px-24 md:py-16">
                  <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-3 overflow-hidden rounded-lg px-4 py-4 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] shadow-none sm:gap-4 sm:px-6 sm:py-5 dark:shadow-[0px_2px_4px_rgba(0,0,0,0.2)]">
                    <Badge
                      icon={
                        <svg
                          width="12"
                          height="10"
                          viewBox="0 0 12 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect
                            x="1"
                            y="3"
                            width="4"
                            height="6"
                            stroke="currentColor"
                            strokeWidth="1"
                            fill="none"
                            className="stroke-page-badge-foreground"
                          />
                          <rect
                            x="7"
                            y="1"
                            width="4"
                            height="8"
                            stroke="currentColor"
                            strokeWidth="1"
                            fill="none"
                            className="stroke-page-badge-foreground"
                          />
                          <rect
                            x="2"
                            y="4"
                            width="1"
                            height="1"
                            fill="currentColor"
                            className="fill-page-badge-foreground"
                          />
                          <rect
                            x="3.5"
                            y="4"
                            width="1"
                            height="1"
                            fill="currentColor"
                            className="fill-page-badge-foreground"
                          />
                          <rect
                            x="2"
                            y="5.5"
                            width="1"
                            height="1"
                            fill="currentColor"
                            className="fill-page-badge-foreground"
                          />
                          <rect
                            x="3.5"
                            y="5.5"
                            width="1"
                            height="1"
                            fill="currentColor"
                            className="fill-page-badge-foreground"
                          />
                          <rect
                            x="8"
                            y="2"
                            width="1"
                            height="1"
                            fill="currentColor"
                            className="fill-page-badge-foreground"
                          />
                          <rect
                            x="9.5"
                            y="2"
                            width="1"
                            height="1"
                            fill="currentColor"
                            className="fill-page-badge-foreground"
                          />
                          <rect
                            x="8"
                            y="3.5"
                            width="1"
                            height="1"
                            fill="currentColor"
                            className="fill-page-badge-foreground"
                          />
                          <rect
                            x="9.5"
                            y="3.5"
                            width="1"
                            height="1"
                            fill="currentColor"
                            className="fill-page-badge-foreground"
                          />
                          <rect
                            x="8"
                            y="5"
                            width="1"
                            height="1"
                            fill="currentColor"
                            className="fill-page-badge-foreground"
                          />
                          <rect
                            x="9.5"
                            y="5"
                            width="1"
                            height="1"
                            fill="currentColor"
                            className="fill-page-badge-foreground"
                          />
                        </svg>
                      }
                      text="Social Proof"
                    />
                    <div className="text-page-foreground flex w-full max-w-[472.55px] flex-col justify-center text-center font-sans text-xl leading-tight font-semibold tracking-tight sm:text-2xl md:text-3xl md:leading-[60px] lg:text-5xl">
                      Confidence backed by results
                    </div>
                    <div className="text-page-muted self-stretch text-center font-sans text-sm leading-6 font-normal sm:text-base sm:leading-7">
                      Our customers achieve more each day
                      <br className="hidden sm:block" />
                      because their tools are simple, powerful, and clear.
                    </div>
                  </div>
                </div>

                {/* Logo Grid */}
                <div className="border-page-border-solid flex items-start justify-center self-stretch border-t border-b-0">
                  <div className="relative w-4 self-stretch overflow-hidden sm:w-6 md:w-8 lg:w-12">
                    {/* Left decorative pattern */}
                    <div className="absolute top-[-120px] left-[-40px] flex w-[120px] flex-col items-start justify-start sm:left-[-50px] sm:w-[140px] md:left-[-58px] md:w-[162px]">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div
                          key={i}
                          className="outline-page-border-solid h-3 origin-top-left rotate-[-45deg] self-stretch outline outline-[0.5px] outline-offset-[-0.25px] sm:h-4"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="border-page-border-solid grid flex-1 grid-cols-2 gap-0 border-r border-l sm:grid-cols-4 md:grid-cols-4">
                    {/* Logo Grid - Responsive grid */}
                    {Array.from({ length: 8 }).map((_, index) => {
                      const isMobileFirstColumn = index % 2 === 0;
                      const isMobileLastColumn = index % 2 === 1;
                      const isDesktopFirstColumn = index % 4 === 0;
                      const isDesktopLastColumn = index % 4 === 3;
                      const isMobileBottomRow = index >= 6;
                      const isDesktopTopRow = index < 4;
                      const isDesktopBottomRow = index >= 4;

                      return (
                        <div
                          key={index}
                          className={`xs:h-28 xs:gap-2 border-page-border-solid flex h-24 items-center justify-center gap-1 border-b sm:h-32 sm:gap-3 md:h-36 lg:h-40 ${index < 6 ? 'sm:border-b-[0.5px]' : 'sm:border-b'} ${index >= 6 ? 'border-b' : ''} ${isMobileFirstColumn ? 'border-r-[0.5px]' : ''} sm:border-r-[0.5px] sm:border-l-0 ${isDesktopFirstColumn ? 'md:border-l' : 'md:border-l-[0.5px]'} ${isDesktopLastColumn ? 'md:border-r' : 'md:border-r-[0.5px]'} ${isDesktopTopRow ? 'md:border-b-[0.5px]' : ''} ${isDesktopBottomRow ? 'md:border-t-[0.5px] md:border-b' : ''} border-page-border-solid`}
                        >
                          <div className="xs:w-7 xs:h-7 relative h-6 w-6 overflow-hidden rounded-full shadow-[0px_-4px_8px_rgba(255,255,255,0.64)_inset] sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 dark:shadow-[0px_-4px_8px_rgba(0,0,0,0.3)_inset]">
                            <img
                              src="/horizon-icon.svg"
                              alt="Horizon"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="text-page-foreground xs:text-base flex flex-col justify-center text-center font-sans text-sm leading-tight font-medium sm:text-lg md:text-xl md:leading-9 lg:text-2xl">
                            Acute
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="relative w-4 self-stretch overflow-hidden sm:w-6 md:w-8 lg:w-12">
                    {/* Right decorative pattern */}
                    <div className="absolute top-[-120px] left-[-40px] flex w-[120px] flex-col items-start justify-start sm:left-[-50px] sm:w-[140px] md:left-[-58px] md:w-[162px]">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div
                          key={i}
                          className="outline-page-border-solid h-3 origin-top-left rotate-[-45deg] self-stretch outline outline-[0.5px] outline-offset-[-0.25px] sm:h-4"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Grid Section */}
              <div className="border-page-border-solid flex w-full flex-col items-center justify-center border-b">
                {/* Header Section */}
                <div className="border-page-border-solid flex items-center justify-center gap-6 self-stretch border-b px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16 lg:w-[1060px] lg:max-w-[1060px] lg:px-0">
                  <div className="flex w-full max-w-[616px] flex-col items-center justify-start gap-3 overflow-hidden rounded-lg px-4 py-4 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] shadow-none sm:gap-4 sm:px-6 sm:py-5 lg:w-[616px] dark:shadow-[0px_2px_4px_rgba(0,0,0,0.2)]">
                    <Badge
                      icon={
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect
                            x="1"
                            y="1"
                            width="4"
                            height="4"
                            stroke="currentColor"
                            strokeWidth="1"
                            fill="none"
                            className="stroke-page-badge-foreground"
                          />
                          <rect
                            x="7"
                            y="1"
                            width="4"
                            height="4"
                            stroke="currentColor"
                            strokeWidth="1"
                            fill="none"
                            className="stroke-page-badge-foreground"
                          />
                          <rect
                            x="1"
                            y="7"
                            width="4"
                            height="4"
                            stroke="currentColor"
                            strokeWidth="1"
                            fill="none"
                            className="stroke-page-badge-foreground"
                          />
                          <rect
                            x="7"
                            y="7"
                            width="4"
                            height="4"
                            stroke="currentColor"
                            strokeWidth="1"
                            fill="none"
                            className="stroke-page-badge-foreground"
                          />
                        </svg>
                      }
                      text="Bento grid"
                    />
                    <div className="text-page-foreground flex w-full max-w-[598.06px] flex-col justify-center text-center font-sans text-xl leading-tight font-semibold tracking-tight sm:text-2xl md:text-3xl md:leading-[60px] lg:w-[598.06px] lg:text-5xl">
                      Built for absolute clarity and focused work
                    </div>
                    <div className="text-page-muted self-stretch text-center font-sans text-sm leading-6 font-normal sm:text-base sm:leading-7">
                      Stay focused with tools that organize, connect
                      <br />
                      and turn information into confident decisions.
                    </div>
                  </div>
                </div>

                {/* Bento Grid Content */}
                <div className="flex items-start justify-center self-stretch">
                  <div className="relative w-4 self-stretch overflow-hidden sm:w-6 md:w-8 lg:w-12">
                    {/* Left decorative pattern */}
                    <div className="absolute top-[-120px] left-[-40px] flex w-[120px] flex-col items-start justify-start sm:left-[-50px] sm:w-[140px] md:left-[-58px] md:w-[162px]">
                      {Array.from({ length: 200 }).map((_, i) => (
                        <div
                          key={i}
                          className="outline-page-border-solid h-3 origin-top-left rotate-[-45deg] self-stretch outline outline-[0.5px] outline-offset-[-0.25px] sm:h-4"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="border-page-border-solid grid flex-1 grid-cols-1 gap-0 border-r border-l md:grid-cols-2">
                    {/* Top Left - Smart. Simple. Brilliant. */}
                    <div className="border-page-border-solid flex flex-col items-start justify-start gap-4 border-r-0 border-b p-4 sm:gap-6 sm:p-6 md:border-r md:p-8 lg:p-12">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-page-foreground font-sans text-lg leading-tight font-semibold sm:text-xl">
                          Smart. Simple. Brilliant.
                        </h3>
                        <p className="text-page-muted font-sans text-sm leading-relaxed font-normal md:text-base">
                          Your data is beautifully organized so you see everything clearly without
                          the clutter.
                        </p>
                      </div>
                      <div className="flex h-[200px] w-full items-center justify-center overflow-hidden rounded-lg sm:h-[250px] md:h-[300px]">
                        <SmartSimpleBrilliant
                          width="100%"
                          height="100%"
                          theme="light"
                          className="scale-50 sm:scale-65 md:scale-75 lg:scale-90"
                        />
                      </div>
                    </div>

                    {/* Top Right - Your work, in sync */}
                    <div className="border-page-border-solid flex flex-col items-start justify-start gap-4 border-b p-4 sm:gap-6 sm:p-6 md:p-8 lg:p-12">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-page-foreground font-sans text-lg leading-tight font-semibold sm:text-xl">
                          Your work, in sync
                        </h3>
                        <p className="text-page-muted font-sans text-sm leading-relaxed font-normal md:text-base">
                          Every update flows instantly across your team and keeps collaboration
                          effortless and fast.
                        </p>
                      </div>
                      <div className="flex h-[200px] w-full items-center justify-center overflow-hidden rounded-lg text-right sm:h-[250px] md:h-[300px]">
                        <YourWorkInSync
                          width="400"
                          height="250"
                          theme="light"
                          className="scale-60 sm:scale-75 md:scale-90"
                        />
                      </div>
                    </div>

                    {/* Bottom Left - Effortless integration */}
                    <div className="border-page-border-solid flex flex-col items-start justify-start gap-4 border-r-0 bg-transparent p-4 sm:gap-6 sm:p-6 md:border-r md:p-8 lg:p-12">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-page-foreground font-sans text-lg leading-tight font-semibold sm:text-xl">
                          Effortless integration
                        </h3>
                        <p className="text-page-muted font-sans text-sm leading-relaxed font-normal md:text-base">
                          All your favorite tools connect in one place and work together seamlessly
                          by design.
                        </p>
                      </div>
                      <div className="relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-lg bg-transparent sm:h-[250px] md:h-[300px]">
                        <div className="flex h-full w-full items-center justify-center bg-transparent">
                          <EffortlessIntegration
                            width={400}
                            height={250}
                            className="max-h-full max-w-full"
                          />
                        </div>
                        {/* Gradient mask for soft bottom edge */}
                        <div className="from-page-background pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-gradient-to-t to-transparent"></div>
                      </div>
                    </div>

                    {/* Bottom Right - Numbers that speak */}
                    <div className="flex flex-col items-start justify-start gap-4 p-4 sm:gap-6 sm:p-6 md:p-8 lg:p-12">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-page-foreground font-sans text-lg leading-tight font-semibold sm:text-xl">
                          Numbers that speak
                        </h3>
                        <p className="text-page-muted font-sans text-sm leading-relaxed font-normal md:text-base">
                          Track growth with precision and turn raw data into confident decisions you
                          can trust.
                        </p>
                      </div>
                      <div className="relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-lg sm:h-[250px] md:h-[300px]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <NumbersThatSpeak
                            width="100%"
                            height="100%"
                            theme="light"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        {/* Gradient mask for soft bottom edge */}
                        <div className="from-page-background pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-gradient-to-t to-transparent"></div>
                        {/* Fallback content if component doesn't render */}
                        <div className="absolute inset-0 flex hidden items-center justify-center opacity-20">
                          <div className="flex flex-col items-center gap-2 p-4">
                            <div className="h-full w-3/4 rounded-full bg-green-500"></div>
                          </div>
                          <div className="text-sm text-green-600">Growth Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative w-4 self-stretch overflow-hidden sm:w-6 md:w-8 lg:w-12">
                    {/* Right decorative pattern */}
                    <div className="absolute top-[-120px] left-[-40px] flex w-[120px] flex-col items-start justify-start sm:left-[-50px] sm:w-[140px] md:left-[-58px] md:w-[162px]">
                      {Array.from({ length: 200 }).map((_, i) => (
                        <div
                          key={i}
                          className="outline-page-border-solid h-3 origin-top-left rotate-[-45deg] self-stretch outline outline-[0.5px] outline-offset-[-0.25px] sm:h-4"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentation Section */}
              <DocumentationSection />

              {/* Testimonials Section */}
              <TestimonialsSection />

              {/* Pricing Section */}
              <PricingSection />

              {/* FAQ Section */}
              <FAQSection />

              {/* CTA Section */}
              <CTASection />

              {/* Footer Section */}
              <FooterSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// FeatureCard component definition inline to fix import error
function FeatureCard({
  title,
  description,
  isActive,
  progress,
  onClick,
}: {
  title: string;
  description: string;
  isActive: boolean;
  progress: number;
  onClick: () => void;
}) {
  return (
    <div
      className={`relative flex w-full cursor-pointer flex-col items-start justify-start gap-2 self-stretch overflow-hidden border-b px-6 py-5 last:border-b-0 md:flex-1 md:border-b-0 ${
        isActive
          ? 'bg-page-card shadow-[0px_0px_0px_0.75px_var(--page-border-solid)_inset]'
          : 'border-page-border-solid border-r-0 border-l-0 md:border'
      }`}
      onClick={onClick}
    >
      {isActive && (
        <div className="bg-page-border-solid absolute top-0 left-0 h-0.5 w-full">
          <div
            className="bg-page-button h-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="text-page-foreground flex flex-col justify-center self-stretch font-sans text-sm leading-6 font-semibold md:text-sm md:leading-6">
        {title}
      </div>
      <div className="text-page-muted self-stretch font-sans text-[13px] leading-[22px] font-normal md:text-[13px] md:leading-[22px]">
        {description}
      </div>
    </div>
  );
}
