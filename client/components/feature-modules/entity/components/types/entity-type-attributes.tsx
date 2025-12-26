import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { useConfigForm } from "../../context/configuration-provider";
import { type EntityType, type EntityTypeDefinition } from "../../interface/entity.interface";
import { AttributeFormModal } from "../modals/type/attribute-form-modal";
import { DeleteDefinitionModal } from "../modals/type/delete-definition-modal";
import EntityTypeDataTable from "./entity-type-data-table";

interface Props {
    type: EntityType;
}

export const EntityTypesAttributes: FC<Props> = ({ type }) => {
    // Get identifierKey from store instead of props, fallback to entity type default

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<EntityTypeDefinition | undefined>(
        undefined
    );
    const [deletingAttribute, setDeletingAttribute] = useState<EntityTypeDefinition | undefined>(
        undefined
    );

    useEffect(() => {
        if (!dialogOpen) {
            setEditingAttribute(undefined);
        }
    }, [dialogOpen]);

    useEffect(() => {
        if (!deleteDialogOpen) {
            setDeletingAttribute(undefined);
        }
    }, [deleteDialogOpen]);

    const form = useConfigForm();
    if (!form) return null;
    const { watch } = form;
    const identifierKey = watch("identifierKey");

    const onDelete = (attribute: EntityTypeDefinition) => {
        setDeletingAttribute(attribute);
        setDeleteDialogOpen(true);
    };

    const onEdit = (attribute: EntityTypeDefinition) => {
        setEditingAttribute(attribute);
        setDialogOpen(true);
    };

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
                selectedAttribute={editingAttribute?.definition}
            />
            <DeleteDefinitionModal
                dialog={{ open: deleteDialogOpen, setOpen: setDeleteDialogOpen }}
                type={type}
                definition={deletingAttribute}
            />
        </>
    );
};
