const Navbar = () => {
  return (
    <div className="absolute top-0 left-0 z-20 flex h-12 w-full items-center justify-center px-6 sm:h-14 sm:px-8 md:h-16 md:px-12 lg:h-[84px] lg:px-0">
      <div className="absolute top-6 left-0 h-0 w-full border-t border-[rgba(55,50,47,0.12)] shadow-[0px_1px_0px_white] sm:top-7 md:top-8 lg:top-[42px]"></div>

      <div className="relative z-30 flex h-10 w-full max-w-[calc(100%-32px)] items-center justify-between overflow-hidden rounded-[50px] bg-[#F7F5F3] px-3 py-1.5 pr-2 shadow-[0px_0px_0px_2px_white] backdrop-blur-sm sm:h-11 sm:max-w-[calc(100%-48px)] sm:px-4 sm:py-2 sm:pr-3 md:h-12 md:max-w-[calc(100%-64px)] md:px-4 lg:w-[700px] lg:max-w-[700px]">
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-start">
            <div className="flex flex-col justify-center font-sans text-sm leading-5 font-medium text-[#2F3037] sm:text-base md:text-lg lg:text-xl">
              Brillance
            </div>
          </div>
          <div className="flex-row items-start justify-start gap-2 pl-3 sm:hidden sm:gap-3 sm:pl-4 md:flex md:gap-4 md:pl-5 lg:gap-4 lg:pl-5">
            <div className="flex items-center justify-start">
              <div className="flex flex-col justify-center font-sans text-xs leading-[14px] font-medium text-[rgba(49,45,43,0.80)] md:text-[13px]">
                Products
              </div>
            </div>
            <div className="flex items-center justify-start">
              <div className="flex flex-col justify-center font-sans text-xs leading-[14px] font-medium text-[rgba(49,45,43,0.80)] md:text-[13px]">
                Pricing
              </div>
            </div>
            <div className="flex items-center justify-start">
              <div className="flex flex-col justify-center font-sans text-xs leading-[14px] font-medium text-[rgba(49,45,43,0.80)] md:text-[13px]">
                Docs
              </div>
            </div>
          </div>
        </div>
        <div className="flex h-6 items-start justify-start gap-2 sm:h-7 sm:gap-3 md:h-8">
          <div className="flex items-center justify-center overflow-hidden rounded-full bg-white px-2 py-1 shadow-[0px_1px_2px_rgba(55,50,47,0.12)] sm:px-3 sm:py-[6px] md:px-[14px]">
            <div className="flex flex-col justify-center font-sans text-xs leading-5 font-medium text-[#37322F] md:text-[13px]">
              Log in
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
