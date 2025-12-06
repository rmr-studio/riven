"use client";

import React, { useState } from "react";
import { useBuilder } from "../builder-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { BlockComponentNode, ComponentType } from "../types/builder.types";
import { getAllSchemaPaths } from "../../../util/builder/schema.util";
import {
	Plus,
	Trash2,
	Settings2,
	Info,
	Type,
	Image as ImageIcon,
	Table as TableIcon,
	Layers,
	FileText,
	Layout,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Available component types with metadata
const COMPONENT_TYPES: Array<{
	type: ComponentType;
	name: string;
	description: string;
	icon: React.ReactNode;
	category: "primitive" | "bespoke" | "container";
}> = [
	{
		type: "TEXT",
		name: "Text",
		description: "Display text content",
		icon: <Type className="size-4" />,
		category: "primitive",
	},
	{
		type: "BUTTON",
		name: "Button",
		description: "Action button",
		icon: <span className="size-4">🔘</span>,
		category: "primitive",
	},
	{
		type: "IMAGE",
		name: "Image",
		description: "Display images",
		icon: <ImageIcon className="size-4" />,
		category: "primitive",
	},
	{
		type: "TABLE",
		name: "Table",
		description: "Data table",
		icon: <TableIcon className="size-4" />,
		category: "primitive",
	},
	{
		type: "CONTACT_CARD",
		name: "Contact Card",
		description: "Contact information display",
		icon: <span className="size-4">👤</span>,
		category: "bespoke",
	},
	{
		type: "ADDRESS_CARD",
		name: "Address Card",
		description: "Address display",
		icon: <span className="size-4">📍</span>,
		category: "bespoke",
	},
	{
		type: "LINE_ITEM",
		name: "Line Item",
		description: "List renderer",
		icon: <FileText className="size-4" />,
		category: "primitive",
	},
	{
		type: "LAYOUT_CONTAINER",
		name: "Layout Container",
		description: "Container for nested blocks",
		icon: <Layout className="size-4" />,
		category: "container",
	},
];

/**
 * Step 4: Render Designer Panel (Simplified)
 *
 * Allows adding and configuring components without full Gridstack:
 * - Add components from palette
 * - Configure component props
 * - Create data bindings
 * - Set component order
 */
export const RenderDesignerPanel: React.FC = () => {
	const { state, addComponent, updateComponent, removeComponent, addBinding } = useBuilder();
	const { render, schema } = state;

	const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
	const [isAddingComponent, setIsAddingComponent] = useState(false);

	const components = Object.entries(render.components);
	const hasComponents = components.length > 0;
	const selectedComponent = selectedComponentId ? render.components[selectedComponentId] : null;

	// Get all available schema paths for binding
	const schemaPaths = getAllSchemaPaths(schema);

	const handleAddComponent = (type: ComponentType) => {
		const componentId = `component_${Date.now()}`;
		const newComponent: BlockComponentNode = {
			id: componentId,
			type,
			props: {},
			bindings: [],
			fetchPolicy: "LAZY",
		};

		addComponent(newComponent);
		setSelectedComponentId(componentId);
		setIsAddingComponent(false);
	};

	const handleAddBinding = (prop: string, sourcePath: string) => {
		if (!selectedComponentId) return;

		addBinding(selectedComponentId, {
			prop,
			source: {
				type: "DataPath",
				path: sourcePath,
			},
		});
	};

	return (
		<div className="mx-auto max-w-6xl p-6">
			<div className="mb-6">
				<h2 className="text-2xl font-bold">Render Designer</h2>
				<p className="mt-1 text-muted-foreground">
					Configure how data will be displayed to users
				</p>
			</div>

			{/* Info Alert */}
			<Alert className="mb-6">
				<Info className="size-4" />
				<AlertDescription>
					Add components to define how your block will be rendered. Connect component props
					to schema fields using data bindings.
				</AlertDescription>
			</Alert>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Left: Component List */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold">Components</h3>
						<Button
							size="sm"
							onClick={() => setIsAddingComponent(!isAddingComponent)}
							className="gap-2"
						>
							<Plus className="size-4" />
							Add Component
						</Button>
					</div>

					{/* Add Component Palette */}
					{isAddingComponent && (
						<Card className="border-primary/50 bg-primary/5">
							<CardHeader>
								<CardTitle className="text-base">Select Component Type</CardTitle>
							</CardHeader>
							<CardContent>
								<ScrollArea className="h-[300px] pr-4">
									<div className="space-y-2">
										{COMPONENT_TYPES.map((componentType) => (
											<Button
												key={componentType.type}
												variant="outline"
												className="w-full justify-start gap-3 h-auto p-3"
												onClick={() => handleAddComponent(componentType.type)}
											>
												<div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
													{componentType.icon}
												</div>
												<div className="flex-1 text-left">
													<div className="font-medium">
														{componentType.name}
													</div>
													<div className="text-xs text-muted-foreground">
														{componentType.description}
													</div>
												</div>
												<Badge variant="secondary" className="text-xs">
													{componentType.category}
												</Badge>
											</Button>
										))}
									</div>
								</ScrollArea>
							</CardContent>
						</Card>
					)}

					{/* Components List */}
					{!hasComponents ? (
						<Card className="border-dashed">
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Layers className="mb-4 size-12 text-muted-foreground" />
								<h3 className="mb-2 text-lg font-semibold">No components yet</h3>
								<p className="mb-4 text-center text-sm text-muted-foreground">
									Add your first component to define the render layout
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-2">
							{components.map(([id, component]) => {
								const isSelected = selectedComponentId === id;
								const componentMeta = COMPONENT_TYPES.find(
									(t) => t.type === component.type
								);

								return (
									<Card
										key={id}
										className={`cursor-pointer transition-colors ${
											isSelected
												? "border-primary bg-primary/5"
												: "hover:bg-muted/50"
										}`}
										onClick={() => setSelectedComponentId(id)}
									>
										<CardContent className="p-4">
											<div className="flex items-start justify-between">
												<div className="flex flex-1 items-center gap-3">
													<div className="flex size-10 items-center justify-center rounded-md bg-muted">
														{componentMeta?.icon}
													</div>
													<div className="flex-1">
														<div className="flex items-center gap-2">
															<p className="font-medium">
																{componentMeta?.name || component.type}
															</p>
															<Badge variant="outline" className="text-xs">
																{component.type}
															</Badge>
														</div>
														<p className="mt-1 text-xs text-muted-foreground">
															{component.bindings.length} binding
															{component.bindings.length !== 1 ? "s" : ""}
														</p>
													</div>
												</div>
												<Button
													variant="ghost"
													size="icon"
													className="size-6 text-destructive hover:text-destructive"
													onClick={(e) => {
														e.stopPropagation();
														removeComponent(id);
														if (selectedComponentId === id) {
															setSelectedComponentId(null);
														}
													}}
												>
													<Trash2 className="size-3" />
												</Button>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}
				</div>

				{/* Right: Component Configuration */}
				<div className="lg:sticky lg:top-6 lg:h-fit">
					{selectedComponent && selectedComponentId ? (
						<Card>
							<CardHeader>
								<CardTitle>Component Configuration</CardTitle>
								<CardDescription>
									Configure props and bindings for{" "}
									{COMPONENT_TYPES.find((t) => t.type === selectedComponent.type)
										?.name || selectedComponent.type}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* Component ID */}
								<div className="space-y-2">
									<Label>Component ID</Label>
									<Input
										value={selectedComponentId}
										onChange={(e) => {
											// Would need to handle ID change
										}}
										className="font-mono text-sm"
										disabled
									/>
								</div>

								<Separator />

								{/* Bindings */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Label>Data Bindings</Label>
										<Badge>{selectedComponent.bindings.length}</Badge>
									</div>

									{selectedComponent.bindings.length > 0 ? (
										<div className="space-y-2">
											{selectedComponent.bindings.map((binding, index) => (
												<Card key={index} className="border-dashed">
													<CardContent className="p-3">
														<div className="space-y-2">
															<div>
																<Label className="text-xs text-muted-foreground">
																	Prop
																</Label>
																<p className="font-mono text-sm">
																	{binding.prop}
																</p>
															</div>
															<div>
																<Label className="text-xs text-muted-foreground">
																	Source
																</Label>
																<p className="font-mono text-sm">
																	{binding.source.type === "DataPath"
																		? binding.source.path
																		: "Computed"}
																</p>
															</div>
														</div>
													</CardContent>
												</Card>
											))}
										</div>
									) : (
										<p className="text-sm text-muted-foreground">
											No bindings configured
										</p>
									)}

									{/* Add Binding Form */}
									{schemaPaths.length > 0 && (
										<Card className="border-primary/30 bg-primary/5">
											<CardContent className="p-3 space-y-3">
												<Label className="text-sm">Add New Binding</Label>
												<div className="space-y-2">
													<Input placeholder="Prop name (e.g., text)" />
													<Select>
														<SelectTrigger>
															<SelectValue placeholder="Select data source" />
														</SelectTrigger>
														<SelectContent>
															{schemaPaths.map((path) => (
																<SelectItem
																	key={path.path}
																	value={path.path}
																>
																	<div className="flex items-center gap-2">
																		<span className="font-mono text-xs">
																			{path.displayPath}
																		</span>
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			{path.type}
																		</Badge>
																	</div>
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<Button size="sm" className="w-full" disabled>
														Add Binding
													</Button>
												</div>
											</CardContent>
										</Card>
									)}
								</div>

								<Separator />

								{/* Static Props */}
								<div className="space-y-2">
									<Label>Static Props</Label>
									<p className="text-sm text-muted-foreground">
										Add static properties like variant, size, etc.
									</p>
									<Card className="border-dashed">
										<CardContent className="py-4 text-center text-sm text-muted-foreground">
											Props editor coming soon
										</CardContent>
									</Card>
								</div>
							</CardContent>
						</Card>
					) : (
						<Card className="border-dashed">
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Settings2 className="mb-4 size-12 text-muted-foreground" />
								<h3 className="mb-2 text-lg font-semibold">
									Select a component to configure
								</h3>
								<p className="text-center text-sm text-muted-foreground">
									Click on a component from the list to configure its properties
									and bindings
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* Summary */}
			{hasComponents && (
				<div className="mt-6 rounded-md border bg-muted/50 p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Render Summary</p>
							<p className="text-sm text-muted-foreground">
								{components.length} component{components.length !== 1 ? "s" : ""}{" "}
								configured
							</p>
						</div>
						<div className="flex gap-2">
							{components.some(([_, c]) => c.type === "TEXT") && (
								<Badge variant="secondary">
									{components.filter(([_, c]) => c.type === "TEXT").length} text
								</Badge>
							)}
							{components.some(([_, c]) => c.bindings.length > 0) && (
								<Badge variant="secondary">
									{components.reduce(
										(sum, [_, c]) => sum + c.bindings.length,
										0
									)}{" "}
									bindings
								</Badge>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default RenderDesignerPanel;
