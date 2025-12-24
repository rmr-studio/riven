import { AttributeTypeDropdown } from "@/components/ui/attribute-type-dropdown";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DialogControl } from "@/lib/interfaces/interface";
import { SchemaType } from "@/lib/types/types";
import { FC, useMemo, useState } from "react";
import {
    EntityAttributeDefinition,
    EntityRelationshipDefinition,
    EntityType,
    isRelationshipDefinition,
} from "../../../interface/entity.interface";
import { RelationshipAttributeForm } from "../../forms/type/relationship/relationship-form";

interface Props {
    dialog: DialogControl;
    type: EntityType;
    selectedAttribute?: EntityAttributeDefinition | EntityRelationshipDefinition;
}

export const AttributeFormModal: FC<Props> = ({ dialog, type, selectedAttribute }) => {
    const { open, setOpen: onOpenChange } = dialog;
    const isEditMode = Boolean(selectedAttribute);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [currentType, setCurrentType] = useState<SchemaType | "RELATIONSHIP">(
        isRelationshipDefinition(selectedAttribute!)
            ? "RELATIONSHIP"
            : selectedAttribute
            ? selectedAttribute.schema.key
            : SchemaType.TEXT
    );

    const isRelationship = useMemo(() => {
        return currentType === "RELATIONSHIP";
    }, [currentType]);

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
                    <AttributeTypeDropdown
                        open={dropdownOpen}
                        setOpen={setDropdownOpen}
                        onChange={setCurrentType}
                        type={currentType}
                    />
                    {isRelationship ? <RelationshipAttributeForm /> : <AttributeForm />}
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
};
