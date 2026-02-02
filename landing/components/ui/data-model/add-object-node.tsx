"use client";

import { memo } from "react";
import { Handle, Position, type Node } from "@xyflow/react";
import { Plus } from "lucide-react";

export interface AddObjectNodeData extends Record<string, unknown> {
  label?: string;
}

export type AddObjectNodeType = Node<AddObjectNodeData, "addObjectNode">;

export const AddObjectNode = memo(function AddObjectNode() {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-muted-foreground/30 !border-0"
      />
      <div className="flex items-center justify-center w-[140px] h-[80px] border-2 border-dashed border-blue-400/50 rounded-xl bg-blue-50/30 dark:bg-blue-950/20 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors">
        <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add object</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-muted-foreground/30 !border-0"
      />
    </>
  );
});
