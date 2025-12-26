"use client";

import { FC } from "react";
import { useQueries } from "@tanstack/react-query";
import { EntityRelationshipCardinality } from "@/lib/types/types";
import { useAuth } from "@/components/provider/auth-context";
import { useOrganisationId } from "@/components/feature-modules/organisation/hooks/use-organisation-id";
import { EntityRelationshipDefinition } from "../../../interface/entity.interface";
import { EntityInstanceService } from "../../../service/entity-instance.service";
import { useDraftForm } from "../../../context/entity-instance-draft-provider";
import { getEntityDisplayName } from "../../../components/tables/entity-instance-table-utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface EntityInstanceRelationshipPickerProps {
    relationship: EntityRelationshipDefinition;
}

export const EntityInstanceRelationshipPicker: FC<
    EntityInstanceRelationshipPickerProps
> = ({ relationship }) => {
    const form = useDraftForm();
    const { session } = useAuth();
    const organisationId = useOrganisationId();

    const fieldName = relationship.id;
    const value = form.watch(fieldName);
    const fieldError = form.formState.errors[fieldName];
    const errors = fieldError?.message ? [String(fieldError.message)] : undefined;

    // Determine if single or multi select
    const isSingleSelect =
        relationship.cardinality === EntityRelationshipCardinality.ONE_TO_ONE ||
        relationship.cardinality === EntityRelationshipCardinality.MANY_TO_ONE;

    // Load entities for all target types
    const entitiesQueries = useQueries({
        queries: relationship.entityTypeKeys.map((typeKey) => ({
            queryKey: ["entities", organisationId, typeKey],
            queryFn: () =>
                EntityInstanceService.getEntitiesForType(
                    session,
                    organisationId,
                    typeKey
                ),
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
        return (
            <div className="text-sm text-destructive">
                Failed to load entities
            </div>
        );
    }

    const entities = entitiesQueries.data || [];

    // Single select rendering
    if (isSingleSelect) {
        return (
            <div className="space-y-2">
                <Label className={errors ? "text-destructive" : ""}>
                    {relationship.name}
                </Label>
                <Select
                    value={value || undefined}
                    onValueChange={handleChange}
                    disabled={entities.length === 0}
                >
                    <SelectTrigger onBlur={handleBlur}>
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
    const selectedEntities = entities.filter((e) =>
        (value || []).includes(e.id)
    );
    const availableEntities = entities.filter(
        (e) => !(value || []).includes(e.id)
    );

    return (
        <div className="space-y-2">
            <Label className={errors ? "text-destructive" : ""}>
                {relationship.name}
            </Label>

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
                    <SelectTrigger onBlur={handleBlur}>
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
                <p className="text-sm text-muted-foreground">
                    No entities available
                </p>
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
