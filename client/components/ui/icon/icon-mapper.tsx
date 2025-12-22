import { IconColour, IconType } from "@/lib/types/types";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";

export const ICON_REGISTRY: Record<IconType, LucideIcon> = Object.values(IconType).reduce(
    (acc, iconType) => {
        const key = iconTypeToPascalCase(iconType);
        acc[iconType] = (LucideIcons as any)[key] ?? LucideIcons.HelpCircle;
        return acc;
    },
    {} as Record<IconType, LucideIcon>
);

/** * Converts IconType enum value (UPPER_SNAKE_CASE) to PascalCase for Lucide icon lookup * Example: ALARM_SMOKE -> AlarmSmoke */
export function iconTypeToPascalCase(iconType: IconType): string {
    return iconType
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("");
}

/** * Converts IconType enum value to human-readable format * Example: ALARM_SMOKE -> Alarm Smoke */
export function iconTypeToLabel(iconType: IconType): string {
    return iconType
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

/** * Get all available icon types as an array */
export function getAllIconTypes(): IconType[] {
    return Object.values(IconType);
}

export const ICON_COLOUR_MAP: Record<IconColour, string> = {
    NEUTRAL: "text-primary",
    PURPLE: "text-purple-500",
    BLUE: "text-blue-500",
    TEAL: "text-teal-500",
    GREEN: "text-green-500",
    YELLOW: "text-yellow-500",
    ORANGE: "text-orange-500",
    RED: "text-red-500",
    PINK: "text-pink-500",
    GREY: "text-gray-500",
};

