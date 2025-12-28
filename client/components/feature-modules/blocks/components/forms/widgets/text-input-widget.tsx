"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/util/utils";

import { OptionalTooltip } from "@/components/ui/optional-tooltip";
import { FC } from "react";
import { FormWidgetProps } from "../form-widget.types";

export const TextInputWidget: FC<FormWidgetProps<string>> = ({
    value,
    onChange,
    onBlur,
    label,
    description,
    placeholder,
    errors,
    disabled,
    tooltip = "",
}) => {
    const hasErrors = errors && errors.length > 0;

    return (
        <OptionalTooltip content={tooltip}>
            <div className="space-y-2">
                {label && (
                    <Label htmlFor={label} className={cn(hasErrors && "text-destructive")}>
                        {label}
                    </Label>
                )}
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
                <Input
                    id={label}
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(hasErrors && "border-destructive focus-visible:ring-destructive")}
                />
                {hasErrors && (
                    <div className="space-y-1">
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
