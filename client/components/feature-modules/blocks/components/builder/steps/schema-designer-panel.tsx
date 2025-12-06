"use client";

import React, { useState } from "react";
import { useBuilder } from "../builder-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SchemaFieldEditor } from "../schema/schema-field-editor";
import { BlockSchema, DataType } from "../types/builder.types";
import { isValidFieldName } from "../../../util/builder/schema.util";
import { Plus, Database, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Step 2: Schema Designer Panel
 *
 * Visual tree editor for defining the data structure:
 * - Add/remove fields
 * - Support nested objects and arrays
 * - Set data types and formats
 * - Mark fields as required
 */
export const SchemaDesignerPanel: React.FC = () => {
	const { state, updateSchema } = useBuilder();
	const { schema } = state;

	const [isAddingField, setIsAddingField] = useState(false);
	const [newFieldName, setNewFieldName] = useState("");

	const hasFields =
		schema.type === "OBJECT" && schema.properties && Object.keys(schema.properties).length > 0;

	const handleAddField = () => {
		if (!newFieldName || !isValidFieldName(newFieldName)) return;

		const newField: BlockSchema = {
			name: newFieldName,
			type: "STRING" as DataType,
			required: false,
		};

		updateSchema({
			...schema,
			properties: {
				...(schema.properties || {}),
				[newFieldName]: newField,
			},
		});

		setNewFieldName("");
		setIsAddingField(false);
	};

	const handleUpdateField = (fieldKey: string, updates: Partial<BlockSchema>) => {
		if (!schema.properties) return;

		const field = schema.properties[fieldKey];
		updateSchema({
			...schema,
			properties: {
				...schema.properties,
				[fieldKey]: { ...field, ...updates },
			},
		});
	};

	const handleDeleteField = (fieldKey: string) => {
		if (!schema.properties) return;

		const { [fieldKey]: removed, ...rest } = schema.properties;
		updateSchema({
			...schema,
			properties: rest,
		});
	};

	const handleAddChildField = (
		parentKey: string,
		childName: string,
		childField: BlockSchema
	) => {
		if (!schema.properties) return;

		const parentField = schema.properties[parentKey];
		if (parentField.type !== "OBJECT") return;

		updateSchema({
			...schema,
			properties: {
				...schema.properties,
				[parentKey]: {
					...parentField,
					properties: {
						...(parentField.properties || {}),
						[childName]: childField,
					},
				},
			},
		});
	};

	return (
		<div className="mx-auto max-w-5xl p-6">
			<div className="mb-6">
				<h2 className="text-2xl font-bold">Data Schema Designer</h2>
				<p className="mt-1 text-muted-foreground">
					Define the data structure for your block type
				</p>
			</div>

			{/* Info Alert */}
			<Alert className="mb-6">
				<Info className="size-4" />
				<AlertDescription>
					Define what data this block will hold. Each field can be a simple type (string,
					number) or complex (object, array) for nested data structures.
				</AlertDescription>
			</Alert>

			{/* Fields List */}
			<div className="space-y-4">
				{hasFields ? (
					<div className="space-y-3">
						{Object.entries(schema.properties!).map(([key, field]) => (
							<SchemaFieldEditor
								key={key}
								field={field}
								fieldKey={key}
								path={key}
								depth={0}
								onUpdate={(updates) => handleUpdateField(key, updates)}
								onDelete={() => handleDeleteField(key)}
								onAddChild={(childName, childField) =>
									handleAddChildField(key, childName, childField)
								}
							/>
						))}
					</div>
				) : (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-12">
							<Database className="mb-4 size-12 text-muted-foreground" />
							<h3 className="mb-2 text-lg font-semibold">No fields yet</h3>
							<p className="mb-4 text-center text-sm text-muted-foreground">
								Add your first field to define the data structure
							</p>
						</CardContent>
					</Card>
				)}

				{/* Add Field Button/Form */}
				{isAddingField ? (
					<Card className="border-primary/50 bg-primary/5">
						<CardContent className="p-4">
							<div className="flex items-end gap-3">
								<div className="flex-1">
									<Label htmlFor="new-field-name" className="text-sm">
										Field Name
									</Label>
									<Input
										id="new-field-name"
										value={newFieldName}
										onChange={(e) => setNewFieldName(e.target.value)}
										placeholder="e.g., title, description, metadata"
										className="mt-1 font-mono"
										onKeyDown={(e) => {
											if (e.key === "Enter") handleAddField();
											if (e.key === "Escape") {
												setIsAddingField(false);
												setNewFieldName("");
											}
										}}
										autoFocus
									/>
									<p className="mt-1 text-xs text-muted-foreground">
										Use lowercase letters, numbers, and underscores
									</p>
								</div>
								<Button
									onClick={handleAddField}
									disabled={!newFieldName || !isValidFieldName(newFieldName)}
								>
									Add Field
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										setIsAddingField(false);
										setNewFieldName("");
									}}
								>
									Cancel
								</Button>
							</div>
						</CardContent>
					</Card>
				) : (
					<Button
						variant="outline"
						onClick={() => setIsAddingField(true)}
						className="w-full gap-2 border-dashed"
					>
						<Plus className="size-4" />
						Add Field
					</Button>
				)}
			</div>

			{/* Field Count Summary */}
			{hasFields && (
				<div className="mt-6 rounded-md border bg-muted/50 p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Schema Summary</p>
							<p className="text-sm text-muted-foreground">
								{Object.keys(schema.properties!).length} field
								{Object.keys(schema.properties!).length !== 1 ? "s" : ""} defined
							</p>
						</div>
						<div className="flex gap-2">
							{Object.entries(schema.properties!).some(([_, field]) => field.required) && (
								<div className="rounded-md bg-background px-3 py-1 text-sm">
									{
										Object.entries(schema.properties!).filter(
											([_, field]) => field.required
										).length
									}{" "}
									required
								</div>
							)}
							{Object.entries(schema.properties!).some(
								([_, field]) => field.type === "OBJECT"
							) && (
								<div className="rounded-md bg-background px-3 py-1 text-sm">
									Contains nested objects
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SchemaDesignerPanel;
