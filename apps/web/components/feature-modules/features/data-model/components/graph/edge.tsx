import { motion } from 'motion/react';
import { FC } from 'react';
import { Bounds, EdgeModel, NodeModel } from '../../types';
import { edgePath } from '../../utils/edge-helpers';

interface Props {
  source: NodeModel;
  target: NodeModel;
  edge: EdgeModel;
  bounds: Bounds;
}

export const Edge: FC<Props> = ({ source, target, edge, bounds }) => {
  const { strokeWidth, opacity } = edge.style;

  const d = edgePath(source, target, bounds.ox, bounds.oy);

  return (
    <motion.path
      key={edge.id}
      d={d}
      fill="none"
      stroke="url(#edgeGradient)"
      strokeWidth={strokeWidth}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: 1,
        opacity,
      }}
      transition={{ duration: 0.6, delay: 0.3 }}
    />
  );
};
