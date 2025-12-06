"use client";

import React, { useState } from "react";
import { useBuilder } from "../builder-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useBlockTypes } from "../../../hooks/use-block-types";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Layers, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Step 5: Nesting Rules Configuration
 *
 * Configure which block types can be nested as children:
 * - Enable/disable nesting
 * - Select allowed block types
 * - Set maximum number of children
 */
export const NestingConfigPanel: React.FC = () => {
	const { state, setNestingEnabled, updateNesting } = useBuilder();
	const { nestingEnabled, nesting } = state;

	// Get organization ID from state (would come from context in real app)
	const organisationId = "demo-org"; // TODO: Get from context
	const { data: blockTypes, isLoading } = useBlockTypes(organisationId);

	const [searchQuery, setSearchQuery] = useState("");

	// Filter block types by search
	const filteredBlockTypes = blockTypes?.filter((type) =>
		type.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const allowedTypes = nesting?.allowedTypes || [];
	const maxChildren = nesting?.max;

	const handleToggleNesting = (enabled: boolean) => {
		setNestingEnabled(enabled);
		if (enabled && !nesting) {
			updateNesting({
				max: undefined,
				allowedTypes: [],
			});
		}
	};

	const handleToggleBlockType = (typeKey: string, checked: boolean) => {
		const currentAllowed = nesting?.allowedTypes || [];
		const newAllowed = checked
			? [...currentAllowed, typeKey]
			: currentAllowed.filter((k) => k !== typeKey);

		updateNesting({
			...nesting,
			max: nesting?.max,
			allowedTypes: newAllowed,
		});
	};

	const handleMaxChildrenChange = (value: string) => {
		const num = value === "" ? undefined : parseInt(value, 10);
		updateNesting({
			...nesting,
			max: num,
			allowedTypes: nesting?.allowedTypes || [],
		});
	};

	return (
		<div className="mx-auto max-w-4xl p-6">
			<div className="mb-6">
				<h2 className="text-2xl font-bold">Nesting Rules</h2>
				<p className="mt-1 text-muted-foreground">
					Configure which block types can be nested inside this block
				</p>
			</div>

			{/* Info Alert */}
			<Alert className="mb-6">
				<Info className="size-4" />
				<AlertDescription>
					Nesting allows blocks of this type to contain other blocks as children. This is
					useful for creating container blocks like "Section" or "Card".
				</AlertDescription>
			</Alert>

			<div className="space-y-6">
				{/* Enable Nesting Toggle */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Enable Nesting</CardTitle>
								<CardDescription>
									Allow this block type to contain other blocks as children
								</CardDescription>
							</div>
							<Switch checked={nestingEnabled} onCheckedChange={handleToggleNesting} />
						</div>
					</CardHeader>
				</Card>

				{nestingEnabled && (
					<>
						{/* Max Children */}
						<Card>
							<CardHeader>
								<CardTitle>Maximum Children</CardTitle>
								<CardDescription>
									Limit how many child blocks can be nested (leave empty for unlimited)
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-4">
									<div className="flex-1">
										<Input
											type="number"
											min="0"
											value={maxChildren ?? ""}
											onChange={(e) => handleMaxChildrenChange(e.target.value)}
											placeholder="Unlimited"
										/>
									</div>
									<Badge variant="outline">
										{maxChildren ? `Max: ${maxChildren}` : "Unlimited"}
									</Badge>
								</div>
							</CardContent>
						</Card>

						{/* Allowed Block Types */}
						<Card>
							<CardHeader>
								<CardTitle>Allowed Block Types</CardTitle>
								<CardDescription>
									Select which block types can be nested as children
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Search */}
								<div className="relative">
									<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Search block types..."
										className="pl-9"
									/>
								</div>

								<Separator />

								{/* Block Type List */}
								{isLoading ? (
									<div className="py-8 text-center text-sm text-muted-foreground">
										Loading block types...
									</div>
								) : filteredBlockTypes && filteredBlockTypes.length > 0 ? (
									<ScrollArea className="h-[400px] pr-4">
										<div className="space-y-2">
											{filteredBlockTypes.map((blockType) => {
												const isSelected = allowedTypes.includes(
													blockType.key
												);

												return (
													<div
														key={blockType.id}
														className="flex items-start gap-3 rounded-md border p-3 hover:bg-muted/50"
													>
														<Checkbox
															id={`block-type-${blockType.id}`}
															checked={isSelected}
															onCheckedChange={(checked) =>
																handleToggleBlockType(
																	blockType.key,
																	!!checked
																)
															}
														/>
														<div className="flex-1">
															<Label
																htmlFor={`block-type-${blockType.id}`}
																className="flex cursor-pointer items-center gap-2 font-medium"
															>
																{blockType.name}
																{blockType.system && (
																	<Badge variant="secondary" className="text-xs">
																		System
																	</Badge>
																)}
															</Label>
															{blockType.description && (
																<p className="mt-1 text-sm text-muted-foreground">
																	{blockType.description}
																</p>
															)}
															<p className="mt-1 font-mono text-xs text-muted-foreground">
																{blockType.key}
															</p>
														</div>
													</div>
												);
											})}
										</div>
									</ScrollArea>
								) : (
									<div className="py-8 text-center text-sm text-muted-foreground">
										No block types found
									</div>
								)}
							</CardContent>
						</Card>

						{/* Summary */}
						{allowedTypes.length > 0 && (
							<Card className="border-primary/50 bg-primary/5">
								<CardContent className="pt-6">
									<div className="flex items-center gap-3">
										<Layers className="size-5 text-primary" />
										<div>
											<p className="font-medium">Nesting Configuration</p>
											<p className="text-sm text-muted-foreground">
												{allowedTypes.length} block type
												{allowedTypes.length !== 1 ? "s" : ""} allowed
												{maxChildren ? `, max ${maxChildren} children` : ", unlimited children"}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						)}
					</>
				)}

				{!nestingEnabled && (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-12">
							<Layers className="mb-4 size-12 text-muted-foreground" />
							<h3 className="mb-2 text-lg font-semibold">Nesting is disabled</h3>
							<p className="mb-4 text-center text-sm text-muted-foreground">
								Enable nesting to allow this block type to contain other blocks
							</p>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
};

export default NestingConfigPanel;
