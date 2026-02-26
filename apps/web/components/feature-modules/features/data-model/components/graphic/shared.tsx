import { motion } from 'motion/react';
import { inViewProps, useAnimateOnMount } from './animate-context';

interface EdgePath {
  d: string;
  delay: number;
}

export function GlowEdgePaths({
  edgePaths,
  glowFilterId,
  gradientId,
}: {
  edgePaths: EdgePath[];
  glowFilterId: string;
  gradientId: string;
}) {
  const onMount = useAnimateOnMount();

  // On mobile (onMount), render plain <path> elements — framer-motion's pathLength
  // animation and even simple opacity animation on SVG paths is unreliable in
  // mobile Safari inside overflow-hidden containers.
  if (onMount) {
    return (
      <>
        <g filter={`url(#${glowFilterId})`}>
          {edgePaths.map((edge) => (
            <path
              key={`glow-${edge.d}`}
              d={edge.d}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              opacity="0.6"
            />
          ))}
        </g>
        {edgePaths.map((edge) => (
          <path
            key={`crisp-${edge.d}`}
            d={edge.d}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="1.5"
          />
        ))}
      </>
    );
  }

  return (
    <>
      {/* Glow layer */}
      <g filter={`url(#${glowFilterId})`}>
        {edgePaths.map((edge) => (
          <motion.path
            key={`glow-${edge.d}`}
            d={edge.d}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="2.5"
            strokeOpacity="0.6"
            initial={{ pathLength: 0, opacity: 0 }}
            {...inViewProps(onMount, { pathLength: 1, opacity: 0.6 })}
            transition={{ duration: 0.6, delay: edge.delay }}
          />
        ))}
      </g>
      {/* Crisp layer */}
      {edgePaths.map((edge) => (
        <motion.path
          key={`crisp-${edge.d}`}
          d={edge.d}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          {...inViewProps(onMount, { pathLength: 1, opacity: 1 })}
          transition={{ duration: 0.6, delay: edge.delay }}
        />
      ))}
    </>
  );
}

export function EdgeGlowFilter({ id }: { id: string }) {
  return (
    <filter
      id={id}
      x="-50%"
      y="-50%"
      width="200%"
      height="200%"
      colorInterpolationFilters="sRGB"
    >
      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
      <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
      <feMerge>
        <feMergeNode in="blur2" />
        <feMergeNode in="blur1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}
