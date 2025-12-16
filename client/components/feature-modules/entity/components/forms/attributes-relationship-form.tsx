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
import { cn, toKeyCase } from "@/lib/util/utils";
import { FC, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { EntityType, RelationshipFormData } from "../../interface/entity.interface";
import { AttributeFormValues } from "./attribute-dialog";
import { CardinalitySelector } from "./cardinality-selector";
import { EntityTypeMultiSelect } from "./entity-type-multi-select";

/**
 * Generates a unique relationship key based on source entity type and relationship name
 * Format: {sourceEntityKey}_{relationshipNameSlug}
 * If key exists, appends _2, _3, etc.
 */
const generateUniqueKey = (
    sourceEntityKey: string,
    relationshipName: string,
    existingRelationships: RelationshipFormData[],
    currentKey?: string
): string => {
    if (!relationshipName.trim()) return "";

    const baseKey = `${sourceEntityKey}_${toKeyCase(relationshipName)}`;
    const existingKeys = existingRelationships
        .map((r) => r.key)
        .filter((key) => key !== currentKey); // Exclude current key when editing

    // If base key doesn't exist, use it
    if (!existingKeys.includes(baseKey)) {
        return baseKey;
    }

    // Find next available index
    let index = 2;
    let candidateKey = `${baseKey}_${index}`;
    while (existingKeys.includes(candidateKey)) {
        index++;
        candidateKey = `${baseKey}_${index}`;
    }

    return candidateKey;
};

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
    const required = form.watch("required");
    const allowPolymorphic = form.watch("allowPolymorphic");
    const relationshipName = form.watch("name");
    const currentKey = form.watch("key");
    const targetEntity = avaiableTypes?.find((et) => et.key === selectedEntityTypeKeys?.[0]);

    // Auto-generate key based on source entity type and relationship name
    useEffect(() => {
        // Only auto-generate in create mode
        if (isEditMode) return;

        // Only generate if we have a source entity type and relationship name
        if (!type?.key || !relationshipName) {
            form.setValue("key", "");
            return;
        }

        const generatedKey = generateUniqueKey(
            type.key,
            relationshipName,
            relationships,
            currentKey
        );

        // Only update if the generated key is different from current
        if (generatedKey !== currentKey) {
            form.setValue("key", generatedKey);
        }
    }, [relationshipName, type?.key, relationships, isEditMode, form, currentKey]);

    return (
        <>
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
                                className="w-full"
                            />
                        </FormControl>
                        <FormDescription className="text-xs">
                            Select how entities relate to each other
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormItem>
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
            </div>
            <div className="rounded-lg border p-4 space-y-4">
                <FormField
                    control={form.control}
                    name="required"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                            <FormLabel>Required</FormLabel>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="minOccurs"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Min Occurrences</FormLabel>
                                <FormControl>
                                    <Input
                                        disabled={!required}
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="maxOccurs"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Max Occurrences</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="Unlimited"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </>
    );
};
