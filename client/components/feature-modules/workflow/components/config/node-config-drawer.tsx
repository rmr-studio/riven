"use client";

import { useCallback, useEffect, type FC } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useWorkflowNodes,
  useSelectNode,
  useUpdateNodeData,
  useNodeConfigSchemas,
  useSchemasLoading,
} from "../../context/workflow-canvas-provider";
import { NodeConfigForm } from "./node-config-form";
import { frontendToBackendKey } from "../../util/node-type-mapping.util";
import { nodeTypeDefinitions } from "../../config/node-types.config";

interface NodeConfigDrawerProps {
  /** Workspace ID for entity widgets */
  workspaceId: string;
  /** Optional node ID override - used during exit animation to render stale data */
  nodeId?: string | null;
}

/**
 * Right-side drawer displaying configuration form for selected node
 *
 * Features:
 * - Shows node icon, label, and description in header
 * - Loads config schema from backend based on node type
 * - Renders dynamic form with immediate value sync
 * - Close button to deselect node
 * - Escape key to close drawer (CONFIG-08)
 */
export const NodeConfigDrawer: FC<NodeConfigDrawerProps> = ({ workspaceId, nodeId }) => {
  const nodes = useWorkflowNodes();
  const selectNode = useSelectNode();
  const updateNodeData = useUpdateNodeData();
  const schemas = useNodeConfigSchemas();
  const schemasLoading = useSchemasLoading();

  // Find the node by the provided nodeId prop (supports exit animation with stale ID)
  const node = nodeId ? nodes.find((n) => n.id === nodeId) : undefined;

  const handleClose = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Handle Escape key to close drawer (CONFIG-08)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && node) {
        event.preventDefault();
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [node, handleClose]);

  const handleValuesChange = useCallback(
    (values: Record<string, unknown>) => {
      if (!node) return;

      // Update node data with new config values
      // Set configured to true if any values are set
      const hasConfig = Object.values(values).some(
        (v) => v !== undefined && v !== null && v !== ""
      );
      updateNodeData(node.id, {
        config: values,
        configured: hasConfig,
      });
    },
    [node, updateNodeData]
  );

  if (!node) return null;

  // Get node type definition for icon/label
  const nodeTypeDef = nodeTypeDefinitions[node.type];
  const Icon = nodeTypeDef?.icon ?? node.data.icon;

  // Map frontend node type to backend schema key
  const backendKey = frontendToBackendKey(node.type);
  const configSchema = schemas?.[backendKey] ?? [];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-muted">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {nodeTypeDef?.label ?? node.data.label}
            </h3>
            <p className="text-xs text-muted-foreground">
              {nodeTypeDef?.description ?? node.data.description}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-8 w-8"
          aria-label="Close drawer (Escape)"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      <Separator />

      {/* Form content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {schemasLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                Loading configuration...
              </div>
            </div>
          ) : (
            <NodeConfigForm
              nodeId={node.id}
              nodeType={node.type}
              configSchema={configSchema}
              initialValues={node.data.config}
              onValuesChange={handleValuesChange}
              workspaceId={workspaceId}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
