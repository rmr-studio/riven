"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { ClassNameProps } from "@/lib/interfaces/interface";
import { IconColour, IconType } from "@/lib/types/types";
import { cn } from "@/lib/util/utils";
import { FileQuestionMark } from "lucide-react";

import { IconCell } from "./icon-cell";
import { getAllIconTypes, ICON_REGISTRY, iconTypeToLabel } from "./icon-mapper";

interface Props extends ClassNameProps {
    onSelect: (iconType: IconType, iconColour: IconColour) => void;
    icon: IconType;
    colour: IconColour;
}

const colorIndicators: Record<IconColour, string> = {
    NEUTRAL: "bg-neutral-500",
    PURPLE: "bg-purple-500",
    BLUE: "bg-blue-500",
    TEAL: "bg-teal-500",
    GREEN: "bg-green-500",
    YELLOW: "bg-yellow-500",
    ORANGE: "bg-orange-500",
    RED: "bg-red-500",
    PINK: "bg-pink-500",
    GREY: "bg-gray-500",
};

export const IconSelector: FC<Props> = ({ onSelect, icon, colour, className }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [currentColour, setCurrentColour] = useState(colour);

    const allIcons = useMemo(getAllIconTypes, []);

    const filteredIcons = useMemo(() => {
        if (!search) return allIcons;
        const lower = search.toLowerCase();
        return allIcons.filter((icon) => iconTypeToLabel(icon).toLowerCase().includes(lower));
    }, [allIcons, search]);

    const handleSelect = useCallback(
        (iconType: IconType) => {
            onSelect(iconType, currentColour);
            setOpen(false);
            setSearch("");
        },
        [onSelect, currentColour]
    );

    const parentRef = useRef<HTMLDivElement>(null);
    const columns = 8;
    const rowVirtualizer = useVirtualizer({
        count: Math.ceil(filteredIcons.length / columns),
        getScrollElement: () => parentRef.current,
        estimateSize: () => 44,
        overscan: 5,
        enabled: true,
    });

    useEffect(() => {
        if (!open) return;

        // One layout frame AFTER mount
        requestAnimationFrame(() => {
            rowVirtualizer.measure();
        });
    }, [open, filteredIcons.length, rowVirtualizer]);

    const SelectedIcon = ICON_REGISTRY[icon];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={cn("w-full flex items-center justify-center", className)}
                >
                    {SelectedIcon ? (
                        <SelectedIcon className="h-4 w-4" />
                    ) : (
                        <FileQuestionMark className="h-4 w-4" />
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[420px] p-0" align="start">
                {open && (
                    <div className="flex flex-col">
                        {/* Color selector */}
                        <div className="border-b p-3 flex gap-2 flex-wrap">
                            {Object.values(IconColour).map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCurrentColour(c)}
                                    className={cn(
                                        "h-6 w-6 rounded-full border-2",
                                        colorIndicators[c],
                                        currentColour === c && "ring-2 ring-offset-2"
                                    )}
                                />
                            ))}
                        </div>

                        <Command shouldFilter={false}>
                            <CommandInput
                                placeholder="Filter icons..."
                                value={search}
                                onValueChange={setSearch}
                            />

                            <CommandList className="overflow-y-hidden">
                                <CommandEmpty>No icons found.</CommandEmpty>
                                <CommandGroup>
                                    <div ref={parentRef} className="h-[300px] overflow-y-auto">
                                        <div
                                            style={{
                                                height: rowVirtualizer.getTotalSize(),
                                                position: "relative",
                                            }}
                                        >
                                            {rowVirtualizer.getVirtualItems().map((row) => {
                                                const start = row.index * columns;
                                                const items = filteredIcons.slice(
                                                    start,
                                                    start + columns
                                                );

                                                return (
                                                    <div
                                                        key={row.key}
                                                        style={{
                                                            position: "absolute",
                                                            top: 0,
                                                            transform: `translateY(${row.start}px)`,
                                                        }}
                                                        className="grid grid-cols-8 gap-1 px-2"
                                                    >
                                                        {items.map((iconType) => (
                                                            <IconCell
                                                                key={iconType}
                                                                iconType={iconType}
                                                                colour={currentColour}
                                                                selected={icon === iconType}
                                                                onSelect={handleSelect}
                                                            />
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};
