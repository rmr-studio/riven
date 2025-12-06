"use client";

import React from "react";
import { useBuilder } from "../builder-provider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Step 1: Basic Information Panel
 *
 * Allows users to set:
 * - Block type name (required) - Auto-generates key
 * - Block type key (required) - Can be manually edited
 * - Description (optional)
 */
export const BasicInfoPanel: React.FC = () => {
	const { state, updateBasicInfo } = useBuilder();
	const { name, key, description } = state;

	return (
		<div className="mx-auto max-w-3xl p-6">
			<div className="mb-6">
				<h2 className="text-2xl font-bold">Basic Information</h2>
				<p className="text-muted-foreground mt-1">
					Define the basic properties of your custom block type
				</p>
			</div>

			<div className="space-y-6">
				{/* Name Field */}
				<Card>
					<CardHeader>
						<CardTitle>Block Type Name</CardTitle>
						<CardDescription>
							A human-readable name for your block type (e.g., "Project Overview", "Contact Card")
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Label htmlFor="name">
								Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => updateBasicInfo({ name: e.target.value })}
								placeholder="e.g., Project Overview"
								className="text-base"
							/>
							{!name && (
								<p className="text-sm text-muted-foreground">
									This will be displayed when selecting block types
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Key Field */}
				<Card>
					<CardHeader>
						<CardTitle>Block Type Key</CardTitle>
						<CardDescription>
							A unique identifier for this block type (auto-generated from name, but can be customized)
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Label htmlFor="key">
								Key <span className="text-destructive">*</span>
							</Label>
							<Input
								id="key"
								value={key}
								onChange={(e) => updateBasicInfo({ key: e.target.value })}
								placeholder="e.g., project_overview"
								pattern="[a-z0-9_]+"
								className="font-mono text-base"
							/>
							<p className="text-sm text-muted-foreground">
								Must be lowercase letters, numbers, and underscores only
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Description Field */}
				<Card>
					<CardHeader>
						<CardTitle>Description</CardTitle>
						<CardDescription>
							Optional description to help users understand when to use this block type
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => updateBasicInfo({ description: e.target.value })}
								placeholder="Describe what this block type is used for..."
								rows={4}
								className="resize-none text-base"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Preview Card */}
				{name && key && (
					<Card className="border-primary/50 bg-primary/5">
						<CardHeader>
							<CardTitle className="text-base">Preview</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div>
									<span className="text-sm font-medium">Name: </span>
									<span className="text-sm">{name}</span>
								</div>
								<div>
									<span className="text-sm font-medium">Key: </span>
									<span className="font-mono text-sm">{key}</span>
								</div>
								{description && (
									<div>
										<span className="text-sm font-medium">Description: </span>
										<span className="text-sm text-muted-foreground">
											{description}
										</span>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
};

export default BasicInfoPanel;
