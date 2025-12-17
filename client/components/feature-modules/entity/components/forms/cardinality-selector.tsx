import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/components/ui/rich-editor/lib/utils";
import { EntityRelationshipCardinality } from "@/lib/types/types";
import { Background, Edge, Node, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FC, useState } from "react";
import { EntityType } from "../../interface/entity.interface";

interface CardinalitySelectorProps {
    value?: EntityRelationshipCardinality;
    onValueChange: (value: EntityRelationshipCardinality) => void;
    sourceEntity?: EntityType;
    targetEntity?: EntityType;
    className?: string;
}

interface CardinalityOption {
    value: EntityRelationshipCardinality;
    label: string;
    description: string;
}

const cardinalityOptions: CardinalityOption[] = [
    {
        value: EntityRelationshipCardinality.ONE_TO_ONE,
        label: "One to one",
        description:
            "Connects a single reference of your object to a single reference of another object (e.g. One person has one passport)",
    },
    {
        value: EntityRelationshipCardinality.ONE_TO_MANY,
        label: "One to many",
        description:
            "Connects a single reference of your object to multiple references of another object (e.g. One company has many employees)",
    },
    {
        value: EntityRelationshipCardinality.MANY_TO_ONE,
        label: "Many to one",
        description:
            "Connects multiple references of your object to a single reference of another object (e.g. Many deals connected to one company)",
    },
    {
        value: EntityRelationshipCardinality.MANY_TO_MANY,
        label: "Many to many",
        description:
            "Connects multiple references of your object to multiple references of another object (e.g. Many students enrolled in many courses)",
    },
];

const createNodes = (
    cardinality: EntityRelationshipCardinality,
    sourceLabel: string,
    targetLabel: string
): { nodes: Node[]; edges: Edge[] } => {
    const nodeStyle = {
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "6px",
        padding: "8px 12px",
        fontSize: "12px",
        color: "hsl(var(--foreground))",
        width: 100,
    };

    const edgeStyle = {
        stroke: "hsl(var(--primary))",
        strokeWidth: 2,
    };

    switch (cardinality) {
        case EntityRelationshipCardinality.ONE_TO_ONE: {
            const nodes: Node[] = [
                {
                    id: "source-1",
                    type: "default",
                    position: { x: 20, y: 60 },
                    data: { label: sourceLabel },
                    style: nodeStyle,
                },
                {
                    id: "target-1",
                    type: "default",
                    position: { x: 200, y: 60 },
                    data: { label: targetLabel },
                    style: nodeStyle,
                },
            ];

            const edges: Edge[] = [
                {
                    id: "e1",
                    source: "source-1",
                    target: "target-1",
                    style: edgeStyle,
                },
            ];

            return { nodes, edges };
        }

        case EntityRelationshipCardinality.ONE_TO_MANY: {
            const nodes: Node[] = [
                {
                    id: "source-1",
                    type: "default",
                    position: { x: 20, y: 60 },
                    data: { label: sourceLabel },
                    style: nodeStyle,
                },
                {
                    id: "target-1",
                    type: "default",
                    position: { x: 200, y: 20 },
                    data: { label: targetLabel },
                    style: nodeStyle,
                },
                {
                    id: "target-2",
                    type: "default",
                    position: { x: 200, y: 65 },
                    data: { label: targetLabel },
                    style: nodeStyle,
                },
                {
                    id: "target-3",
                    type: "default",
                    position: { x: 200, y: 110 },
                    data: { label: targetLabel },
                    style: nodeStyle,
                },
            ];

            const edges: Edge[] = [
                {
                    id: "e1",
                    source: "source-1",
                    target: "target-1",
                    style: edgeStyle,
                },
                {
                    id: "e2",
                    source: "source-1",
                    target: "target-2",
                    style: edgeStyle,
                },
                {
                    id: "e3",
                    source: "source-1",
                    target: "target-3",
                    style: edgeStyle,
                },
            ];

            return { nodes, edges };
        }

        case EntityRelationshipCardinality.MANY_TO_ONE: {
            const nodes: Node[] = [
                {
                    id: "source-1",
                    type: "default",
                    position: { x: 20, y: 20 },
                    data: { label: sourceLabel },
                    style: nodeStyle,
                },
                {
                    id: "source-2",
                    type: "default",
                    position: { x: 20, y: 65 },
                    data: { label: sourceLabel },
                    style: nodeStyle,
                },
                {
                    id: "source-3",
                    type: "default",
                    position: { x: 20, y: 110 },
                    data: { label: sourceLabel },
                    style: nodeStyle,
                },
                {
                    id: "target-1",
                    type: "default",
                    position: { x: 200, y: 60 },
                    data: { label: targetLabel },
                    style: nodeStyle,
                },
            ];

            const edges: Edge[] = [
                {
                    id: "e1",
                    source: "source-1",
                    target: "target-1",
                    style: edgeStyle,
                },
                {
                    id: "e2",
                    source: "source-2",
                    target: "target-1",
                    style: edgeStyle,
                },
                {
                    id: "e3",
                    source: "source-3",
                    target: "target-1",
                    style: edgeStyle,
                },
            ];

            return { nodes, edges };
        }

        case EntityRelationshipCardinality.MANY_TO_MANY: {
            const nodes: Node[] = [
                {
                    id: "source-1",
                    type: "default",
                    position: { x: 20, y: 30 },
                    data: { label: sourceLabel },
                    style: nodeStyle,
                },
                {
                    id: "source-2",
                    type: "default",
                    position: { x: 20, y: 80 },
                    data: { label: sourceLabel },
                    style: nodeStyle,
                },
                {
                    id: "target-1",
                    type: "default",
                    position: { x: 200, y: 30 },
                    data: { label: targetLabel },
                    style: nodeStyle,
                },
                {
                    id: "target-2",
                    type: "default",
                    position: { x: 200, y: 80 },
                    data: { label: targetLabel },
                    style: nodeStyle,
                },
            ];

            const edges: Edge[] = [
                {
                    id: "e1",
                    source: "source-1",
                    target: "target-1",
                    style: edgeStyle,
                },
                {
                    id: "e2",
                    source: "source-1",
                    target: "target-2",
                    style: edgeStyle,
                },
                {
                    id: "e3",
                    source: "source-2",
                    target: "target-1",
                    style: edgeStyle,
                },
                {
                    id: "e4",
                    source: "source-2",
                    target: "target-2",
                    style: edgeStyle,
                },
            ];

            return { nodes, edges };
        }

        default:
            return { nodes: [], edges: [] };
    }
};

