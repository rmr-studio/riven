"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityRelationshipCardinality } from "@/lib/types/types";
import { Check, Command, Loader2, X } from "lucide-react";
import { useParams } from "next/navigation";
import { FC, useMemo, useState } from "react";
import { useEntityTypes } from "../../../hooks/query/type/use-entity-types";
import { useEntitiesFromManyTypes } from "../../../hooks/query/use-entities";
import {
    Entity,
    EntityRelationshipDefinition,
    EntityType,
} from "../../../interface/entity.interface";

export interface EntityRelationshipPickerProps {
    relationship: EntityRelationshipDefinition;
    autoFocus?: boolean;
    value: string[];
    errors?: string[];
    handleBlur: () => Promise<void>;
    handleChange: (newValue: string | string[] | null) => void;
    handleRemove: (entityId: string) => void;
}

export const EntityRelationshipPicker: FC<EntityRelationshipPickerProps> = ({
    relationship,
    autoFocus,
    value,
    errors,
    handleBlur,
    handleChange,
    handleRemove,
}) => {
    // Allows selecting a specific entity type instead of viewin all entities
    const [selectedType, setSelectedType] = useState<string>("ALL");
    const [popoverOpen, setPopoverOpen] = useState(false);

    const { organisationId } = useParams<{ organisationId: string }>();
    const { data: entityTypes } = useEntityTypes(organisationId);

    const isSingleSelect =
        relationship.cardinality === EntityRelationshipCardinality.ONE_TO_ONE ||
        relationship.cardinality === EntityRelationshipCardinality.MANY_TO_ONE;

    const types: EntityType[] = useMemo(() => {
        return (
            (relationship.allowPolymorphic
                ? entityTypes
                : entityTypes?.filter((et) =>
                      (relationship.entityTypeKeys ?? []).includes(et.key)
                  )) ?? []
        );
    }, [entityTypes, relationship]);

    const {
        data: entities = [],
        isLoading,
        isError,
    } = useEntitiesFromManyTypes(
        organisationId,
        types.map((type) => type.id)
    );

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading entities...
            </div>
        );
    }

    if (isError) {
        return <div className="text-sm text-destructive">Failed to load entities</div>;
    }

    const entityTypeKeyIdMap: Record<string, EntityType> = useMemo(() => {
        return types.reduce((acc, type) => {
            acc[type.id] = type;
            return acc;
        }, {} as Record<string, EntityType>);
    }, [entityTypes]);

    // Group each queried entity by its type
    const groupedEntities: Record<string, Entity[]> = useMemo(() => {
        return entities.reduce((acc, entity) => {
            const typeId = entity.typeId;
            if (!acc[typeId]) {
                acc[typeId] = [];
            }
            acc[typeId].push(entity);
            return acc;
        }, {} as Record<string, Entity[]>);
    }, [entities, types]);

    const filteredEntities = useMemo(() => {
        if (selectedType === "ALL") return entities;

        return groupedEntities[selectedType] || [];
    }, [selectedType]);

    const selectedEntities = entities.filter((e) => (value || []).includes(e.id));

    const onSelectEntity = (entity: Entity) => {
        if (isSingleSelect) {
            handleChange([entity.id]);
            setPopoverOpen(false);
            return;
        }

        if ((value || []).includes(entity.id)) return;

        handleChange([...(value || []), entity.id]);
    };

    const onRemoveEntity = (id: string) => {
        handleRemove(id);
    };

    const getEntityLabel = (entity: Entity) => {
        return entity.payload[entity.identifierKey].payload["value"] || "Unnamed Entity";
    };

    const getTypeLabel = (typeId: string) => {
        return entityTypeKeyIdMap[typeId]?.name.singular || "Unknown Type";
    };

    return (
        <div className="space-y-3">
            {/* Selected entities */}
            {selectedEntities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedEntities.map((entity) => (
                        <Badge key={entity.id} variant="secondary" className="gap-1">
                            {getEntityLabel(entity)}
                            <button
                                type="button"
                                onClick={() => onRemoveEntity(entity.id)}
                                className="ml-1 rounded-sm hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Tabs for filtering by entity type */}
            <Tabs value={selectedType} onValueChange={setSelectedType}>
                <TabsList>
                    <TabsTrigger value="ALL">All</TabsTrigger>

                    {types.map((type) => (
                        <TabsTrigger key={type.id} value={type.id}>
                            {type.name.singular}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={selectedType} className="mt-2">
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={popoverOpen}
                                className="w-full justify-between"
                                autoFocus={autoFocus}
                            >
                                Select entity…
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-[360px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search entities..." />
                                <CommandEmpty>No entities found.</CommandEmpty>

                                <CommandGroup>
                                    {filteredEntities.map((entity) => {
                                        const isSelected = (value || []).includes(entity.id);

                                        return (
                                            <CommandItem
                                                key={entity.id}
                                                value={getEntityLabel(entity)}
                                                onSelect={() => onSelectEntity(entity)}
                                            >
                                                <div className="flex w-full items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span>{getEntityLabel(entity)}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {getTypeLabel(entity.typeId)}
                                                        </span>
                                                    </div>

                                                    {isSelected && (
                                                        <Check className="h-4 w-4 opacity-100" />
                                                    )}
                                                </div>
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </TabsContent>
            </Tabs>

            {errors && <p className="text-sm text-destructive">{errors}</p>}
        </div>
    );
};
