"use client";

import React, { useEffect, useState } from "react";
import { useBuilder } from "../builder-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { BlockFormWidgetType, FormWidgetConfig } from "../types/builder.types";
import {
	generateFormFromSchema,
	getAllWidgetTypes,
	getWidgetDescription,
	widgetRequiresOptions,
} from "../../../util/builder/suggestions.util";
import { Wand2, Settings2, Plus, Trash2, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";

/**
 * Step 3: Form Configuration Panel
 *
 * Auto-generates form widgets from schema and allows customization:
 * - Widget type selection
 * - Label, placeholder, description
 * - Options for dropdowns/radio buttons
 */
export const FormConfigPanel: React.FC = () => {
	const { state, updateFormStructure, updateWidgetConfig, removeFormField } = useBuilder();
	const { schema, form } = state;
	const [selectedField, setSelectedField] = useState<string | null>(null);

	// Auto-generate form on mount if empty
	useEffect(() => {
		if (Object.keys(form.fields).length === 0) {
			const generatedForm = generateFormFromSchema(schema);
			if (Object.keys(generatedForm.fields).length > 0) {
				updateFormStructure(generatedForm);
			}
		}
	}, []);

	const handleRegenerateForm = () => {
		const generatedForm = generateFormFromSchema(schema);
		updateFormStructure(generatedForm);
		setSelectedField(null);
	};

	const fieldEntries = Object.entries(form.fields);
	const hasFields = fieldEntries.length > 0;

	const selectedFieldConfig = selectedField ? form.fields[selectedField] : null;

	return (
		<div className="mx-auto max-w-6xl p-6">
			<div className="mb-6">
				<h2 className="text-2xl font-bold">Form Configuration</h2>
				<p className="mt-1 text-muted-foreground">
					Configure how users will input data for each field
				</p>
			</div>

			{/* Info Alert */}
			<Alert className="mb-6">
				<Info className="size-4" />
				<AlertDescription>
					Form widgets are auto-generated from your schema. Customize labels, placeholders,
					and widget types to create the perfect data entry experience.
				</AlertDescription>
			</Alert>

			{!hasFields ? (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Settings2 className="mb-4 size-12 text-muted-foreground" />
						<h3 className="mb-2 text-lg font-semibold">No fields in schema</h3>
						<p className="mb-4 text-center text-sm text-muted-foreground">
							Go back to Step 2 to add fields to your schema first
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-6 lg:grid-cols-2">
					{/* Left: Fields List */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold">Form Fields</h3>
							<Button
								variant="outline"
								size="sm"
								onClick={handleRegenerateForm}
								className="gap-2"
							>
								<Wand2 className="size-4" />
								Regenerate
							</Button>
						</div>

						<div className="space-y-2">
							{fieldEntries.map(([fieldPath, config]) => {
								const fieldName = fieldPath.split(".").pop() || fieldPath;
								const isSelected = selectedField === fieldPath;

								return (
									<Card
										key={fieldPath}
										className={`cursor-pointer transition-colors ${
											isSelected
												? "border-primary bg-primary/5"
												: "hover:bg-muted/50"
										}`}
										onClick={() => setSelectedField(fieldPath)}
									>
										<CardContent className="p-4">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-2">
														<p className="font-medium">{config.label}</p>
														<Badge variant="outline" className="text-xs">
															{config.type}
														</Badge>
													</div>
													<p className="mt-1 font-mono text-xs text-muted-foreground">
														{fieldPath}
													</p>
												</div>
												<Button
													variant="ghost"
													size="icon"
													className="size-6 text-destructive hover:text-destructive"
													onClick={(e) => {
														e.stopPropagation();
														removeFormField(fieldPath);
														if (selectedField === fieldPath) {
															setSelectedField(null);
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
					</div>

					{/* Right: Field Editor */}
					<div className="lg:sticky lg:top-6 lg:h-fit">
						{selectedFieldConfig && selectedField ? (
							<Card>
								<CardHeader>
									<CardTitle>Widget Configuration</CardTitle>
									<CardDescription>
										Customize the form widget for {selectedField.split(".").pop()}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Widget Type */}
									<div className="space-y-2">
										<Label>Widget Type</Label>
										<Select
											value={selectedFieldConfig.type}
											onValueChange={(value) =>
												updateWidgetConfig(selectedField, {
													...selectedFieldConfig,
													type: value as BlockFormWidgetType,
												})
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{getAllWidgetTypes().map((type) => (
													<SelectItem key={type} value={type}>
														<div>
															<div className="font-medium">{type}</div>
															<div className="text-xs text-muted-foreground">
																{getWidgetDescription(type)}
															</div>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<Separator />

									{/* Label */}
									<div className="space-y-2">
										<Label htmlFor="widget-label">Label</Label>
										<Input
											id="widget-label"
											value={selectedFieldConfig.label}
											onChange={(e) =>
												updateWidgetConfig(selectedField, {
													...selectedFieldConfig,
													label: e.target.value,
												})
											}
											placeholder="Field Label"
										/>
									</div>

									{/* Placeholder */}
									<div className="space-y-2">
										<Label htmlFor="widget-placeholder">Placeholder</Label>
										<Input
											id="widget-placeholder"
											value={selectedFieldConfig.placeholder || ""}
											onChange={(e) =>
												updateWidgetConfig(selectedField, {
													...selectedFieldConfig,
													placeholder: e.target.value,
												})
											}
											placeholder="Placeholder text"
										/>
									</div>

									{/* Description */}
									<div className="space-y-2">
										<Label htmlFor="widget-description">
											Description (optional)
										</Label>
										<Textarea
											id="widget-description"
											value={selectedFieldConfig.description || ""}
											onChange={(e) =>
												updateWidgetConfig(selectedField, {
													...selectedFieldConfig,
													description: e.target.value,
												})
											}
											placeholder="Help text for this field"
											rows={2}
										/>
									</div>

									{/* Options (for DROPDOWN, RADIO_BUTTON) */}
									{widgetRequiresOptions(selectedFieldConfig.type) && (
										<>
											<Separator />
											<div className="space-y-2">
												<Label>Options</Label>
												<p className="text-sm text-muted-foreground">
													Define the available choices for this field
												</p>
												{/* TODO: Add options editor */}
												<Card className="border-dashed">
													<CardContent className="py-4 text-center text-sm text-muted-foreground">
														Options editor coming soon
													</CardContent>
												</Card>
											</div>
										</>
									)}

									{/* Tooltip */}
									<div className="space-y-2">
										<Label htmlFor="widget-tooltip">Tooltip (optional)</Label>
										<Input
											id="widget-tooltip"
											value={selectedFieldConfig.tooltip || ""}
											onChange={(e) =>
												updateWidgetConfig(selectedField, {
													...selectedFieldConfig,
													tooltip: e.target.value,
												})
											}
											placeholder="Tooltip text on hover"
										/>
									</div>
								</CardContent>
							</Card>
						) : (
							<Card className="border-dashed">
								<CardContent className="flex flex-col items-center justify-center py-12">
									<Settings2 className="mb-4 size-12 text-muted-foreground" />
									<h3 className="mb-2 text-lg font-semibold">
										Select a field to configure
									</h3>
									<p className="text-center text-sm text-muted-foreground">
										Click on a field from the list to customize its widget
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			)}

			{/* Summary */}
			{hasFields && (
				<div className="mt-6 rounded-md border bg-muted/50 p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Form Summary</p>
							<p className="text-sm text-muted-foreground">
								{fieldEntries.length} widget{fieldEntries.length !== 1 ? "s" : ""}{" "}
								configured
							</p>
						</div>
						<div className="flex gap-2">
							{Object.values(form.fields).some((f) => f.type === "TEXT_INPUT") && (
								<Badge variant="secondary">
									{
										Object.values(form.fields).filter(
											(f) => f.type === "TEXT_INPUT"
										).length
									}{" "}
									text inputs
								</Badge>
							)}
							{Object.values(form.fields).some((f) => f.type === "TEXT_AREA") && (
								<Badge variant="secondary">
									{
										Object.values(form.fields).filter(
											(f) => f.type === "TEXT_AREA"
										).length
									}{" "}
									text areas
								</Badge>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default FormConfigPanel;
