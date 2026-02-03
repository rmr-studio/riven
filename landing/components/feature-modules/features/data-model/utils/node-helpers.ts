import type { Node } from "@xyflow/react";

// Helper to create faded background nodes
export const createFadedNode = (
  id: string,
  title: string,
  icon: string,
  x: number,
  y: number
): Node => ({
  id,
  type: "fadedNode",
  position: { x, y },
  data: { title, icon },
});

// Helper to create main entity nodes
export const createEntityNode = (
  id: string,
  title: string,
  icon: string,
  badge: string,
  attributes: Array<{ name: string; icon: string }>,
  moreCount: number,
  x: number,
  y: number
): Node => ({
  id,
  type: "entityNode",
  position: { x, y },
  data: { title, icon, badge, attributes, moreCount },
});
