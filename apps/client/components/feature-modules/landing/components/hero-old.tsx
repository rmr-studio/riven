export default function Hero() {
  return (
    <main className="h-screen-without-header relative">
      <div className="absolute bottom-24 left-24 z-20 max-w-3xl">
        <div className="text-left">
          <div
            className="relative mb-4 inline-flex items-center rounded-full bg-white/5 px-3 py-1 backdrop-blur-sm"
            style={{
              filter: 'url(#glass-effect)',
            }}
          >
            <div className="absolute top-0 right-1 left-1 h-px rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="relative z-10 text-xs font-light text-white/90">
              ✨ A new client management experience
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="mb-4 text-5xl font-light tracking-tight text-white md:text-6xl md:leading-16">
            <span className="instrument font-medium italic">Next Generation</span> Client
            <br />
            <span className="font-light tracking-tight text-white">and Invoice Management</span>
          </h1>

          {/* Description */}
          <p className="mb-4 text-xs leading-relaxed font-light text-white/70">
            Create stunning visual experiences with our advanced shader technology. Interactive
            lighting, smooth animations, and beautiful effects that respond to your every move.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button className="cursor-pointer rounded-full border border-white/30 bg-transparent px-8 py-3 text-xs font-normal text-white transition-all duration-200 hover:border-white/50 hover:bg-white/10">
              Pricing
            </button>
            <button className="cursor-pointer rounded-full bg-white px-8 py-3 text-xs font-normal text-black transition-all duration-200 hover:bg-white/90">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
