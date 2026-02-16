const conversations = [
  {
    name: "Ryan Withers",
    label: "Engineering Hiring",
    labelColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    preview: "Re - Looking for help finding...",
  },
  {
    name: "Natasha Corwin",
    label: "Investor Update",
    labelColor: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    preview: "Funding Use & Forecast, Upda...",
  },
  {
    name: "Maya Sterling",
    label: "Team Building - Offsite Retreat",
    labelColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    preview: "Team Building Wee...",
  },
  {
    name: "Lucas O'Connor",
    label: "Strategic Alliances",
    labelColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    preview: "Collaboration Brie...",
  },
];

export const AutoLabelling = () => {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center gap-3 p-4"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent, black 10%, black 80%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black 10%, black 80%, transparent)",
      }}
    >
      {conversations.map((convo) => (
        <div
          key={convo.name}
          className="w-full max-w-sm rounded-xl border border-white/10 bg-neutral-900/60 px-4 py-3 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-700" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-white">{convo.name}</div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-xs ${convo.labelColor}`}
                >
                  {convo.label}
                </span>
                <span className="truncate text-xs text-neutral-500">
                  {convo.preview}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
