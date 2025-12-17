import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/util/utils";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { EntityType, RelationshipFormData } from "../../interface/entity.interface";
import { useRelationshipOverlapDetection } from "../../hooks/use-relationship-overlap-detection";
import { AttributeFormValues } from "../types/entity-type-attribute-dialog";
import { CardinalitySelector } from "./cardinality-selector";
import { EntityTypeMultiSelect } from "./entity-type-multi-select";
import { RelationshipOverlapAlert } from "./relationship-overlap-alert";

interface Props {
    relationships: RelationshipFormData[];
    type?: EntityType;
    avaiableTypes?: EntityType[];
    form: UseFormReturn<AttributeFormValues>;
    isEditMode?: boolean;
}

export const RelationshipAttributeForm: FC<Props> = ({
    relationships = [],
    type,
    avaiableTypes,
    form,
    isEditMode = false,
}) => {
    const selectedEntityTypeKeys = form.watch("entityTypeKeys");
    const bidirectional = form.watch("bidirectional");
    const allowPolymorphic = form.watch("allowPolymorphic");
    const bidirectionalEntityTypeKeys = form.watch("bidirectionalEntityTypeKeys");
    const targetEntity = avaiableTypes?.find((et) => et.key === selectedEntityTypeKeys?.[0]);

    // Overlap detection state and logic
    const [dismissedOverlaps, setDismissedOverlaps] = useState<Set<string>>(new Set());

    // Detect overlaps when target entity selection changes
    const overlapDetection = useRelationshipOverlapDetection(
        type?.key,
        selectedEntityTypeKeys,
        allowPolymorphic,
        avaiableTypes
    );

    // Filter out dismissed overlaps
    const activeOverlaps = useMemo(() => {
        return overlapDetection.overlaps.filter((overlap) => {
            const overlapId = `${overlap.targetEntityKey}-${overlap.existingRelationship.key}`;
            return !dismissedOverlaps.has(overlapId);
        });
    }, [overlapDetection.overlaps, dismissedOverlaps]);

    // Handler for dismissing an overlap alert
    const handleDismissOverlap = useCallback(
        (index: number) => {
            const overlap = activeOverlaps[index];
            const overlapId = `${overlap.targetEntityKey}-${overlap.existingRelationship.key}`;
            setDismissedOverlaps((prev) => new Set([...prev, overlapId]));
        },
        [activeOverlaps]
    );

    // Handler for navigating to target entity to edit relationship
    const handleNavigateToTarget = useCallback(
        (targetEntityKey: string, relationshipKey: string) => {
            // Store suggestion in sessionStorage for target entity editor
            sessionStorage.setItem(
                "relationship-suggestion",
                JSON.stringify({
                    sourceEntityKey: type?.key,
                    relationshipKey,
                    action: "add-to-bidirectional",
                    timestamp: Date.now(),
                })
            );

            // Navigate to target entity editor
            const organisationId = window.location.pathname.split("/")[2];
            window.location.href = `/organisation/${organisationId}/entity/type/${targetEntityKey}`;
        },
        [type?.key]
    );

    // Clean up bidirectionalEntityTypeKeys when bidirectional is disabled or entity selection changes
    useEffect(() => {
        if (!bidirectional) {
            // Clear bidirectional entity types when bidirectional is turned off
            if (bidirectionalEntityTypeKeys && bidirectionalEntityTypeKeys.length > 0) {
                form.setValue("bidirectionalEntityTypeKeys", []);
            }
        } else {
            // When entity types change, filter out any bidirectional selections that are no longer valid
            if (bidirectionalEntityTypeKeys && bidirectionalEntityTypeKeys.length > 0) {
                const validKeys = allowPolymorphic
                    ? bidirectionalEntityTypeKeys // All selections valid if polymorphic
                    : bidirectionalEntityTypeKeys.filter((key) =>
                          selectedEntityTypeKeys?.includes(key)
                      );

                // Only update if there's a difference
                if (validKeys.length !== bidirectionalEntityTypeKeys.length) {
                    form.setValue("bidirectionalEntityTypeKeys", validKeys);
                }
            }
        }
    }, [
        bidirectional,
        selectedEntityTypeKeys,
        allowPolymorphic,
        bidirectionalEntityTypeKeys,
        form,
    ]);

    // Reset dismissed overlaps when target entity selection changes
    useEffect(() => {
        setDismissedOverlaps(new Set());
    }, [selectedEntityTypeKeys]);

    return (
        <>
            {/* Overlap Alert Banner */}
            {activeOverlaps.length > 0 && (
                <RelationshipOverlapAlert
                    overlaps={activeOverlaps}
                    sourceEntityKey={type?.key || ""}
                    onDismiss={handleDismissOverlap}
                    onNavigateToTarget={handleNavigateToTarget}
                />
            )}

            <div className="space-y-2">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Relationship Name</FormLabel>
                            <FormControl>
                                <Input placeholder="E.g. Person" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="cardinality"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Relationship Cardinality</FormLabel>
                        <FormControl>
                            <CardinalitySelector
                                value={field.value}
                                onValueChange={field.onChange}
                                sourceEntity={type}
                                targetEntity={targetEntity}
                                className="w-full min-h-72"
                            />
                        </FormControl>
                        <FormDescription className="text-xs">
                            Select how entities relate to each other
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormItem className="w-full">
                <FormLabel>Target Entity Types</FormLabel>
                <FormControl>
                    <EntityTypeMultiSelect
                        availableTypes={avaiableTypes}
                        selectedKeys={selectedEntityTypeKeys || []}
                        allowPolymorphic={allowPolymorphic || false}
                        onSelectionChange={(keys, allowPoly) => {
                            form.setValue("entityTypeKeys", keys);
                            form.setValue("allowPolymorphic", allowPoly);
                        }}
                    />
                </FormControl>
                <FormDescription className="text-xs">
                    Select one or more entity types, or allow all entities
                </FormDescription>
                <FormMessage />
            </FormItem>

            <div className="rounded-lg border p-4 space-y-4">
                <FormField
                    control={form.control}
                    name="bidirectional"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <FormLabel>Bidirectional Relationship</FormLabel>
                                <FormDescription>
                                    Add this relationship to the target entity as well
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="targetAttributeName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className={cn(!bidirectional && "text-primary/60")}>
                                Associated Attribute Name (Target Side)
                            </FormLabel>
                            <FormControl>
                                <Input
                                    disabled={!bidirectional}
                                    placeholder="E.g. Company"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription className="text-xs">
                                The name of this relationship on the target entity
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {bidirectional && (allowPolymorphic || (selectedEntityTypeKeys && selectedEntityTypeKeys.length > 1)) && (
                    <FormItem>
                        <FormLabel>Bidirectional Entity Types</FormLabel>
                        <FormControl>
                            <EntityTypeMultiSelect
                                availableTypes={
                                    allowPolymorphic
                                        ? avaiableTypes
                                        : avaiableTypes?.filter((et) =>
                                              selectedEntityTypeKeys?.includes(et.key)
                                          )
                                }
                                selectedKeys={form.watch("bidirectionalEntityTypeKeys") || []}
                                allowPolymorphic={false}
                                onSelectionChange={(keys) => {
                                    form.setValue("bidirectionalEntityTypeKeys", keys);
                                }}
                            />
                        </FormControl>
                        <FormDescription className="text-xs">
                            Select which entity types should receive the bidirectional relationship
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            </div>
            <div className="w-full flex justify-end">
                <FormField
                    control={form.control}
                    name="required"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0 w-1/3 rounded-lg border p-4">
                            <FormLabel>Required</FormLabel>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
        </>
    );
};
