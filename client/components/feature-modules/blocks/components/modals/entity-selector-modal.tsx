"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { EntityType } from "@/lib/types/types";
import { AlertCircle, Loader2, RefreshCw, Users } from "lucide-react";
import { FC, useMemo, useState } from "react";
import { useEntitySelector } from "../../hooks/use-entity-selector";
import { ReferenceItem } from "../../interface/block.interface";

interface EntitySelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (items: ReferenceItem[]) => void;
    entityType: EntityType;
    organisationId: string;
    multiSelect?: boolean; // Allow selecting multiple entities
    excludeIds?: string[]; // Entity IDs to exclude from list (for backwards compatibility)
    initialSelection?: ReferenceItem[]; // Pre-selected items
    /** Show all entities including currently selected ones (allows toggle on/off) */
    showAllEntities?: boolean;
}

const ENTITY_ICONS = {
    CLIENT: <Users className="size-4" />,
} as const;

/**
 * EntitySelectorModal - Modal for selecting entities to reference in a block.
 *
 * Features:
 * - Search/filter entities by name
 * - Single or multi-select mode
 * - Shows entity type icons and secondary info
 * - Two modes:
 *   - showAllEntities={true}: Show all entities with checkboxes (allows toggle on/off)
 *   - showAllEntities={false}: Exclude already-selected entities (default)
 * - Supports CLIENT entity type (extensible to others)
 *
 * @example
 * // Unified view - toggle entities on/off
 * <EntitySelectorModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSelect={(items) => console.log("Selected:", items)}
 *   entityType="CLIENT"
 *   organisationId={orgId}
 *   multiSelect={true}
 *   showAllEntities={true}
 *   initialSelection={currentItems}
 * />
 *
 * @example
 * // Classic mode - only show unselected entities
 * <EntitySelectorModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSelect={(items) => console.log("Selected:", items)}
 *   entityType="CLIENT"
 *   organisationId={orgId}
 *   multiSelect={true}
 *   excludeIds={selectedIds}
 * />
 */
export const EntitySelectorModal: FC<EntitySelectorModalProps> = ({
    open,
    onOpenChange,
    onSelect,
    entityType,
    organisationId,
    multiSelect = false,
    excludeIds = [],
    initialSelection = [],
    showAllEntities = false,
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        new Set(initialSelection.map((item) => item.id))
    );

    const {
        data: rawEntities,
        isLoading,
        isLoadingAuth,
        error,
        refetch,
        isRefetching,
    } = useEntitySelector({
        entityType,
        organisationId,
        // Only exclude IDs if showAllEntities is false
        excludeIds: showAllEntities ? [] : excludeIds,
        enabled: open,
    });

    // Add icons to entities
    const entities = useMemo(() => {
        if (!rawEntities) return [];

        return rawEntities.map((entity) => ({
            ...entity,
            icon: ENTITY_ICONS[entity.type as keyof typeof ENTITY_ICONS] || null,
        }));
    }, [rawEntities]);

    // Determine if we have an empty result (no error, but no data)
    const isEmpty = !isLoading && !error && entities.length === 0;
    const hasError = !!error;
    const showLoading = isLoadingAuth || isLoading || isRefetching;

    const handleEntityToggle = (entityId: string) => {
        if (multiSelect) {
            const newSelection = new Set(selectedIds);
            if (newSelection.has(entityId)) {
                newSelection.delete(entityId);
            } else {
                newSelection.add(entityId);
            }
            setSelectedIds(newSelection);
        } else {
            const entity = entities.find((e) => e.id === entityId);
            if (entity) {
                onSelect([
                    {
                        type: entity.type,
                        id: entity.id,
                    },
                ]);
                onOpenChange(false);
            }
        }
    };

    const handleConfirm = () => {
        const selectedItems: ReferenceItem[] = Array.from(selectedIds).map((id) => {
            const entity = entities.find((e) => e.id === id);
            return {
                type: entity?.type || entityType,
                id,
            };
        });

        onSelect(selectedItems);
        onOpenChange(false);
    };

    const formattedEntityType = entityType
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput
                placeholder={`Search ${formattedEntityType.toLowerCase()}s...`}
                disabled={showLoading || hasError}
            />
            <CommandList>
                {showLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                ) : hasError ? (
                    <div className="p-4">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="flex flex-col gap-2">
                                <span>Failed to load {formattedEntityType.toLowerCase()}s.</span>
                                <span className="text-xs opacity-90">{error.message}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => refetch()}
                                    className="mt-2 w-fit"
                                >
                                    <RefreshCw className="size-3 mr-2" />
                                    Try Again
                                </Button>
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : isEmpty ? (
                    <CommandEmpty>
                        <div className="py-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                No {formattedEntityType.toLowerCase()}s found.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {!showAllEntities && excludeIds.length > 0
                                    ? "All available items are already selected."
                                    : `No ${formattedEntityType.toLowerCase()}s available in this organisation.`}
                            </p>
                        </div>
                    </CommandEmpty>
                ) : (
                    <>
                        <CommandEmpty>
                            No matching {formattedEntityType.toLowerCase()}s found.
                        </CommandEmpty>
                        <CommandGroup heading={`Select ${formattedEntityType}`}>
                            {entities.map((entity) => {
                                const isSelected = selectedIds.has(entity.id);

                                return (
                                    <CommandItem
                                        key={entity.id}
                                        onSelect={() => handleEntityToggle(entity.id)}
                                        className="gap-3"
                                    >
                                        {multiSelect && (
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() =>
                                                    handleEntityToggle(entity.id)
                                                }
                                            />
                                        )}
                                        {entity.icon}
                                        <div className="flex flex-col items-start flex-1">
                                            <span className="font-medium">{entity.name}</span>
                                            {entity.secondaryInfo && (
                                                <span className="text-xs text-muted-foreground">
                                                    {entity.secondaryInfo}
                                                </span>
                                            )}
                                        </div>
                                        <Badge variant="secondary">{entity.type}</Badge>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </>
                )}
            </CommandList>

            {multiSelect && entities.length > 0 && !showLoading && !hasError && (
                <div className="border-t p-4 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                        {selectedIds.size} selected
                    </span>
                    <Button onClick={handleConfirm} disabled={selectedIds.size === 0} size="sm">
                        Confirm Selection
                    </Button>
                </div>
            )}
        </CommandDialog>
    );
};
