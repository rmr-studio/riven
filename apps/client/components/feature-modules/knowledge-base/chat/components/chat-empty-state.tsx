'use client';

export const ChatEmptyState = () => {
  return (
    <div className="flex flex-1 items-center justify-center px-8">
      <div className="flex max-w-md flex-col items-start gap-6">
        <span className="font-display text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Knowledge base
        </span>
        <h2 className="font-serif text-5xl leading-none tracking-tight text-heading">
          Ask anything.
        </h2>
        <p className="text-sm leading-relaxed text-content">
          Riven will answer from what it knows about your workspace — customers,
          documents, workflows — and cite the records it used to get there.
        </p>
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          <li>· What changed in the pipeline this week?</li>
          <li>· Show me customers with stalled renewals.</li>
          <li>· Summarise yesterday&apos;s intake notes.</li>
        </ul>
      </div>
    </div>
  );
};
