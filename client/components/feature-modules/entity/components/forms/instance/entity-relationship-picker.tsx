"use client";

import { useAuth } from "@/components/provider/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EntityRelationshipCardinality } from "@/lib/types/types";
import { useQueries } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useParams } from "next/navigation";
import { FC, useMemo } from "react";
import { useFormState } from "react-hook-form";
import { useEntityDraft } from "../../../context/entity-provider";
import { useEntityTypes } from "../../../hooks/query/type/use-entity-types";
import { EntityRelationshipDefinition, EntityType } from "../../../interface/entity.interface";
import { EntityService } from "../../../service/entity.service";
import { getEntityDisplayName } from "../../tables/entity-table-utils";

export interface EntityRelationshipPickerProps {
    relationship: EntityRelationshipDefinition;
    autoFocus?: boolean;
}

export const EntityRelationshipPicker: FC<EntityRelationshipPickerProps> = ({ relationship, autoFocus }) => {
    const { form } = useEntityDraft();
    const { session } = useAuth();
    const { organisationId } = useParams<{ organisationId: string }>();
    const fieldName = relationship.id;
    const value = form.watch(fieldName);

    // Watch for validation errors on this specific field
    const { errors: formErrors } = useFormState({
        control: form.control,
        name: fieldName,
    });

    // Extract error messages for this field
    const fieldError = formErrors[fieldName];
    const errors = fieldError?.message
        ? [String(fieldError.message)]
        : fieldError?.type
          ? [String(fieldError.type)]
          : undefined;

    const { data: entityTypes } = useEntityTypes(organisationId);

    // Determine if single or multi select
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

    // Load entities for all target types
    const entitiesQueries = useQueries({
        queries: types
            .map((type) => type.id)
            .map((typeId) => ({
                queryKey: ["entities", organisationId, typeId],
                queryFn: () => EntityService.getEntitiesForType(session, organisationId, typeId),
                enabled: !!session && !!organisationId,
            })),
        combine: (results) => {
            return {
                data: results.flatMap((r) => r.data ?? []),
                isLoading: results.some((r) => r.isLoading),
                isError: results.some((r) => r.isError),
            };
        },
    });

    const handleChange = (newValue: any) => {
        form.setValue(fieldName, newValue, {
            shouldValidate: false,
            shouldDirty: true,
        });
    };

    const handleBlur = async () => {
        await form.trigger(fieldName);
    };

    const handleRemove = (entityId: string) => {
        if (isSingleSelect) {
            handleChange(null);
        } else {
            const newValue = (value || []).filter((id: string) => id !== entityId);
            handleChange(newValue);
        }
    };

    if (entitiesQueries.isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading entities...
            </div>
        );
    }

    if (entitiesQueries.isError) {
        return <div className="text-sm text-destructive">Failed to load entities</div>;
    }

    const entities = entitiesQueries.data || [];

    // Single select rendering
    if (isSingleSelect) {
        return (
            <div className="space-y-2 w-full min-w-0">

                <Select
                    value={value || undefined}
                    onValueChange={handleChange}
                    disabled={entities.length === 0}
                >
                    <SelectTrigger onBlur={handleBlur} autoFocus={autoFocus}>
                        <SelectValue
                            placeholder={
                                entities.length === 0
                                    ? "No entities available"
                                    : `Select ${relationship.name.toLowerCase()}...`
                            }
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {entities.map((entity) => (
                            <SelectItem key={entity.id} value={entity.id}>
                                {getEntityDisplayName(entity)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors && (
                    <div className="space-y-1">
                        {errors.map((error, idx) => (
                            <p key={idx} className="text-sm text-destructive">
                                {error}
                            </p>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Multi-select rendering
    const selectedEntities = entities.filter((e) => (value || []).includes(e.id));
    const availableEntities = entities.filter((e) => !(value || []).includes(e.id));

    return (
        <div className="space-y-2">
            {/* Selected entities */}
            {selectedEntities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedEntities.map((entity) => (
                        <Badge key={entity.id} variant="secondary" className="gap-1">
                            {getEntityDisplayName(entity)}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => handleRemove(entity.id)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Add entity selector */}
            {availableEntities.length > 0 && (
                <Select
                    value=""
                    onValueChange={(entityId) => {
                        const newValue = [...(value || []), entityId];
                        handleChange(newValue);
                    }}
                    disabled={entities.length === 0}
                >
                    <SelectTrigger onBlur={handleBlur} autoFocus={autoFocus}>
                        <SelectValue
                            placeholder={
                                entities.length === 0
                                    ? "No entities available"
                                    : selectedEntities.length > 0
                                    ? `Add another ${relationship.name.toLowerCase()}...`
                                    : `Select ${relationship.name.toLowerCase()}...`
                            }
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {availableEntities.map((entity) => (
                            <SelectItem key={entity.id} value={entity.id}>
                                {getEntityDisplayName(entity)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {selectedEntities.length === 0 && availableEntities.length === 0 && (
                <p className="text-sm text-muted-foreground">No entities available</p>
            )}

            {errors && (
                <div className="space-y-1">
                    {errors.map((error, idx) => (
                        <p key={idx} className="text-sm text-destructive">
                            {error}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
};
