"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/util/utils";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import React from "react";
import { useBuilder } from "./builder-provider";
import { StepIndicator } from "./step-indicator";
import { BuilderStep } from "./types/builder.types";

// Placeholder components for each step (will be implemented later)
const BasicInfoPanel = () => (
    <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
        <p className="text-muted-foreground">Step 1: Basic Info panel will be implemented here</p>
    </div>
);

const SchemaDesigner = () => (
    <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Schema Designer</h2>
        <p className="text-muted-foreground">Step 2: Schema Designer will be implemented here</p>
    </div>
);

const FormConfigPanel = () => (
    <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Form Configuration</h2>
        <p className="text-muted-foreground">Step 3: Form Configuration will be implemented here</p>
    </div>
);

const RenderDesigner = () => (
    <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Render Designer</h2>
        <p className="text-muted-foreground">Step 4: Render Designer will be implemented here</p>
    </div>
);

const NestingConfig = () => (
    <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Nesting Rules</h2>
        <p className="text-muted-foreground">Step 5: Nesting Rules will be implemented here</p>
    </div>
);

const PreviewPanel = () => (
    <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Preview & Save</h2>
        <p className="text-muted-foreground">Step 6: Preview & Save will be implemented here</p>
    </div>
);

/**
 * Maps step enum to component
 */
const STEP_COMPONENTS: Record<BuilderStep, React.FC> = {
    [BuilderStep.BASIC_INFO]: BasicInfoPanel,
    [BuilderStep.SCHEMA_DESIGNER]: SchemaDesigner,
    [BuilderStep.FORM_CONFIG]: FormConfigPanel,
    [BuilderStep.RENDER_DESIGNER]: RenderDesigner,
    [BuilderStep.NESTING_RULES]: NestingConfig,
    [BuilderStep.PREVIEW_SAVE]: PreviewPanel,
};

interface BuilderWizardProps {
    className?: string;
}

/**
 * Main wizard component that handles step navigation and content rendering
 */
export const BuilderWizard: React.FC<BuilderWizardProps> = ({ className }) => {
    const { state, nextStep, prevStep, canGoNext, canGoPrev, validateStep, saveDraft, publish } =
        useBuilder();
    const { currentStep, validationErrors } = state;

    const CurrentStepComponent = STEP_COMPONENTS[currentStep];
    const isLastStep = currentStep === BuilderStep.PREVIEW_SAVE;
    const currentStepErrors = validationErrors.get(currentStep) || [];

    const handleNext = () => {
        // Validate current step before proceeding
        const errors = validateStep(currentStep);
        if (errors.length > 0) {
            console.warn("Validation errors:", errors);
            // Still allow navigation but show errors
        }
        nextStep();
    };

    const handlePublish = async () => {
        try {
            await publish();
            // Success handling would go here
        } catch (error) {
            console.error("Failed to publish:", error);
            // Error handling would go here
        }
    };

    const handleSaveDraft = async () => {
        try {
            await saveDraft();
            // Show success message
        } catch (error) {
            console.error("Failed to save draft:", error);
        }
    };

    return (
        <div className={cn("flex h-full flex-col", className)}>
            {/* Header with step indicator */}
            <div className="border-b bg-muted/50 p-6">
                <div className="mx-auto">
                    <StepIndicator orientation="horizontal" />
                </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto ">
                    {/* Validation errors display */}
                    {currentStepErrors.length > 0 && (
                        <div className="m-6 rounded-md border border-destructive/50 bg-destructive/10 p-4">
                            <h3 className="mb-2 font-semibold text-destructive">
                                Please fix the following errors:
                            </h3>
                            <ul className="list-inside list-disc space-y-1 text-sm text-destructive">
                                {currentStepErrors.map((error, i) => (
                                    <li key={i}>
                                        <span className="font-medium">{error.field}:</span>{" "}
                                        {error.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Current step content */}
                    <CurrentStepComponent />
                </div>
            </div>

            {/* Footer with navigation buttons */}
            <div className="border-t bg-muted/50 p-4">
                <div className="mx-auto flex items-center justify-between">
                    <div className="flex gap-2">
                        {/* Save Draft button */}
                        <Button variant="outline" onClick={handleSaveDraft} className="gap-1.5">
                            <Save className="size-4" />
                            Save Draft
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        {/* Back button */}
                        <Button
                            variant="outline"
                            onClick={prevStep}
                            disabled={!canGoPrev()}
                            className="gap-1.5"
                        >
                            <ArrowLeft className="size-4" />
                            Back
                        </Button>

                        {/* Next/Publish button */}
                        {isLastStep ? (
                            <Button onClick={handlePublish} className="gap-1.5">
                                Publish Block Type
                                <ArrowRight className="size-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                disabled={!canGoNext()}
                                className="gap-1.5"
                            >
                                Next
                                <ArrowRight className="size-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

BuilderWizard.displayName = "BuilderWizard";

// Export placeholder components for later implementation
export {
    BasicInfoPanel,
    FormConfigPanel,
    NestingConfig,
    PreviewPanel,
    RenderDesigner,
    SchemaDesigner,
};
