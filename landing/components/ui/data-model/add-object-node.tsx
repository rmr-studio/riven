"use client";

import { memo } from "react";
import { Handle, Position, type Node } from "@xyflow/react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export interface AddObjectNodeData extends Record<string, unknown> {
  label?: string;
  animationDelay?: number;
}

export type AddObjectNodeType = Node<AddObjectNodeData, "addObjectNode">;

interface AddObjectNodeProps {
  data: AddObjectNodeData;
}

export const AddObjectNode = memo(function AddObjectNode({ data }: AddObjectNodeProps) {
  const delay = data.animationDelay ?? 0;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-muted-foreground/30 !border-0"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        whileHover={{ scale: 1.02 }}
        className="flex items-center justify-center w-[140px] h-[80px] border-2 border-dashed border-blue-400/50 rounded-xl bg-blue-50/30 dark:bg-blue-950/20 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors"
      >
        <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add object</span>
        </div>
      </motion.div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-muted-foreground/30 !border-0"
      />
    </>
  );
});
