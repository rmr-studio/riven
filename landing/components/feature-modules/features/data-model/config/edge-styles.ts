// Main edge style (primary relationships)
export const mainEdgeStyle = {
  stroke: "var(--color-muted-foreground)",
  strokeWidth: 1.5,
  opacity: 0.4,
};

// Faded edge style (secondary to main connections)
export const fadedEdgeStyle = {
  stroke: "var(--color-muted-foreground)",
  strokeWidth: 1,
  opacity: 0.15,
};

// Very faded edge style (inter-secondary connections)
export const interSecondaryEdgeStyle = {
  stroke: "var(--color-muted-foreground)",
  strokeWidth: 0.75,
  opacity: 0.08,
};

// Polymorphic edge style (connects to multiple models)
export const polymorphicEdgeStyle = {
  stroke: "var(--color-muted-foreground)",
  strokeWidth: 0.75,
  opacity: 0.1,
  strokeDasharray: "3,3",
};
