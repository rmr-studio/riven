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

export default function DocumentationSection() {
  const [activeCard, setActiveCard] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  const cards = [
    {
      title: 'Plan your schedules',
      description: 'Explore your data, build your dashboard,\nbring your team together.',
      image: '/modern-dashboard-interface-with-data-visualization.jpg',
    },
    {
      title: 'Data to insights in minutes',
      description: 'Transform raw data into actionable insights\nwith powerful analytics tools.',
      image: '/analytics-dashboard.png',
    },
    {
      title: 'Collaborate seamlessly',
      description: 'Work together in real-time with your team\nand share insights instantly.',
      image: '/team-collaboration-interface-with-shared-workspace.jpg',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cards.length);
      setAnimationKey((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [cards.length]);

  const handleCardClick = (index: number) => {
    setActiveCard(index);
    setAnimationKey((prev) => prev + 1);
  };

  return (
    <div className="flex w-full flex-col items-center justify-center border-b border-[rgba(55,50,47,0.12)]">
      {/* Header Section */}
      <div className="flex items-center justify-center gap-6 self-stretch border-b border-[rgba(55,50,47,0.12)] px-6 py-12 md:px-24 md:py-16">
        <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-4 overflow-hidden rounded-lg px-6 py-5 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] shadow-none">
          <Badge
            icon={
              <div className="h-[10.50px] w-[10.50px] rounded-full outline outline-[1.17px] outline-offset-[-0.58px] outline-[#37322F]"></div>
            }
            text="Platform Features"
          />
          <div className="flex flex-col justify-center self-stretch text-center font-sans text-3xl leading-tight font-semibold tracking-tight text-[#49423D] md:text-5xl md:leading-[60px]">
            Streamline your business operations
          </div>
          <div className="self-stretch text-center font-sans text-base leading-7 font-normal text-[#605A57]">
            Manage schedules, analyze data, and collaborate with your team
            <br />
            all in one powerful platform.
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex items-center justify-start self-stretch overflow-hidden px-4 md:px-9">
        <div className="flex flex-1 flex-col items-center justify-start gap-6 py-8 md:flex-row md:gap-12 md:py-11">
          {/* Left Column - Feature Cards */}
          <div className="order-2 flex w-full flex-col items-center justify-center gap-4 md:order-1 md:w-auto md:max-w-[400px]">
            {cards.map((card, index) => {
              const isActive = index === activeCard;

              return (
                <div
                  key={index}
                  onClick={() => handleCardClick(index)}
                  className={`flex w-full cursor-pointer flex-col items-start justify-start overflow-hidden transition-all duration-300 ${
                    isActive
                      ? 'bg-white shadow-[0px_0px_0px_0.75px_#E0DEDB_inset]'
                      : 'border border-[rgba(2,6,23,0.08)]'
                  }`}
                >
                  <div
                    className={`h-0.5 w-full overflow-hidden bg-[rgba(50,45,43,0.08)] ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <div
                      key={animationKey}
                      className="h-0.5 animate-[progressBar_5s_linear_forwards] bg-[#322D2B] will-change-transform"
                    />
                  </div>
                  <div className="flex w-full flex-col gap-2 px-6 py-5">
                    <div className="flex flex-col justify-center self-stretch font-sans text-sm leading-6 font-semibold text-[#49423D]">
                      {card.title}
                    </div>
                    <div className="self-stretch font-sans text-[13px] leading-[22px] font-normal whitespace-pre-line text-[#605A57]">
                      {card.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column - Image */}
          <div className="order-1 flex w-full flex-col items-center justify-center gap-2 rounded-lg px-[00] md:order-2 md:w-auto md:px-0">
            <div className="flex h-[250px] w-full flex-col items-start justify-start overflow-hidden rounded-lg bg-white shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)] md:h-[420px] md:w-[580px]">
              <div
                className={`h-full w-full transition-all duration-300 ${
                  activeCard === 0
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100'
                    : activeCard === 1
                      ? 'bg-gradient-to-br from-purple-50 to-purple-100'
                      : 'bg-gradient-to-br from-green-50 to-green-100'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progressBar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
      `}</style>
    </div>
  );
}
