"use client";

import { OptionalTooltip } from "@/components/ui/optional-tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/util/utils";
import { CircleAlert } from "lucide-react";
import { FC } from "react";
import { FormWidgetProps } from "../form-widget.types";

export const ToggleSwitchWidget: FC<FormWidgetProps<boolean>> = ({
    value,
    onChange,
    onBlur,
    label,
    description,
    errors,
    displayError = "message",
    disabled,
}) => {
    const hasErrors = errors && errors.length > 0;

    return (
        <OptionalTooltip
            content={errors?.join(", ") || ""}
            disabled={displayError !== "tooltip" || !hasErrors}
        >
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Switch
                        id={label}
                        checked={value || false}
                        onCheckedChange={(checked) => {
                            onChange(checked);
                            onBlur?.();
                        }}
                        disabled={disabled}
                    />
                    <Label
                        htmlFor={label}
                        className={cn("cursor-pointer", hasErrors && "text-destructive")}
                    >
                        {label}
                    </Label>
                    {displayError === "tooltip" && hasErrors && (
                        <CircleAlert className="size-4 text-destructive fill-background" />
                    )}
                </div>
                {description && <p className="text-sm text-muted-foreground ml-12">{description}</p>}
                {displayError === "message" && hasErrors && (
                    <div className="space-y-1 ml-12">
                        {errors.map((error, idx) => (
                            <p key={idx} className="text-sm text-destructive">
                                {error}
                            </p>
                        ))}
                    </div>
                )}
            </div>
        </OptionalTooltip>
    );
};
