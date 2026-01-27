'use client';

export default function CTASection() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden">
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-6 self-stretch border-t border-b border-[rgba(55,50,47,0.12)] px-6 py-12 md:px-24 md:py-12">
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <div className="relative h-full w-full">
            {Array.from({ length: 300 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-4 w-full origin-top-left rotate-[-45deg] outline outline-[0.5px] outline-offset-[-0.25px] outline-[rgba(3,7,18,0.08)]"
                style={{
                  top: `${i * 16 - 120}px`,
                  left: '-100%',
                  width: '300%',
                }}
              ></div>
            ))}
          </div>
        </div>

        <div className="relative z-20 flex w-full max-w-[586px] flex-col items-center justify-start gap-6 overflow-hidden rounded-lg px-6 py-5 md:py-8">
          <div className="flex flex-col items-start justify-start gap-3 self-stretch">
            <div className="flex flex-col justify-center self-stretch text-center font-sans text-3xl leading-tight font-semibold tracking-tight text-[#49423D] md:text-5xl md:leading-[56px]">
              Ready to transform your business?
            </div>
            <div className="self-stretch text-center font-sans text-base leading-7 font-medium text-[#605A57]">
              Join thousands of businesses streamlining their operations,
              <br />
              managing schedules, and growing with data-driven insights.
            </div>
          </div>
          <div className="flex w-full max-w-[497px] flex-col items-center justify-center gap-12">
            <div className="flex items-center justify-start gap-4">
              <div className="relative flex h-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#37322F] px-12 py-[6px] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] transition-colors hover:bg-[#2A2520]">
                <div className="absolute top-0 left-0 h-[41px] w-44 bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
                <div className="flex flex-col justify-center font-sans text-[13px] leading-5 font-medium text-white">
                  Start for free
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
