import { CommandItem } from "@/components/ui/command";
import { IconColour, IconType } from "@/lib/types/types";
import { cn } from "@/lib/util/utils";
import { Fragment, memo } from "react";
import { ICON_REGISTRY } from "./icon-mapper";

const colorClasses: Record<IconColour, string> = {
    NEUTRAL: "text-neutral-500",
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

interface Props {
    iconType: IconType;
    colour: IconColour;
    selected: boolean;
    onSelect: (icon: IconType) => void;
}

export const IconCell = memo(({ iconType, colour, selected, onSelect }: Props) => {
    const Icon = ICON_REGISTRY[iconType];

    return (
        <Fragment>
            <CommandItem
                value={iconType}
                onSelect={() => onSelect(iconType)}
                className={cn(
                    "flex items-center justify-center h-10 w-10 p-0 cursor-pointer",
                    selected && "bg-accent"
                )}
            >
                <Icon className={cn("h-5 w-5", colorClasses[colour])} />
            </CommandItem>
        </Fragment>
    );
});

IconCell.displayName = "IconCell";
