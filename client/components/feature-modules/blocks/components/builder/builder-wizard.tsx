"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/util/utils";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import React from "react";
import { useBuilder } from "./builder-provider";
import { StepIndicator } from "./step-indicator";
import { BasicInfoPanel } from "./steps/basic-info-panel";
import { FormConfigPanel } from "./steps/form-config-panel";
import { NestingConfigPanel } from "./steps/nesting-config-panel";
import { PreviewSavePanel } from "./steps/preview-save-panel";
import { RenderDesignerPanel } from "./steps/render-designer-panel";
import { SchemaDesignerPanel } from "./steps/schema-designer-panel";
import { BuilderStep } from "./types/builder.types";

/**
 * Maps step enum to component
 */
const STEP_COMPONENTS: Record<BuilderStep, React.FC> = {
    [BuilderStep.BASIC_INFO]: BasicInfoPanel,
    [BuilderStep.SCHEMA_DESIGNER]: SchemaDesignerPanel,
    [BuilderStep.FORM_CONFIG]: FormConfigPanel,
    [BuilderStep.RENDER_DESIGNER]: RenderDesignerPanel,
    [BuilderStep.NESTING_RULES]: NestingConfigPanel,
    [BuilderStep.PREVIEW_SAVE]: PreviewSavePanel,
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

// Export step components
export {
    BasicInfoPanel,
    FormConfigPanel,
    NestingConfigPanel,
    PreviewSavePanel,
    RenderDesignerPanel,
    SchemaDesignerPanel,
};
