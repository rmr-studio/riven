import type { Node, Edge } from "@xyflow/react";

// Helper to add staggered animation delays to nodes
export function addAnimationDelays(nodes: Node[]): Node[] {
  // Separate main nodes (entityNode, addObjectNode) from faded nodes
  const mainNodes = nodes.filter((n) => n.type === "entityNode");
  const fadedNodes = nodes.filter((n) => n.type === "fadedNode");

  // Add delays: main nodes first (0-0.4s), then faded nodes (0.3-0.8s)
  const animatedMainNodes = mainNodes.map((node, index) => ({
    ...node,
    data: {
      ...node.data,
      animationDelay: index * 0.08,
    },
  }));

  const animatedFadedNodes = fadedNodes.map((node, index) => ({
    ...node,
    data: {
      ...node.data,
      animationDelay: 0.25 + index * 0.04,
    },
  }));

  return [...animatedMainNodes, ...animatedFadedNodes];
}

// Helper to add animation delays to edges based on connected nodes
export function addEdgeAnimationDelays(
  edges: Edge[],
  animatedNodes: Node[],
): Edge[] {
  // Create a map of node id to animation delay
  const nodeDelayMap = new Map<string, number>();
  animatedNodes.forEach((node) => {
    const delay =
      (node.data as { animationDelay?: number }).animationDelay ?? 0;
    nodeDelayMap.set(node.id, delay);
  });

  return edges.map((edge) => {
    const sourceDelay = nodeDelayMap.get(edge.source) ?? 0;
    const targetDelay = nodeDelayMap.get(edge.target) ?? 0;
    // Edge appears after both connected nodes have appeared (use the later delay)
    // Add a small offset so the edge starts drawing as the later node finishes appearing
    const edgeDelay = Math.max(sourceDelay, targetDelay) + 0.15;

    return {
      ...edge,
      type: "animatedEdge",
      data: {
        ...edge.data,
        animationDelay: edgeDelay,
      },
    };
  });
}
