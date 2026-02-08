"use client";

import { useState, useCallback, useMemo } from "react";
import { SectionDivider } from "@/components/ui/section-divider";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EntityNode } from "@/components/ui/data-model/entity-node";
import { AddObjectNode } from "@/components/ui/data-model/add-object-node";
import { FadedNode } from "@/components/ui/data-model/faded-node";
import { AnimatedEdge } from "@/components/ui/data-model/animated-edge";
import { DataModelTable } from "@/components/ui/data-model/data-model-table";
import { BGPattern } from "@/components/ui/background/grids";

import { tabs, type TabId } from "../types";
import { nodeConfigurations } from "../config/node-configurations";
import { edgeConfigurations } from "../config/edge-configurations";
import { tableConfigurations } from "../config/table-configurations";
import {
  addAnimationDelays,
  addEdgeAnimationDelays,
} from "../utils/animation-helpers";

const nodeTypes: NodeTypes = {
  entityNode: EntityNode,
  addObjectNode: AddObjectNode,
  fadedNode: FadedNode,
} as NodeTypes;

const edgeTypes: EdgeTypes = {
  animatedEdge: AnimatedEdge,
} as EdgeTypes;

export function DataModelShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>("saas");
  const [animationKey, setAnimationKey] = useState(0);
  const initialNodes = addAnimationDelays(nodeConfigurations["saas"]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    addEdgeAnimationDelays(edgeConfigurations["saas"], initialNodes),
  );

  const handleTabChange = useCallback(
    (tabId: TabId) => {
      if (tabId === activeTab) return;
      setActiveTab(tabId);
      // Add animation delays and increment key to force re-mount
      const animatedNodes = addAnimationDelays(nodeConfigurations[tabId]);
      setNodes(animatedNodes);
      setEdges(
        addEdgeAnimationDelays(edgeConfigurations[tabId], animatedNodes),
      );
      setAnimationKey((prev) => prev + 1);
    },
    [activeTab, setNodes, setEdges],
  );

  const currentTableData = useMemo(
    () => tableConfigurations[activeTab],
    [activeTab],
  );

  return (
    <>
      <section className="pt-8">
        <div className="container relative mx-auto px-4 md:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-6">
              <span className="text-foreground">
                A true focus on structural freedom.
              </span>{" "}
              <span className="text-muted-foreground">
                Our data models and relationships adapt to how you work, not the
                other way around. Because your business is unique, so your
                platform should be too.
              </span>
            </h2>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                onMouseEnter={() => handleTabChange(tab.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-background border-border text-foreground shadow-sm"
                    : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Graph Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative bg-background/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden"
          >
            <div className="h-[500px] md:h-[550px]">
              <ReactFlow
                key={animationKey}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                proOptions={{ hideAttribution: true }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                preventScrolling={false}
              >
                <Background
                  gap={20}
                  size={1}
                  color="var(--color-muted-foreground)"
                  style={{ opacity: 0.15 }}
                />
              </ReactFlow>
            </div>

            {/* Table */}
            <div className="border-t border-border/50">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <DataModelTable
                    headers={currentTableData.headers}
                    rows={currentTableData.rows}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
