"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/util/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { FC, useState } from "react";
import { EntityType } from "../../interface/entity.interface";

interface Props {
    availableTypes?: EntityType[];
    allowSelectAll?: boolean;
    selectedKeys: string[];
    allowPolymorphic: boolean;
    onSelectionChange: (keys: string[], allowPolymorphic: boolean) => void;
    disabled?: boolean;
    hasError?: boolean;
}

export const EntityTypeMultiSelect: FC<Props> = ({
    availableTypes = [],
    allowSelectAll = true,
    selectedKeys,
    allowPolymorphic,
    onSelectionChange,
    disabled = false,
    hasError = false,
}) => {
    const [open, setOpen] = useState(false);

    const handleAllEntitiesToggle = () => {
        if (allowPolymorphic) {
            // If "Allow All Entities" is currently selected, deselect it
            onSelectionChange([], false);
        } else {
            // Select "Allow All Entities" and clear all other selections
            onSelectionChange([], true);
        }
    };

    const handleEntityTypeToggle = (key: string) => {
        if (allowPolymorphic) {
            // If "Allow All Entities" is selected, deselect it and select this entity
            onSelectionChange([key], false);
        } else {
            // Toggle the entity type selection
            const newSelection = selectedKeys.includes(key)
                ? selectedKeys.filter((k) => k !== key)
                : [...selectedKeys, key];
            onSelectionChange(newSelection, false);
        }
    };

    const getDisplayText = () => {
        if (allowPolymorphic) {
            return "Allow All Entities";
        }
        if (selectedKeys.length === 0) {
            return "Select entity types...";
        }
        if (selectedKeys.length === 1) {
            const selected = availableTypes.find((et) => et.key === selectedKeys[0]);
            return selected?.name.plural || "1 selected";
        }
        return `${selectedKeys.length} entity types selected`;
    };

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between",
                        hasError && "border-destructive focus-visible:ring-destructive"
                    )}
                    disabled={disabled}
                >
                    <span className="truncate">{getDisplayText()}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search entity types..." />
                    <CommandList>
                        <CommandEmpty>No entity type found.</CommandEmpty>
                        <CommandGroup>
                            {/* Allow All Entities Option */}
                            {allowSelectAll && (
                                <CommandItem
                                    onSelect={handleAllEntitiesToggle}
                                    className="cursor-pointer"
                                >
                                    <Checkbox
                                        checked={allowPolymorphic}
                                        className="mr-2 pointer-events-none"
                                    />
                                    <div className="flex items-center gap-2 font-medium">
                                        <span>Allow All Entities</span>
                                    </div>
                                </CommandItem>
                            )}

                            {/* Separator */}
                            <div className="my-1 h-px bg-border" />

                            {/* Entity Types List */}
                            {availableTypes.map((entityType) => {
                                const isSelected = selectedKeys.includes(entityType.key);
                                return (
                                    <CommandItem
                                        key={entityType.key}
                                        value={entityType.name.plural}
                                        onSelect={() => handleEntityTypeToggle(entityType.key)}
                                        className="cursor-pointer"
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            className="mr-2 pointer-events-none"
                                        />
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
                                                <span className="text-xs">
                                                    {entityType.name.plural.charAt(0)}
                                                </span>
                                            </div>
                                            <span>{entityType.name.plural}</span>
                                        </div>
                                        {isSelected && (
                                            <Check className="ml-auto h-4 w-4 text-primary" />
                                        )}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
