"use client";

import React, { useState } from "react";
import { useBuilder } from "../builder-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	CheckCircle2,
	AlertCircle,
	Rocket,
	FileJson,
	Eye,
	Code,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Step 6: Preview & Save Panel
 *
 * Final step showing:
 * - Configuration summary
 * - Validation results
 * - Sample data editor
 * - Publish button
 */
export const PreviewSavePanel: React.FC = () => {
	const { state, validateAll, publish, updatePreviewData } = useBuilder();
	const { name, key, description, schema, form, nesting, previewData } = state;

	const [isPublishing, setIsPublishing] = useState(false);
	const [publishError, setPublishError] = useState<string | null>(null);
	const [previewDataJson, setPreviewDataJson] = useState(
		JSON.stringify(previewData, null, 2)
	);

	// Validate all steps
	const allValid = validateAll();
	const errorCount = Array.from(state.validationErrors.values()).reduce(
		(sum, errors) => sum + errors.length,
		0
	);

	// Count stats
	const fieldCount =
		schema.type === "OBJECT" && schema.properties
			? Object.keys(schema.properties).length
			: 0;
	const formWidgetCount = Object.keys(form.fields).length;
	const componentCount = Object.keys(state.render.components).length;
	const allowedTypesCount = nesting?.allowedTypes?.length || 0;

	const handlePublish = async () => {
		if (!allValid) {
			return;
		}

		setIsPublishing(true);
		setPublishError(null);

		try {
			await publish();
			// Success would be handled by parent component
		} catch (error) {
			setPublishError(error instanceof Error ? error.message : "Failed to publish");
		} finally {
			setIsPublishing(false);
		}
	};

	const handleUpdatePreviewData = () => {
		try {
			const parsed = JSON.parse(previewDataJson);
			updatePreviewData(parsed);
		} catch (error) {
			console.error("Invalid JSON:", error);
		}
	};

	return (
		<div className="mx-auto max-w-5xl p-6">
			<div className="mb-6">
				<h2 className="text-2xl font-bold">Preview & Publish</h2>
				<p className="mt-1 text-muted-foreground">
					Review your block type configuration and publish when ready
				</p>
			</div>

			{/* Validation Status */}
			{!allValid && errorCount > 0 && (
				<Alert variant="destructive" className="mb-6">
					<AlertCircle className="size-4" />
					<AlertDescription>
						There {errorCount === 1 ? "is" : "are"} {errorCount} validation error
						{errorCount !== 1 ? "s" : ""} that must be fixed before publishing.
					</AlertDescription>
				</Alert>
			)}

			{allValid && (
				<Alert className="mb-6 border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
					<CheckCircle2 className="size-4" />
					<AlertDescription>
						All validations passed! Your block type is ready to publish.
					</AlertDescription>
				</Alert>
			)}

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Left Column: Summary */}
				<div className="space-y-6">
					{/* Basic Info Summary */}
					<Card>
						<CardHeader>
							<CardTitle>Basic Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div>
								<Label className="text-sm text-muted-foreground">Name</Label>
								<p className="font-medium">{name || "Untitled"}</p>
							</div>
							<div>
								<Label className="text-sm text-muted-foreground">Key</Label>
								<p className="font-mono text-sm">{key || "untitled"}</p>
							</div>
							{description && (
								<div>
									<Label className="text-sm text-muted-foreground">
										Description
									</Label>
									<p className="text-sm">{description}</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Schema Summary */}
					<Card>
						<CardHeader>
							<CardTitle>Data Schema</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<span className="text-sm">Fields defined</span>
								<Badge>{fieldCount}</Badge>
							</div>
							{schema.type === "OBJECT" && schema.properties && (
								<div className="mt-4 space-y-2">
									{Object.entries(schema.properties)
										.slice(0, 5)
										.map(([key, field]) => (
											<div
												key={key}
												className="flex items-center justify-between text-sm"
											>
												<span className="font-mono">{key}</span>
												<Badge variant="outline" className="text-xs">
													{field.type}
													{field.format && ` • ${field.format}`}
												</Badge>
											</div>
										))}
									{fieldCount > 5 && (
										<p className="text-xs text-muted-foreground">
											And {fieldCount - 5} more...
										</p>
									)}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Form Summary */}
					<Card>
						<CardHeader>
							<CardTitle>Form Configuration</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<span className="text-sm">Form widgets configured</span>
								<Badge>{formWidgetCount}</Badge>
							</div>
						</CardContent>
					</Card>

					{/* Render Summary */}
					<Card>
						<CardHeader>
							<CardTitle>Render Layout</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<span className="text-sm">Components</span>
								<Badge>{componentCount}</Badge>
							</div>
							{componentCount === 0 && (
								<Alert variant="destructive" className="mt-3">
									<AlertCircle className="size-4" />
									<AlertDescription className="text-xs">
										No components configured. Go to Step 4 to add components.
									</AlertDescription>
								</Alert>
							)}
						</CardContent>
					</Card>

					{/* Nesting Summary */}
					{nesting && allowedTypesCount > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Nesting Rules</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-between">
									<span className="text-sm">Allowed child types</span>
									<Badge>{allowedTypesCount}</Badge>
								</div>
								{nesting.max && (
									<div className="mt-2 flex items-center justify-between">
										<span className="text-sm">Maximum children</span>
										<Badge variant="outline">{nesting.max}</Badge>
									</div>
								)}
							</CardContent>
						</Card>
					)}
				</div>

				{/* Right Column: Preview & Data */}
				<div className="space-y-6">
					{/* Tabs for different views */}
					<Card>
						<CardHeader>
							<CardTitle>Preview</CardTitle>
							<CardDescription>
								View the configuration and test with sample data
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="summary">
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="summary" className="gap-2">
										<Eye className="size-4" />
										Summary
									</TabsTrigger>
									<TabsTrigger value="json" className="gap-2">
										<Code className="size-4" />
										JSON
									</TabsTrigger>
								</TabsList>

								<TabsContent value="summary" className="space-y-4">
									<div className="rounded-md border bg-muted/50 p-4">
										<h4 className="mb-3 font-semibold">Quick Stats</h4>
										<div className="grid grid-cols-2 gap-4 text-sm">
											<div>
												<p className="text-muted-foreground">Fields</p>
												<p className="text-lg font-bold">{fieldCount}</p>
											</div>
											<div>
												<p className="text-muted-foreground">Widgets</p>
												<p className="text-lg font-bold">
													{formWidgetCount}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Components</p>
												<p className="text-lg font-bold">
													{componentCount}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">
													Nesting Types
												</p>
												<p className="text-lg font-bold">
													{allowedTypesCount}
												</p>
											</div>
										</div>
									</div>

									<Separator />

									{/* Sample Data Editor */}
									<div className="space-y-2">
										<Label>Sample Data (JSON)</Label>
										<Textarea
											value={previewDataJson}
											onChange={(e) => setPreviewDataJson(e.target.value)}
											onBlur={handleUpdatePreviewData}
											placeholder='{"field": "value"}'
											className="font-mono text-xs"
											rows={8}
										/>
										<p className="text-xs text-muted-foreground">
											Edit and click outside to update preview
										</p>
									</div>
								</TabsContent>

								<TabsContent value="json">
									<div className="space-y-2">
										<pre className="max-h-[400px] overflow-auto rounded-md bg-muted p-4 text-xs">
											{JSON.stringify(
												{
													key,
													name,
													description,
													schema,
													display: {
														form,
														render: state.render,
													},
													nesting,
												},
												null,
												2
											)}
										</pre>
									</div>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>

					{/* Publish Button */}
					<Card className={allValid ? "border-primary" : ""}>
						<CardContent className="pt-6">
							{publishError && (
								<Alert variant="destructive" className="mb-4">
									<AlertCircle className="size-4" />
									<AlertDescription>{publishError}</AlertDescription>
								</Alert>
							)}

							<Button
								onClick={handlePublish}
								disabled={!allValid || isPublishing}
								className="w-full gap-2"
								size="lg"
							>
								<Rocket className="size-4" />
								{isPublishing ? "Publishing..." : "Publish Block Type"}
							</Button>

							{!allValid && (
								<p className="mt-2 text-center text-sm text-muted-foreground">
									Fix validation errors to publish
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default PreviewSavePanel;