export const CardinalitySelector: FC<CardinalitySelectorProps> = ({
    value,
    onValueChange,
    sourceEntity,
    targetEntity,
    className,
}) => {
    const [hoveredOption, setHoveredOption] = useState<EntityRelationshipCardinality | null>(null);

    const sourceLabel = sourceEntity?.name?.plural || "Source";
    const targetLabel = targetEntity?.name?.plural || "Target";

    // Show diagram for hovered option, or fall back to selected value
    const displayOption = hoveredOption || value;
    const displayData = displayOption ? createNodes(displayOption, sourceLabel, targetLabel) : null;
    const displayInfo = cardinalityOptions.find((o) => o.value === displayOption);

    return (
        <Card className={cn("w-full overflow-hidden py-2", className)}>
            <CardContent className="flex flex-col md:flex-row min-h-72 p-0">
                {/* Left side - Options */}
                <div className="border-r bg-muted/30 w-full md:w-1/3 lg:w-48 flex flex-row md:flex-col">
                    {cardinalityOptions.map((option, index) => {
                        const isSelected = value === option.value;
                        const isHovered = hoveredOption === option.value;

                        return (
                            <Button
                                key={option.value}
                                type="button"
                                variant={"ghost"}
                                onClick={() => onValueChange(option.value)}
                                onMouseEnter={() => setHoveredOption(option.value)}
                                onMouseLeave={() => setHoveredOption(null)}
                                className={`
                                        w-full py-3 text-left transition-colors rounded-none h-10
                                        ${index !== 0 ? "border-t" : ""}
                                        ${
                                            isSelected
                                                ? "bg-primary/10 border-l-2 border-l-primary"
                                                : "border-l-2 border-l-transparent"
                                        }
                                        ${isHovered && !isSelected ? "bg-muted" : ""}
                                        hover:bg-muted
                                    `}
                            >
                                <div className="font-medium text-sm">{option.label}</div>
                            </Button>
                        );
                    })}
                </div>

                {/* Right side - Diagram */}
                <div className="p-4 bg-background w-auto grow">
                    {displayData && displayInfo ? (
                        <>
                            <div className="mb-3">
                                <h4 className="font-semibold text-sm">{displayInfo.label}</h4>
                                <p className="text-xs max-w-md text-muted-foreground mt-1">
                                    {displayInfo.description}
                                </p>
                            </div>
                            <div className="h-[180px] border rounded bg-card">
                                <ReactFlow
                                    nodes={displayData.nodes}
                                    edges={displayData.edges}
                                    fitView
                                    nodesDraggable={false}
                                    nodesConnectable={false}
                                    elementsSelectable={false}
                                    zoomOnScroll={false}
                                    panOnScroll={false}
                                    panOnDrag={false}
                                    zoomOnDoubleClick={false}
                                    preventScrolling={false}
                                >
                                    <Background />
                                </ReactFlow>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            Select a cardinality type
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
