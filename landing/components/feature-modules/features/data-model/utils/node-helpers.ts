import { CANVAS_PADDING } from '../components/graph/data-model';
import { Bounds, Dimensions, Node, NodeModel, Position } from '../types';

// Helper to create faded background nodes
export const createSecondaryNode = (
  id: string,
  title: string,
  icon: React.ElementType,
  position: Position,
  dimensions: Dimensions = { width: 110, height: 36 },
  mobile?: { position: Position; dimensions: Dimensions },
): NodeModel => ({
  id,
  type: 'secondary',
  position,
  dimensions,
  title,
  icon,
  ...(mobile && { mobile }),
});

// Helper to create main entity nodes
export const createPrimaryNode = (
  id: string,
  title: string,
  icon: React.ElementType,
  attributes: Node[],
  moreCount: number,
  position: Position,
  dimensions: Dimensions = { width: 220, height: 160 },
  mobile?: { position: Position; dimensions: Dimensions },
): NodeModel => ({
  id,
  type: 'primary',
  position,
  dimensions,
  title,
  icon,
  attributes,
  moreCount,
  ...(mobile && { mobile }),
});

export function computeBounds(nodes: NodeModel[]): Bounds {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + n.dimensions.width);
    maxY = Math.max(maxY, n.position.y + n.dimensions.height);
  }
  return {
    ox: minX - CANVAS_PADDING,
    oy: minY - CANVAS_PADDING,
    width: maxX - minX + CANVAS_PADDING * 2,
    height: maxY - minY + CANVAS_PADDING * 2,
  };
}
