"use client";

import React from "react";
import {
	Stepper,
	StepperItem,
	StepperTrigger,
	StepperIndicator,
	StepperTitle,
	StepperDescription,
	StepperSeparator,
} from "@/components/ui/stepper";
import { BuilderStep, StepMetadata } from "./types/builder.types";
import { useBuilder } from "./builder-provider";
import { cn } from "@/lib/util/utils";
import { AlertCircle } from "lucide-react";

/**
 * Step metadata for the 6 wizard steps
 */
const STEP_METADATA: StepMetadata[] = [
	{
		step: BuilderStep.BASIC_INFO,
		title: "Basic Info",
		description: "Name and description",
	},
	{
		step: BuilderStep.SCHEMA_DESIGNER,
		title: "Data Schema",
		description: "Define data structure",
	},
	{
		step: BuilderStep.FORM_CONFIG,
		title: "Form Config",
		description: "Configure input widgets",
	},
	{
		step: BuilderStep.RENDER_DESIGNER,
		title: "Layout Design",
		description: "Visual component layout",
	},
	{
		step: BuilderStep.NESTING_RULES,
		title: "Nesting Rules",
		description: "Configure child blocks",
	},
	{
		step: BuilderStep.PREVIEW_SAVE,
		title: "Preview & Save",
		description: "Review and publish",
	},
];

interface StepIndicatorProps {
	className?: string;
	orientation?: "horizontal" | "vertical";
}

/**
 * StepIndicator component showing wizard progress
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({
	className,
	orientation = "horizontal",
}) => {
	const { state, goToStep, validateStep } = useBuilder();
	const { currentStep, validationErrors } = state;

	const handleStepClick = (step: BuilderStep) => {
		// Only allow going back to previous steps or current step
		if (step <= currentStep) {
			goToStep(step);
		}
	};

	return (
		<Stepper
			value={currentStep}
			onValueChange={(value) => handleStepClick(value as BuilderStep)}
			orientation={orientation}
			className={cn("w-full", className)}
		>
			{STEP_METADATA.map((meta, index) => {
				const isLastStep = index === STEP_METADATA.length - 1;
				const stepErrors = validationErrors.get(meta.step) || [];
				const hasErrors = stepErrors.length > 0;
				const isCompleted = meta.step < currentStep && !hasErrors;
				const isDisabled = meta.step > currentStep;

				return (
					<React.Fragment key={meta.step}>
						<StepperItem
							step={meta.step}
							completed={isCompleted}
							disabled={isDisabled}
							className="relative"
						>
							<StepperTrigger
								allowSelect={meta.step <= currentStep}
								className={cn(
									"flex items-center gap-3",
									hasErrors && "text-destructive"
								)}
							>
								<div className="relative">
									<StepperIndicator />
									{hasErrors && (
										<AlertCircle
											className="absolute -right-1 -top-1 size-3 text-destructive"
											strokeWidth={3}
										/>
									)}
								</div>
								<div className="text-left">
									<StepperTitle
										className={cn(hasErrors && "text-destructive")}
									>
										{meta.title}
									</StepperTitle>
									{orientation === "horizontal" && (
										<StepperDescription>
											{meta.description}
										</StepperDescription>
									)}
								</div>
							</StepperTrigger>
						</StepperItem>
						{!isLastStep && <StepperSeparator />}
					</React.Fragment>
				);
			})}
		</Stepper>
	);
};

StepIndicator.displayName = "StepIndicator";
