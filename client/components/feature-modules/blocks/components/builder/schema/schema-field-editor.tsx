"use client";

import React, { useState } from "react";
import { BlockSchema, DataType, DataFormat } from "../types/builder.types";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { getAvailableFormats, isValidFieldName } from "../../../util/builder/schema.util";
import { ChevronDown, ChevronRight, Plus, Trash2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SchemaFieldEditorProps {
	field: BlockSchema;
	fieldKey: string;
	path: string;
	depth: number;
	onUpdate: (updates: Partial<BlockSchema>) => void;
	onDelete: () => void;
	onAddChild?: (childName: string, childField: BlockSchema) => void;
	canDelete?: boolean;
}

const DATA_TYPES: DataType[] = ["STRING", "NUMBER", "BOOLEAN", "OBJECT", "ARRAY"];

/**
 * Editor for a single schema field with support for nested fields
 */
export const SchemaFieldEditor: React.FC<SchemaFieldEditorProps> = ({
	field,
	fieldKey,
	path,
	depth,
	onUpdate,
	onDelete,
	onAddChild,
	canDelete = true,
}) => {
	const [isExpanded, setIsExpanded] = useState(depth === 0);
	const [isAddingChild, setIsAddingChild] = useState(false);
	const [newChildName, setNewChildName] = useState("");

	const availableFormats = getAvailableFormats(field.type);
	const hasChildren =
		(field.type === "OBJECT" && field.properties && Object.keys(field.properties).length > 0) ||
		(field.type === "ARRAY" && field.items);

	const handleAddChild = () => {
		if (!newChildName || !isValidFieldName(newChildName)) return;

		const newField: BlockSchema = {
			name: newChildName,
			type: "STRING",
			required: false,
		};

		onAddChild?.(newChildName, newField);
		setNewChildName("");
		setIsAddingChild(false);
		setIsExpanded(true);
	};

	return (
		<div className="space-y-2">
			<Card className={depth === 0 ? "" : "border-l-2 border-l-primary/30"}>
				<CardContent className="p-4">
					<div className="flex items-start gap-3">
						{/* Drag Handle */}
						<div className="mt-2 cursor-grab text-muted-foreground">
							<GripVertical className="size-4" />
						</div>

						{/* Expand/Collapse */}
						{(field.type === "OBJECT" || field.type === "ARRAY") && (
							<Button
								variant="ghost"
								size="icon"
								className="size-6 shrink-0"
								onClick={() => setIsExpanded(!isExpanded)}
							>
								{isExpanded ? (
									<ChevronDown className="size-4" />
								) : (
									<ChevronRight className="size-4" />
								)}
							</Button>
						)}

						<div className="flex-1 space-y-3">
							{/* Field Name and Type Row */}
							<div className="flex items-center gap-3">
								<div className="flex-1">
									<Label className="text-xs text-muted-foreground">
										Field Name
									</Label>
									<Input
										value={fieldKey}
										onChange={(e) => onUpdate({ name: e.target.value })}
										placeholder="field_name"
										className="mt-1 h-8 font-mono text-sm"
										disabled={depth === 0} // Can't rename root
									/>
								</div>

								<div className="w-40">
									<Label className="text-xs text-muted-foreground">
										Type
									</Label>
									<Select
										value={field.type}
										onValueChange={(value) =>
											onUpdate({ type: value as DataType })
										}
									>
										<SelectTrigger className="mt-1 h-8 text-sm">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{DATA_TYPES.map((type) => (
												<SelectItem key={type} value={type}>
													{type}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Format (if applicable) */}
								{availableFormats.length > 0 && (
									<div className="w-32">
										<Label className="text-xs text-muted-foreground">
											Format
										</Label>
										<Select
											value={field.format || "none"}
											onValueChange={(value) =>
												onUpdate({
													format:
														value === "none"
															? undefined
															: (value as DataFormat),
												})
											}
										>
											<SelectTrigger className="mt-1 h-8 text-sm">
												<SelectValue placeholder="None" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">None</SelectItem>
												{availableFormats.map((format) => (
													<SelectItem key={format} value={format}>
														{format}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								)}
							</div>

							{/* Options Row */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									{/* Required Checkbox */}
									<div className="flex items-center gap-2">
										<Checkbox
											id={`required-${path}`}
											checked={field.required}
											onCheckedChange={(checked) =>
												onUpdate({ required: !!checked })
											}
										/>
										<Label
											htmlFor={`required-${path}`}
											className="text-sm font-normal"
										>
											Required
										</Label>
									</div>

									{/* Type Badge */}
									<Badge variant="secondary" className="text-xs">
										{field.type}
										{field.format && ` • ${field.format}`}
									</Badge>
								</div>

								{/* Actions */}
								<div className="flex gap-1">
									{field.type === "OBJECT" && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => setIsAddingChild(true)}
											className="h-7 gap-1 text-xs"
										>
											<Plus className="size-3" />
											Add Field
										</Button>
									)}
									{canDelete && (
										<Button
											variant="ghost"
											size="icon"
											onClick={onDelete}
											className="size-7 text-destructive hover:text-destructive"
										>
											<Trash2 className="size-4" />
										</Button>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Nested Fields */}
					{isExpanded && field.type === "OBJECT" && field.properties && (
						<div className="ml-9 mt-4 space-y-2 border-l-2 border-dashed pl-4">
							{Object.entries(field.properties).map(([key, childField]) => (
								<SchemaFieldEditor
									key={key}
									field={childField}
									fieldKey={key}
									path={`${path}/${key}`}
									depth={depth + 1}
									onUpdate={(updates) => {
										onUpdate({
											properties: {
												...field.properties,
												[key]: { ...childField, ...updates },
											},
										});
									}}
									onDelete={() => {
										const { [key]: removed, ...rest } = field.properties!;
										onUpdate({ properties: rest });
									}}
									onAddChild={(childName, childFieldData) => {
										onUpdate({
											properties: {
												...field.properties,
												[key]: {
													...childField,
													properties: {
														...(childField.properties || {}),
														[childName]: childFieldData,
													},
												},
											},
										});
									}}
								/>
							))}

							{/* Add Child Form */}
							{isAddingChild && (
								<Card className="border-dashed">
									<CardContent className="p-3">
										<div className="flex items-end gap-2">
											<div className="flex-1">
												<Label className="text-xs">New Field Name</Label>
												<Input
													value={newChildName}
													onChange={(e) => setNewChildName(e.target.value)}
													placeholder="field_name"
													className="mt-1 h-8 font-mono"
													onKeyDown={(e) => {
														if (e.key === "Enter") handleAddChild();
														if (e.key === "Escape")
															setIsAddingChild(false);
													}}
													autoFocus
												/>
											</div>
											<Button
												size="sm"
												onClick={handleAddChild}
												disabled={
													!newChildName || !isValidFieldName(newChildName)
												}
												className="h-8"
											>
												Add
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setIsAddingChild(false);
													setNewChildName("");
												}}
												className="h-8"
											>
												Cancel
											</Button>
										</div>
									</CardContent>
								</Card>
							)}
						</div>
					)}

					{/* Array Items Schema */}
					{isExpanded && field.type === "ARRAY" && field.items && (
						<div className="ml-9 mt-4 border-l-2 border-dashed pl-4">
							<Label className="mb-2 block text-sm text-muted-foreground">
								Array Item Schema
							</Label>
							<SchemaFieldEditor
								field={field.items}
								fieldKey="[]"
								path={`${path}/[]`}
								depth={depth + 1}
								onUpdate={(updates) => {
									onUpdate({
										items: { ...field.items!, ...updates },
									});
								}}
								onDelete={() => {}}
								onAddChild={(childName, childFieldData) => {
									if (field.items?.type === "OBJECT") {
										onUpdate({
											items: {
												...field.items,
												properties: {
													...(field.items.properties || {}),
													[childName]: childFieldData,
												},
											},
										});
									}
								}}
								canDelete={false}
							/>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default SchemaFieldEditor;
