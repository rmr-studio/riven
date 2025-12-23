"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FC, useState } from "react";
import { AttributeTypeDropdown } from "../../../../../ui/attribute-type-dropdown";
import { useEntityTypeAttributeForm } from "../../../hooks/form/use-attribute-form";
import type { AttributeFormData, RelationshipFormData } from "../../../interface/entity.interface";
import { EntityType, isRelationshipType } from "../../../interface/entity.interface";
import { RelationshipAttributeForm } from "./attribute-relationship-form";
import { AttributeForm } from "./attribute-schema-form";

interface AttributeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (attribute: AttributeFormData | RelationshipFormData) => void;
    availableTypes: EntityType[];
    entityType: EntityType;
    currentAttributes?: AttributeFormData[];
    currentRelationships?: RelationshipFormData[];
    editingAttribute?: AttributeFormData | RelationshipFormData;
    identifierKey?: string;
}

export const AttributeDialog: FC<AttributeDialogProps> = ({
    open,
    onOpenChange,
    onSubmit,
    availableTypes = [],
    currentRelationships = [],
    entityType,
    editingAttribute,
    identifierKey,
}) => {
    const [typePopoverOpen, setTypePopoverOpen] = useState(false);
    const { form, handleSubmit, currentType, mode } = useEntityTypeAttributeForm(
        entityType,
        open,
        onSubmit,
        editingAttribute
    );

    const isEditMode = mode === "edit";

    // Check if the editing attribute is the identifier key
    const isIdentifierAttribute =
        isEditMode &&
        editingAttribute &&
        !isRelationshipType(editingAttribute) &&
        editingAttribute.id === identifierKey;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full min-w-11/12 lg:min-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit attribute" : "Create attribute"}</DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? "Update the attribute or relationship"
                            : "Add a new attribute or relationship to your entity type"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="selectedType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Attribute Type</FormLabel>
                                    <AttributeTypeDropdown
                                        open={typePopoverOpen}
                                        setOpen={setTypePopoverOpen}
                                        attributeKey={currentType}
                                        onChange={field.onChange}
                                    />

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {currentType === "RELATIONSHIP" ? (
                            <RelationshipAttributeForm
                                mode={editingAttribute ? "edit" : "create"}
                                relationships={currentRelationships}
                                form={form}
                                type={entityType}
                                availableTypes={availableTypes}
                                onSubmit={handleSubmit}
                            />
                        ) : (
                            <AttributeForm
                                form={form}
                                isEditMode={isEditMode}
                                isIdentifierAttribute={isIdentifierAttribute}
                            />
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">
                                {isEditMode ? "Update attribute" : "Create attribute"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
