"use client";

import { useAuth } from "@/components/provider/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isSingleSelectRelationship } from "@/components/ui/data-table/data-table.types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQueries } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useParams } from "next/navigation";
import { FC, useMemo, createContext, useContext } from "react";
import { UseFormReturn } from "react-hook-form";
import { useEntityTypes } from "../../../hooks/query/type/use-entity-types";
import { EntityRelationshipDefinition, EntityType } from "../../../interface/entity.interface";
import { EntityService } from "../../../service/entity.service";
import { getEntityDisplayName } from "../../tables/entity-table-utils";

/**
 * Context for passing form to relationship picker in inline edit mode.
 * This avoids the hooks rules issue when useEntityDraft is not available.
 */
const InlineEditFormContext = createContext<UseFormReturn<any> | null>(null);

export const useInlineEditForm = () => useContext(InlineEditFormContext);

export interface EntityRelationshipPickerProps {
    relationship: EntityRelationshipDefinition;
    autoFocus?: boolean;
    /**
     * Optional form instance for inline editing mode.
     * If not provided, falls back to useEntityDraft() context.
     */
    form?: UseFormReturn<any>;
    /**
     * Field name for inline editing mode.
     * Defaults to relationship.id if not provided.
     */
    fieldName?: string;
    /**
     * Callback for blur events in inline editing mode.
     */
    onBlur?: () => void;
    /**
     * Compact mode for inline cell editing (smaller styling).
     */
    compact?: boolean;
}

/**
 * Inner component that requires a form - called by the main picker after form is resolved
 */
const EntityRelationshipPickerInner: FC<
    EntityRelationshipPickerProps & { resolvedForm: UseFormReturn<any> }
> = ({
    relationship,
    autoFocus,
    fieldName: fieldNameProp,
    onBlur: onBlurProp,
    compact = false,
    resolvedForm: form,
}) => {
    const { session } = useAuth();
    const { organisationId } = useParams<{ organisationId: string }>();
    const fieldName = fieldNameProp ?? relationship.id;

    const { data: entityTypes } = useEntityTypes(organisationId);

    const isSingleSelect = isSingleSelectRelationship(relationship.cardinality);

    const types: EntityType[] = useMemo(() => {
        return (
            (relationship.allowPolymorphic
                ? entityTypes
                : entityTypes?.filter((et) =>
                      (relationship.entityTypeKeys ?? []).includes(et.key)
                  )) ?? []
        );
    }, [entityTypes, relationship]);

    const entitiesQueries = useQueries({
        queries: types
            .map((type) => type.id)
            .map((typeId) => ({
                queryKey: ["entities", organisationId, typeId],
                queryFn: () => EntityService.getEntitiesForType(session, organisationId, typeId),
                enabled: !!session && !!organisationId,
            })),
        combine: (results) => ({
            data: results.flatMap((r) => r.data ?? []),
            isLoading: results.some((r) => r.isLoading),
            isError: results.some((r) => r.isError),
        }),
    });

    const value = form.watch(fieldName);

    const handleChange = (newValue: any) => {
        form.setValue(fieldName, newValue, {
            shouldValidate: false,
            shouldDirty: true,
        });
    };

    const handleBlur = async () => {
        await form.trigger(fieldName);
        onBlurProp?.();
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

    if (isSingleSelect) {
        return (
            <div className={compact ? "w-full min-w-0" : "space-y-2 w-full min-w-0"}>
                <Select
                    value={value || undefined}
                    onValueChange={handleChange}
                    disabled={entities.length === 0}
                >
                    <SelectTrigger
                        onBlur={handleBlur}
                        autoFocus={autoFocus}
                        className={compact ? "h-8" : undefined}
                    >
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
            </div>
        );
    }

    const selectedEntities = entities.filter((e) => (value || []).includes(e.id));
    const availableEntities = entities.filter((e) => !(value || []).includes(e.id));

    return (
        <div className={compact ? "space-y-1 w-full" : "space-y-2"}>
            {selectedEntities.length > 0 && (
                <div className={compact ? "flex flex-wrap gap-1" : "flex flex-wrap gap-2"}>
                    {selectedEntities.map((entity) => (
                        <Badge
                            key={entity.id}
                            variant="secondary"
                            className={compact ? "gap-1 text-xs" : "gap-1"}
                        >
                            {getEntityDisplayName(entity)}
                            <Button
                                variant="ghost"
                                size="icon"
                                className={compact ? "h-3 w-3 p-0 hover:bg-transparent" : "h-4 w-4 p-0 hover:bg-transparent"}
                                onClick={() => handleRemove(entity.id)}
                            >
                                <X className={compact ? "h-2 w-2" : "h-3 w-3"} />
                            </Button>
                        </Badge>
                    ))}
                </div>
            )}

            {availableEntities.length > 0 && (
                <Select
                    value=""
                    onValueChange={(entityId) => {
                        const newValue = [...(value || []), entityId];
                        handleChange(newValue);
                    }}
                    disabled={entities.length === 0}
                >
                    <SelectTrigger
                        onBlur={handleBlur}
                        autoFocus={autoFocus}
                        className={compact ? "h-8" : undefined}
                    >
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
                <p className={compact ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
                    No entities available
                </p>
            )}
        </div>
    );
};

/**
 * Wrapper for inline edit mode - uses form prop directly
 */
export const EntityRelationshipPickerInline: FC<
    Omit<EntityRelationshipPickerProps, "form"> & { form: UseFormReturn<any> }
> = (props) => {
    return <EntityRelationshipPickerInner {...props} resolvedForm={props.form} />;
};

/**
 * Main EntityRelationshipPicker component.
 *
 * When used with form prop: Uses the provided form directly (for inline editing)
 * When used without form prop: Must be within EntityDraftProvider (uses useEntityDraft)
 */
export const EntityRelationshipPicker: FC<EntityRelationshipPickerProps> = (props) => {
    // Lazy import to avoid circular dependencies
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useEntityDraft } = require("../../../context/entity-provider");

    // If form is provided via props, use it directly
    if (props.form) {
        return <EntityRelationshipPickerInner {...props} resolvedForm={props.form} />;
    }

    // Otherwise, use the context (this will throw if not in provider)
    const entityDraft = useEntityDraft();
    return <EntityRelationshipPickerInner {...props} resolvedForm={entityDraft.form} />;
};
