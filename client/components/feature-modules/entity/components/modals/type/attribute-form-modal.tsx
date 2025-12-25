import { useOrganisation } from "@/components/feature-modules/organisation/hooks/use-organisation";
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
import { FC, useEffect, useMemo, useState } from "react";
import {
    EntityAttributeDefinition,
    EntityRelationshipDefinition,
    EntityType,
    isRelationshipDefinition,
} from "../../../interface/entity.interface";
import { SchemaForm } from "../../forms/type/attribute/schema-form";
import { RelationshipAttributeForm } from "../../forms/type/relationship/relationship-form";

interface Props {
    dialog: DialogControl;
    type: EntityType;
    identifierKey: string;
    selectedAttribute?: EntityAttributeDefinition | EntityRelationshipDefinition;
}

export const AttributeFormModal: FC<Props> = ({ dialog, type, selectedAttribute }) => {
    const { open, setOpen: onOpenChange } = dialog;
    const isEditMode = Boolean(selectedAttribute);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [currentType, setCurrentType] = useState<SchemaType | "RELATIONSHIP">(SchemaType.TEXT);
    const { data: organisation } = useOrganisation();

    useEffect(() => {
        if (!selectedAttribute) {
            setCurrentType(SchemaType.TEXT);
            return;
        }
        if (isRelationshipDefinition(selectedAttribute)) {
            setCurrentType("RELATIONSHIP");
            return;
        }
        setCurrentType(selectedAttribute.schema.key);
    }, [selectedAttribute]);

    const isRelationship = useMemo(() => {
        return currentType === "RELATIONSHIP";
    }, [currentType]);

    const allowTypeSwitch = useMemo(() => {
        if (!selectedAttribute) return true;
        return !isRelationshipDefinition(selectedAttribute);
    }, [selectedAttribute]);

    if (!organisation) return null;

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
                    <section className="flex flex-col gap-6">
                        {allowTypeSwitch && (
                            <AttributeTypeDropdown
                                open={dropdownOpen}
                                setOpen={setDropdownOpen}
                                onChange={setCurrentType}
                                type={currentType}
                            />
                        )}
                        {isRelationship ? (
                            <RelationshipAttributeForm
                                organisationId={organisation.id}
                                dialog={dialog}
                                type={type}
                                relationship={selectedAttribute as EntityRelationshipDefinition}
                            />
                        ) : (
                            <SchemaForm
                                organisationId={organisation.id}
                                dialog={dialog}
                                currentType={currentType as SchemaType}
                                type={type}
                                attribute={selectedAttribute as EntityAttributeDefinition}
                            />
                        )}
                    </section>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
};
