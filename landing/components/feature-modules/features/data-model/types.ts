export const tabs = [
  { id: 'saas', label: 'SaaS' },
  { id: 'agency', label: 'Agencies' },
  { id: 'ecommerce', label: 'E-commerce' },
] as const;

export type TabId = (typeof tabs)[number]['id'];

export type NodeConfigurations = Record<TabId, NodeModel[]>;
export type EdgeConfigurations = Record<TabId, EdgeModel[]>;

export interface Node {
  title: string;
  icon: React.ElementType;
}

export interface Position {
  x: number;
  y: number;
}

export interface Bounds extends Dimensions {
  ox: number;
  oy: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface NodeModel extends Node {
  id: string;
  type: NodeType;
  position: Position;
  dimensions: Dimensions;
  attributes?: Node[];
  moreCount?: number;
  mobile?: {
    position: Position;
    dimensions: Dimensions;
  };
}

export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export interface EdgeModel {
  id: string;
  source: string;
  target: string;
  style: EdgeStyle;
}

export type NodeType = 'primary' | 'secondary';
