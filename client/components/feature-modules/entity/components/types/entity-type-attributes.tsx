import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FC, useEffect, useMemo, useState } from "react";
import {
    EntityAttributeDefinition,
    type EntityType,
    type EntityTypeDefinition,
} from "../../interface/entity.interface";
import { AttributeFormModal } from "../modals/type/attribute-form-modal";
import EntityTypeDataTable from "./entity-type-data-table";

interface Props {
    type: EntityType;
    identifierKey: string;
    organisationId: string;
}

export const EntityTypesAttributes: FC<Props> = ({ type, identifierKey, organisationId }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<EntityTypeDefinition | undefined>(
        undefined
    );

    const onDelete = (attribute: EntityTypeDefinition) => {};

    const onEdit = (attribute: EntityTypeDefinition) => {
        setEditingAttribute(attribute);
        setDialogOpen(true);
    };

    const attributes: EntityAttributeDefinition[] = useMemo(() => {
        return Object.entries(type.schema.properties || {}).map(([key, schema]) => ({
            id: key,
            schema,
        }));
    }, [type.attributes]);

    useEffect(() => {
        if (!dialogOpen) {
            setEditingAttribute(undefined);
        }
    }, [dialogOpen]);

    return (
        <>
            <section className="flex flex-col gap-6 mt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Attributes & Relationships</h2>
                        <p className="text-sm text-muted-foreground">
                            Manage the fields and relationships for this entity type
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingAttribute(undefined);
                            setDialogOpen(true);
                        }}
                    >
                        <Plus className="size-4 mr-2" />
                        Add Attribute
                    </Button>
                </div>
                <EntityTypeDataTable
                    type={type}
                    identifierKey={identifierKey}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </section>
            <AttributeFormModal
                dialog={{ open: dialogOpen, setOpen: setDialogOpen }}
                type={type}
                identifierKey={identifierKey}
                selectedAttribute={editingAttribute?.definition}
            />
        </>
    );
};
