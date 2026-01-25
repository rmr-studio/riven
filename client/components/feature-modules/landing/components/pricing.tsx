'use client';

import { useState } from 'react';

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('annually');

  const pricing = {
    starter: {
      monthly: 0,
      annually: 0,
    },
    professional: {
      monthly: 20,
      annually: 16, // 20% discount for annual
    },
    enterprise: {
      monthly: 200,
      annually: 160, // 20% discount for annual
    },
  };

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2">
      {/* Header Section */}
      <div className="flex items-center justify-center gap-6 self-stretch border-b border-[rgba(55,50,47,0.12)] px-6 py-12 md:px-24 md:py-16">
        <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-4 overflow-hidden rounded-lg px-6 py-5 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] shadow-none">
          {/* Pricing Badge */}
          <div className="flex items-center justify-start gap-[8px] overflow-hidden rounded-[90px] border border-[rgba(2,6,23,0.08)] bg-white px-[14px] py-[6px] shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] shadow-xs">
            <div className="relative flex h-[14px] w-[14px] items-center justify-center overflow-hidden">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 1V11M8.5 3H4.75C4.28587 3 3.84075 3.18437 3.51256 3.51256C3.18437 3.84075 3 4.28587 3 4.75C3 5.21413 3.18437 5.65925 3.51256 5.98744C3.84075 6.31563 4.28587 6.5 4.75 6.5H7.25C7.71413 6.5 8.15925 6.68437 8.48744 7.01256C8.81563 7.34075 9 7.78587 9 8.25C9 8.71413 8.81563 9.15925 8.48744 9.48744C8.15925 9.81563 7.71413 10 7.25 10H3.5"
                  stroke="#37322F"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col justify-center text-center font-sans text-xs leading-3 font-medium text-[#37322F]">
              Plans & Pricing
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col justify-center self-stretch text-center font-sans text-3xl leading-tight font-semibold tracking-tight text-[#49423D] md:text-5xl md:leading-[60px]">
            Choose the perfect plan for your business
          </div>

          {/* Description */}
          <div className="self-stretch text-center font-sans text-base leading-7 font-normal text-[#605A57]">
            Scale your operations with flexible pricing that grows with your team.
            <br />
            Start free, upgrade when you're ready.
          </div>
        </div>
      </div>

      {/* Billing Toggle Section */}
      <div className="relative flex items-center justify-center gap-4 self-stretch px-6 py-9 md:px-16">
        {/* Horizontal line */}
        <div className="absolute top-[63px] left-1/2 z-0 h-0 w-full max-w-[1060px] -translate-x-1/2 transform border-t border-[rgba(55,50,47,0.12)]"></div>

        {/* Toggle Container */}
        <div className="relative z-20 flex items-center justify-center rounded-lg border border-[rgba(55,50,47,0.02)] bg-[rgba(55,50,47,0.03)] p-3 backdrop-blur-[44px] backdrop-brightness-110 backdrop-saturate-150 before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-white before:opacity-60">
          <div className="relative flex items-center justify-center gap-[2px] rounded-[99px] border-[0.5px] border-[rgba(55,50,47,0.08)] bg-[rgba(55,50,47,0.10)] p-[2px] shadow-[0px_1px_0px_white]">
            <div
              className={`absolute top-[2px] h-[calc(100%-4px)] w-[calc(50%-1px)] rounded-[99px] bg-white shadow-[0px_2px_4px_rgba(0,0,0,0.08)] transition-all duration-300 ease-in-out ${
                billingPeriod === 'annually' ? 'left-[2px]' : 'right-[2px]'
              }`}
            />

            <button
              onClick={() => setBillingPeriod('annually')}
              className="relative z-10 flex flex-1 items-center justify-center gap-2 rounded-[99px] px-4 py-1 transition-colors duration-300"
            >
              <div
                className={`font-sans text-[13px] leading-5 font-medium transition-colors duration-300 ${
                  billingPeriod === 'annually' ? 'text-[#37322F]' : 'text-[#6B7280]'
                }`}
              >
                Annually
              </div>
            </button>

            <button
              onClick={() => setBillingPeriod('monthly')}
              className="relative z-10 flex flex-1 items-center justify-center gap-2 rounded-[99px] px-4 py-1 transition-colors duration-300"
            >
              <div
                className={`font-sans text-[13px] leading-5 font-medium transition-colors duration-300 ${
                  billingPeriod === 'monthly' ? 'text-[#37322F]' : 'text-[#6B7280]'
                }`}
              >
                Monthly
              </div>
            </button>
          </div>

          {/* Decorative dots */}
          <div className="absolute top-[5.25px] left-[5px] h-[3px] w-[3px] rounded-[99px] bg-[rgba(55,50,47,0.10)] shadow-[0px_0px_0.5px_rgba(0,0,0,0.12)]"></div>
          <div className="absolute top-[5.25px] right-[5px] h-[3px] w-[3px] rounded-[99px] bg-[rgba(55,50,47,0.10)] shadow-[0px_0px_0.5px_rgba(0,0,0,0.12)]"></div>
          <div className="absolute bottom-[5.25px] left-[5px] h-[3px] w-[3px] rounded-[99px] bg-[rgba(55,50,47,0.10)] shadow-[0px_0px_0.5px_rgba(0,0,0,0.12)]"></div>
          <div className="absolute right-[5px] bottom-[5.25px] h-[3px] w-[3px] rounded-[99px] bg-[rgba(55,50,47,0.10)] shadow-[0px_0px_0.5px_rgba(0,0,0,0.12)]"></div>
        </div>
      </div>

      {/* Pricing Cards Section */}
      <div className="flex items-center justify-center self-stretch border-t border-b border-[rgba(55,50,47,0.12)]">
        <div className="flex w-full items-start justify-center">
          {/* Left Decorative Pattern */}
          <div className="relative hidden w-12 self-stretch overflow-hidden md:block">
            <div className="absolute top-[-120px] left-[-58px] flex w-[162px] flex-col items-start justify-start">
              {Array.from({ length: 200 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 origin-top-left rotate-[-45deg] self-stretch outline outline-[0.5px] outline-offset-[-0.25px] outline-[rgba(3,7,18,0.08)]"
                ></div>
              ))}
            </div>
          </div>

          {/* Pricing Cards Container */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-12 md:flex-row md:py-0">
            {/* Starter Plan */}
            <div className="flex max-w-full flex-1 flex-col items-start justify-start gap-12 self-stretch overflow-hidden border border-[#E0DEDB] border-[rgba(50,45,43,0.12)] bg-[rgba(255,255,255,0)] px-6 py-5 md:max-w-none">
              {/* Plan Header */}
              <div className="flex flex-col items-center justify-start gap-9 self-stretch">
                <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                  <div className="font-sans text-lg leading-7 font-medium text-[rgba(55,50,47,0.90)]">
                    Starter
                  </div>
                  <div className="w-full max-w-[242px] font-sans text-sm leading-5 font-normal text-[rgba(41,37,35,0.70)]">
                    Perfect for individuals and small teams getting started.
                  </div>
                </div>

                <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                  <div className="flex flex-col items-start justify-start gap-1">
                    <div className="relative flex h-[60px] items-center font-serif text-5xl leading-[60px] font-medium text-[#37322F]">
                      <span className="invisible">${pricing.starter[billingPeriod]}</span>
                      <span
                        className="absolute inset-0 flex items-center transition-all duration-500"
                        style={{
                          opacity: billingPeriod === 'annually' ? 1 : 0,
                          transform: `scale(${billingPeriod === 'annually' ? 1 : 0.8})`,
                          filter: `blur(${billingPeriod === 'annually' ? 0 : 4}px)`,
                        }}
                        aria-hidden={billingPeriod !== 'annually'}
                      >
                        ${pricing.starter.annually}
                      </span>
                      <span
                        className="absolute inset-0 flex items-center transition-all duration-500"
                        style={{
                          opacity: billingPeriod === 'monthly' ? 1 : 0,
                          transform: `scale(${billingPeriod === 'monthly' ? 1 : 0.8})`,
                          filter: `blur(${billingPeriod === 'monthly' ? 0 : 4}px)`,
                        }}
                        aria-hidden={billingPeriod !== 'monthly'}
                      >
                        ${pricing.starter.monthly}
                      </span>
                    </div>
                    <div className="font-sans text-sm font-medium text-[#847971]">
                      per {billingPeriod === 'monthly' ? 'month' : 'year'}, per user.
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center justify-center self-stretch overflow-hidden rounded-[99px] bg-[#37322F] px-4 py-[10px] shadow-[0px_2px_4px_rgba(55,50,47,0.12)]">
                  <div className="absolute top-[-0.5px] left-0 h-[41px] w-full bg-gradient-to-b from-[rgba(255,255,255,0.20)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
                  <div className="flex max-w-[108px] flex-col justify-center font-sans text-[13px] leading-5 font-medium text-[#FBFAF9]">
                    Start for free
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                {[
                  'Up to 3 projects',
                  'Basic documentation tools',
                  'Community support',
                  'Standard templates',
                  'Basic analytics',
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-start gap-[13px] self-stretch"
                  >
                    <div className="relative flex h-4 w-4 items-center justify-center">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="#9CA3AF"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 font-sans text-[12.5px] leading-5 font-normal text-[rgba(55,50,47,0.80)]">
                      {feature}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Professional Plan (Featured) */}
            <div className="flex max-w-full flex-1 flex-col items-start justify-start gap-12 self-stretch overflow-hidden border border-[rgba(50,45,43,0.12)] border-[rgba(55,50,47,0.12)] bg-[#37322F] px-6 py-5 md:max-w-none">
              {/* Plan Header */}
              <div className="flex flex-col items-center justify-start gap-9 self-stretch">
                <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                  <div className="font-sans text-lg leading-7 font-medium text-[#FBFAF9]">
                    Professional
                  </div>
                  <div className="w-full max-w-[242px] font-sans text-sm leading-5 font-normal text-[#B2AEA9]">
                    Advanced features for growing teams and businesses.
                  </div>
                </div>

                <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                  <div className="flex flex-col items-start justify-start gap-1">
                    <div className="relative flex h-[60px] items-center font-serif text-5xl leading-[60px] font-medium text-[#F0EFEE]">
                      <span className="invisible">${pricing.professional[billingPeriod]}</span>
                      <span
                        className="absolute inset-0 flex items-center transition-all duration-500"
                        style={{
                          opacity: billingPeriod === 'annually' ? 1 : 0,
                          transform: `scale(${billingPeriod === 'annually' ? 1 : 0.8})`,
                          filter: `blur(${billingPeriod === 'annually' ? 0 : 4}px)`,
                        }}
                        aria-hidden={billingPeriod !== 'annually'}
                      >
                        ${pricing.professional.annually}
                      </span>
                      <span
                        className="absolute inset-0 flex items-center transition-all duration-500"
                        style={{
                          opacity: billingPeriod === 'monthly' ? 1 : 0,
                          transform: `scale(${billingPeriod === 'monthly' ? 1 : 0.8})`,
                          filter: `blur(${billingPeriod === 'monthly' ? 0 : 4}px)`,
                        }}
                        aria-hidden={billingPeriod !== 'monthly'}
                      >
                        ${pricing.professional.monthly}
                      </span>
                    </div>
                    <div className="font-sans text-sm font-medium text-[#D2C6BF]">
                      per {billingPeriod === 'monthly' ? 'month' : 'year'}, per user.
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="relative flex items-center justify-center self-stretch overflow-hidden rounded-[99px] bg-[#FBFAF9] px-4 py-[10px] shadow-[0px_2px_4px_rgba(55,50,47,0.12)]">
                  <div className="absolute top-[-0.5px] left-0 h-[41px] w-full bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
                  <div className="flex max-w-[108px] flex-col justify-center font-sans text-[13px] leading-5 font-medium text-[#37322F]">
                    Get started
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                {[
                  'Unlimited projects',
                  'Advanced documentation tools',
                  'Priority support',
                  'Custom templates',
                  'Advanced analytics',
                  'Team collaboration',
                  'API access',
                  'Custom integrations',
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-start gap-[13px] self-stretch"
                  >
                    <div className="relative flex h-4 w-4 items-center justify-center">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="#FF8000"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 font-sans text-[12.5px] leading-5 font-normal text-[#F0EFEE]">
                      {feature}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="flex max-w-full flex-1 flex-col items-start justify-start gap-12 self-stretch overflow-hidden border border-[#E0DEDB] bg-white px-6 py-5 md:max-w-none">
              {/* Plan Header */}
              <div className="flex flex-col items-center justify-start gap-9 self-stretch">
                <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                  <div className="font-sans text-lg leading-7 font-medium text-[rgba(55,50,47,0.90)]">
                    Enterprise
                  </div>
                  <div className="w-full max-w-[242px] font-sans text-sm leading-5 font-normal text-[rgba(41,37,35,0.70)]">
                    Complete solution for large organizations and enterprises.
                  </div>
                </div>

                <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                  <div className="flex flex-col items-start justify-start gap-1">
                    <div className="relative flex h-[60px] items-center font-serif text-5xl leading-[60px] font-medium text-[#37322F]">
                      <span className="invisible">${pricing.enterprise[billingPeriod]}</span>
                      <span
                        className="absolute inset-0 flex items-center transition-all duration-500"
                        style={{
                          opacity: billingPeriod === 'annually' ? 1 : 0,
                          transform: `scale(${billingPeriod === 'annually' ? 1 : 0.8})`,
                          filter: `blur(${billingPeriod === 'annually' ? 0 : 4}px)`,
                        }}
                        aria-hidden={billingPeriod !== 'annually'}
                      >
                        ${pricing.enterprise.annually}
                      </span>
                      <span
                        className="absolute inset-0 flex items-center transition-all duration-500"
                        style={{
                          opacity: billingPeriod === 'monthly' ? 1 : 0,
                          transform: `scale(${billingPeriod === 'monthly' ? 1 : 0.8})`,
                          filter: `blur(${billingPeriod === 'monthly' ? 0 : 4}px)`,
                        }}
                        aria-hidden={billingPeriod !== 'monthly'}
                      >
                        ${pricing.enterprise.monthly}
                      </span>
                    </div>
                    <div className="font-sans text-sm font-medium text-[#847971]">
                      per {billingPeriod === 'monthly' ? 'month' : 'year'}, per user.
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center justify-center self-stretch overflow-hidden rounded-[99px] bg-[#37322F] px-4 py-[10px] shadow-[0px_2px_4px_rgba(55,50,47,0.12)]">
                  <div className="absolute top-[-0.5px] left-0 h-[41px] w-full bg-gradient-to-b from-[rgba(255,255,255,0.20)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
                  <div className="flex max-w-[108px] flex-col justify-center font-sans text-[13px] leading-5 font-medium text-[#FBFAF9]">
                    Contact sales
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                {[
                  'Everything in Professional',
                  'Dedicated account manager',
                  '24/7 phone support',
                  'Custom onboarding',
                  'Advanced security features',
                  'SSO integration',
                  'Custom contracts',
                  'White-label options',
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-start gap-[13px] self-stretch"
                  >
                    <div className="relative flex h-4 w-4 items-center justify-center">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="#9CA3AF"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 font-sans text-[12.5px] leading-5 font-normal text-[rgba(55,50,47,0.80)]">
                      {feature}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Decorative Pattern */}
          <div className="relative hidden w-12 self-stretch overflow-hidden md:block">
            <div className="absolute top-[-120px] left-[-58px] flex w-[162px] flex-col items-start justify-start">
              {Array.from({ length: 200 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 origin-top-left rotate-[-45deg] self-stretch outline outline-[0.5px] outline-offset-[-0.25px] outline-[rgba(3,7,18,0.08)]"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
