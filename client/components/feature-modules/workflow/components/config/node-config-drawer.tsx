"use client";

import { useCallback, useEffect, type FC } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useSelectedNode,
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
export const NodeConfigDrawer: FC<NodeConfigDrawerProps> = ({ workspaceId }) => {
  const selectedNode = useSelectedNode();
  const selectNode = useSelectNode();
  const updateNodeData = useUpdateNodeData();
  const schemas = useNodeConfigSchemas();
  const schemasLoading = useSchemasLoading();

  const handleClose = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Handle Escape key to close drawer (CONFIG-08)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedNode) {
        event.preventDefault();
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedNode, handleClose]);

  const handleValuesChange = useCallback(
    (values: Record<string, unknown>) => {
      if (!selectedNode) return;

      // Update node data with new config values
      // Set configured to true if any values are set
      const hasConfig = Object.values(values).some(
        (v) => v !== undefined && v !== null && v !== ""
      );
      updateNodeData(selectedNode.id, {
        config: values,
        configured: hasConfig,
      });
    },
    [selectedNode, updateNodeData]
  );

  if (!selectedNode) return null;

  // Get node type definition for icon/label
  const nodeTypeDef = nodeTypeDefinitions[selectedNode.type];
  const Icon = nodeTypeDef?.icon ?? selectedNode.data.icon;

  // Map frontend node type to backend schema key
  const backendKey = frontendToBackendKey(selectedNode.type);
  const configSchema = schemas?.[backendKey] ?? [];

  return (
    <div className="h-full flex flex-col bg-background border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-muted">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {nodeTypeDef?.label ?? selectedNode.data.label}
            </h3>
            <p className="text-xs text-muted-foreground">
              {nodeTypeDef?.description ?? selectedNode.data.description}
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
              nodeId={selectedNode.id}
              nodeType={selectedNode.type}
              configSchema={configSchema}
              initialValues={selectedNode.data.config}
              onValuesChange={handleValuesChange}
              workspaceId={workspaceId}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
