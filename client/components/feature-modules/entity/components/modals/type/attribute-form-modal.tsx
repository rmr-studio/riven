import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogControl } from "@/lib/interfaces/interface";
import { FC } from "react";
import { EntityAttributeDefinition, EntityRelationshipDefinition, EntityType } from "../../../interface/entity.interface";


interface Props{
    dialog: DialogControl;
    type: EntityType
    selectedAttribute: EntityAttributeDefinition | EntityRelationshipDefinition
}

export const AttributeFormModal: FC<Props> = ({ dialog, type, selectedAttribute }) => {
    const { open, setOpen: onOpenChange } = dialog;
    const isEditMode = Boolean(selectedAttribute);
    
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
            </DialogContent>
        </Dialog>
    );
};
