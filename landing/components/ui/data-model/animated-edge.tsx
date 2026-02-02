"use client";

import { memo, useEffect, useState } from "react";
import {
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";

export interface AnimatedEdgeData extends Record<string, unknown> {
  animationDelay?: number;
}

export type AnimatedEdgeType = Edge<AnimatedEdgeData, "animatedEdge">;

export const AnimatedEdge = memo(function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
}: EdgeProps<AnimatedEdgeType>) {
  const [isVisible, setIsVisible] = useState(false);
  const delay = data?.animationDelay ?? 0;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculate approximate path length for the animation
  // For smooth step paths, we can estimate based on the distance
  const dx = Math.abs(targetX - sourceX);
  const dy = Math.abs(targetY - sourceY);
  const estimatedLength = dx + dy + 50; // Add some buffer for the curves

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <>
      {/* Background path for reference (invisible) */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        style={{
          ...style,
          opacity: 0,
        }}
      />
      {/* Animated path */}
      <path
        d={edgePath}
        fill="none"
        style={{
          ...style,
          strokeDasharray: estimatedLength,
          strokeDashoffset: isVisible ? 0 : estimatedLength,
          transition: `stroke-dashoffset 0.5s ease-out, opacity 0.3s ease-out`,
          opacity: isVisible ? (style?.opacity ?? 1) : 0,
        }}
      />
    </>
  );
});
