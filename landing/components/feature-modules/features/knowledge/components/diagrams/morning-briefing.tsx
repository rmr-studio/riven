export const MorningBriefing = () => {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-neutral-900/80 p-6 shadow-2xl backdrop-blur-sm">
        {/* Traffic lights */}
        <div className="mb-6 flex gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <span className="text-lg text-neutral-400">Good Morning, </span>
            <span className="text-lg font-medium text-white">Sarah.</span>
          </div>
          <p className="text-sm leading-relaxed text-neutral-400">
            You&apos;ve got <span className="font-medium text-white">4 new</span> and{' '}
            <span className="font-medium text-white">5 active</span> conversations.
          </p>

          <button className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white">
            Today&apos;s briefing &rsaquo;
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2">
            <div className="h-4 w-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
            <span className="text-xs text-neutral-500">Start typing to ask or search Riven</span>
          </div>
        </div>
      </div>
    </div>
  );
};
