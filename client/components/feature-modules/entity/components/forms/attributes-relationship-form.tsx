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
import { useRelationshipOverlapDetection } from "../../hooks/use-relationship-overlap-detection";
import { EntityType, RelationshipFormData } from "../../interface/entity.interface";
import { AttributeFormValues } from "../types/entity-type-attribute-dialog";
import { EntityTypeMultiSelect } from "./entity-type-multi-select";
import { RelationshipOverlapAlert } from "./relationship-overlap-alert";

interface Props {
    relationships: RelationshipFormData[];
    type: EntityType;
    availableTypes: EntityType[];
    form: UseFormReturn<AttributeFormValues>;
}

export const RelationshipAttributeForm: FC<Props> = ({ type, availableTypes = [], form }) => {
    const selectedEntityTypeKeys = form.watch("entityTypeKeys");
    const bidirectional = form.watch("bidirectional");
    const allowPolymorphic = form.watch("allowPolymorphic");

    // Determine the current entity key for self-reference identification
    const currentEntityKey = type?.key;

    // Overlap detection state and logic
    const [dismissedOverlaps, setDismissedOverlaps] = useState<Set<string>>(new Set());

    // Detect overlaps when target entity selection changes
    const overlapDetection = useRelationshipOverlapDetection(
        type?.key,
        selectedEntityTypeKeys,
        allowPolymorphic,
        availableTypes
    );

    // Filter out dismissed overlaps
    const activeOverlaps = useMemo(() => {
        return overlapDetection.overlaps.filter((overlap) => {
            const overlapId = `${overlap.targetEntityKey}-${overlap.existingRelationship.id}`;
            return !dismissedOverlaps.has(overlapId);
        });
    }, [overlapDetection.overlaps, dismissedOverlaps]);

    // Handler for dismissing an overlap alert
    const handleDismissOverlap = useCallback(
        (index: number) => {
            const overlap = activeOverlaps[index];
            const overlapId = `${overlap.targetEntityKey}-${overlap.existingRelationship.id}`;
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

    // Manage bidirectionalEntityTypeKeys based on entity selection changes
    useEffect(() => {
        // Get current bidirectional value each time
        const currentBidirectional = form.getValues("bidirectionalEntityTypeKeys") || [];

        if (!bidirectional) {
            // Clear bidirectional entity types when bidirectional is turned off
            if (currentBidirectional.length > 0) {
                form.setValue("bidirectionalEntityTypeKeys", []);
            }
        } else {
            // When bidirectional is enabled, auto-select entity types
            if (allowPolymorphic) {
                // If polymorphic, select all available entity types
                const allKeys = availableTypes.map((et) => et.key) || [];

                // Only update if there's a difference
                const allKeysSorted = allKeys.toSorted();
                const currentSorted = currentBidirectional.toSorted();

                if (JSON.stringify(allKeysSorted) !== JSON.stringify(currentSorted)) {
                    form.setValue("bidirectionalEntityTypeKeys", allKeys);
                }
            } else if (selectedEntityTypeKeys && selectedEntityTypeKeys.length > 0) {
                // If not polymorphic, auto-select all selected entity types
                // Start with currently selected bidirectional keys that are still valid
                const validExistingKeys = currentBidirectional.filter((key) =>
                    selectedEntityTypeKeys.includes(key)
                );

                // Add any new entity types that aren't already in bidirectional
                const newKeys = selectedEntityTypeKeys.filter(
                    (key) => !currentBidirectional.includes(key)
                );

                const updatedKeys = [...validExistingKeys, ...newKeys];

                // Only update if there's a difference
                const updatedSorted = updatedKeys.toSorted();
                const currentSorted = currentBidirectional.toSorted();

                if (JSON.stringify(updatedSorted) !== JSON.stringify(currentSorted)) {
                    form.setValue("bidirectionalEntityTypeKeys", updatedKeys);
                }
            } else if (currentBidirectional.length > 0) {
                // If no entity types selected and not polymorphic, clear bidirectional
                form.setValue("bidirectionalEntityTypeKeys", []);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        bidirectional,
        selectedEntityTypeKeys,
        allowPolymorphic,
        // Note: bidirectionalEntityTypeKeys is intentionally excluded to prevent infinite loops
        // We read it directly in the effect using form.getValues() instead
        // Note: availableTypesis intentionally excluded to prevent infinite loops
        // It's a computed value that changes frequently due to sorting
    ]);

    // Reset dismissed overlaps when target entity selection changes
    useEffect(() => {
        setDismissedOverlaps(new Set());
    }, [selectedEntityTypeKeys]);

    const bidirectionalDisabled =
        (!selectedEntityTypeKeys || selectedEntityTypeKeys.length === 0) && !allowPolymorphic;
    const bidirectionalFormDisabled = !bidirectional || bidirectionalDisabled;

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
            <div className="border rounded-lg p-6">
                <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Relationship Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="E.g. Person" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="entityTypeKeys"
                        render={({ field, fieldState }) => (
                            <FormItem className="w-full">
                                <FormLabel>Related to</FormLabel>
                                <FormControl>
                                    <EntityTypeMultiSelect
                                        availableTypes={availableTypes}
                                        selectedKeys={selectedEntityTypeKeys || []}
                                        allowPolymorphic={allowPolymorphic || false}
                                        hasError={!!fieldState.error}
                                        currentEntityKey={currentEntityKey}
                                        onSelectionChange={(keys, allowPoly) => {
                                            form.setValue("entityTypeKeys", keys);
                                            form.setValue("allowPolymorphic", allowPoly);
                                        }}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs ml-1">
                                    Select one or more entity types, or allow all entities
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="sourceRelationsLimit"
                    render={({ field }) => (
                        <FormItem className="w-fit mx-0.5">
                            <FormLabel>Limit</FormLabel>
                            <div className="flex items-center gap-4 py-1">
                                <span
                                    className={cn(
                                        "text-sm font-medium transition-colors",
                                        field.value === "singular"
                                            ? "text-foreground"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    1 entity
                                </span>
                                <FormControl>
                                    <Switch
                                        checked={field.value === "many"}
                                        onCheckedChange={(checked) => {
                                            field.onChange(checked ? "many" : "singular");
                                        }}
                                    />
                                </FormControl>
                                <span
                                    className={cn(
                                        "text-sm font-medium transition-colors",
                                        field.value === "many"
                                            ? "text-foreground"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    Unlimited
                                </span>
                            </div>
                            <FormDescription className="text-xs">
                                Controls how many entities this relationship can point to
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="rounded-lg border p-4 space-y-4">
                <FormField
                    control={form.control}
                    name="bidirectional"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <FormLabel
                                    className={cn(bidirectionalDisabled && "text-primary/60")}
                                >
                                    Two Way Relationship
                                </FormLabel>
                                <FormDescription className="text-xs">
                                    Manage this relationship from the target entity as well
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    disabled={bidirectionalDisabled}
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
                    <FormField
                        control={form.control}
                        name="inverseName"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel
                                    className={cn(bidirectionalFormDisabled && "text-primary/60")}
                                >
                                    Default Associated Attribute Name
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        disabled={bidirectionalFormDisabled}
                                        placeholder="E.g. Company"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    The default name of this relationship on the target entity side
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormItem className="w-full">
                        <FormLabel className={cn(bidirectionalFormDisabled && "text-primary/60")}>
                            Bidirectional Entity Types
                        </FormLabel>
                        <FormControl>
                            <EntityTypeMultiSelect
                                disabled={bidirectionalFormDisabled}
                                allowSelectAll={false}
                                availableTypes={
                                    allowPolymorphic
                                        ? availableTypes
                                        : availableTypes.filter((et) =>
                                              selectedEntityTypeKeys?.includes(et.key)
                                          )
                                }
                                selectedKeys={form.watch("bidirectionalEntityTypeKeys") || []}
                                allowPolymorphic={false}
                                currentEntityKey={currentEntityKey}
                                onSelectionChange={(keys) => {
                                    form.setValue("bidirectionalEntityTypeKeys", keys);
                                }}
                            />
                        </FormControl>
                        <FormDescription className="text-xs">
                            Select which entity types should receive the two way relationship
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                </div>
                <FormField
                    control={form.control}
                    name="targetRelationsLimit"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel
                                className={cn(bidirectionalFormDisabled && "text-primary/60")}
                            >
                                Limit
                            </FormLabel>
                            <div className="flex items-center gap-4 py-1">
                                <span
                                    className={cn(
                                        "text-sm font-medium transition-colors",
                                        field.value === "singular"
                                            ? "text-foreground"
                                            : "text-muted-foreground",
                                        bidirectionalFormDisabled && "text-primary/60"
                                    )}
                                >
                                    1 entity
                                </span>
                                <FormControl>
                                    <Switch
                                        disabled={bidirectionalFormDisabled}
                                        checked={field.value === "many"}
                                        onCheckedChange={(checked) => {
                                            field.onChange(checked ? "many" : "singular");
                                        }}
                                    />
                                </FormControl>
                                <span
                                    className={cn(
                                        "text-sm font-medium transition-colors",
                                        field.value === "many"
                                            ? "text-foreground"
                                            : "text-muted-foreground",
                                        bidirectionalFormDisabled && "text-primary/60"
                                    )}
                                >
                                    Unlimited
                                </span>
                            </div>
                            <FormDescription className="text-xs">
                                Controls how many entities the target side of this relationship can
                                point to
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            {/* // TODO: Only allow setting required on RELATIONSHIP entity types */}
            {/* <div className="w-full flex justify-end">
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
            </div> */}
        </>
    );
};
