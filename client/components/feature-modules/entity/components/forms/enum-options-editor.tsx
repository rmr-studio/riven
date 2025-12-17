"use client";

import { Button } from "@/components/ui/button";
import { FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { OptionSortingType } from "@/lib/types/types";
import {
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, X } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { AttributeFormValues } from "../types/entity-type-attribute-dialog";

interface Props {
    form: UseFormReturn<AttributeFormValues>;
}
interface SortableItemProps {
    id: string;
    value: string;
    onRemove: () => void;
}

const SortableItem: FC<SortableItemProps> = ({ id, value, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 p-2 bg-muted rounded group"
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing touch-none"
            >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm flex-1">{value}</span>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onRemove}
            >
                <X className="h-3 w-3" />
            </Button>
        </div>
    );
};

export const EnumOptionsEditor: FC<Props> = ({ form }) => {
    const [newEnumValue, setNewEnumValue] = useState("");
    const enumValues = form.watch("enumValues") || [];
    const enumSorting: OptionSortingType = form.watch("enumSorting") || OptionSortingType.MANUAL;

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Apply sorting when sort mode changes
    useEffect(() => {
        if (enumSorting !== "MANUAL" && enumValues.length > 0) {
            const sorted = [...enumValues];
            if (enumSorting === "ALPHABETICAL") {
                sorted.sort((a, b) => a.localeCompare(b));
            } else if (enumSorting === "REVERSE_ALPHABETICAL") {
                sorted.sort((a, b) => b.localeCompare(a));
            }
            form.setValue("enumValues", sorted);
        }
    }, [enumSorting]); // Only run when sorting changes, not enumValues

    const handleAddEnumValue = () => {
        const trimmedValue = newEnumValue.trim();
        if (trimmedValue) {
            const currentValues = form.getValues("enumValues") || [];
            // Check for duplicates (case-sensitive)
            if (!currentValues.includes(trimmedValue)) {
                form.setValue("enumValues", [...currentValues, trimmedValue]);
                setNewEnumValue("");
            } else {
                // Option already exists, just clear the input
                setNewEnumValue("");
            }
        }
    };

    const handleRemoveEnumValue = (index: number) => {
        const currentValues = form.getValues("enumValues") || [];
        form.setValue(
            "enumValues",
            currentValues.filter((_, i) => i !== index)
        );
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = enumValues.indexOf(active.id as string);
            const newIndex = enumValues.indexOf(over.id as string);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newArray = [...enumValues];
                const [movedItem] = newArray.splice(oldIndex, 1);
                newArray.splice(newIndex, 0, movedItem);

                form.setValue("enumValues", newArray);
                // Reset to manual sorting when user manually drags
                form.setValue("enumSorting", OptionSortingType.MANUAL);
            }
        }
    };

    const handleSortChange = (value: OptionSortingType) => {
        form.setValue("enumSorting", value);
    };

    return (
        <FormField
            control={form.control}
            name="enumValues"
            render={() => (
                <FormItem>
                    <div className="space-y-4">
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium">Options</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2"></div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">Sort</span>
                                        <Select
                                            value={enumSorting}
                                            onValueChange={handleSortChange}
                                        >
                                            <SelectTrigger className="w-[140px] h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MANUAL">Manual</SelectItem>
                                                <SelectItem value="ALPHABETICAL">A → Z</SelectItem>
                                                <SelectItem value="REVERSE_ALPHABETICAL">
                                                    Z → A
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add option value"
                                        value={newEnumValue}
                                        onChange={(e) => setNewEnumValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddEnumValue();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={handleAddEnumValue}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                {enumValues.length > 0 && (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={enumValues}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="space-y-1">
                                                {enumValues.map((value, index) => (
                                                    <SortableItem
                                                        key={value}
                                                        id={value}
                                                        value={value}
                                                        onRemove={() =>
                                                            handleRemoveEnumValue(index)
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                )}

                                <div className="space-y-1">
                                    <FormDescription className="text-xs">
                                        Define the available options for this select field. Drag to
                                        reorder.{" "}
                                        <span className="font-medium">
                                            At least 2 options required ({enumValues.length}/2+)
                                        </span>
                                    </FormDescription>
                                    <FormMessage />
                                </div>
                            </div>
                        </div>
                    </div>
                </FormItem>
            )}
        />
    );
};
