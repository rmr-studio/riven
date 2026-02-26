import { useEffect, useRef, useState } from 'react';

export function useContainerScale(internalWidth: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / internalWidth));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [internalWidth]);

  return { containerRef, scale };
}
