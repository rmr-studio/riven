import { EntityRelationshipDefinition } from "@/components/feature-modules/entity/interface/entity.interface";
import { FC } from "react";
import { UseFormReturn } from "react-hook-form";

interface Props {
    relationship: EntityRelationshipDefinition;
    form: UseFormReturn
    onBlur: () => void;
}

const EditEntityRelationshipPicker: FC<Props> = ({relationship, onBlur, form}) => {
    return <div></div>;
};

export default EditEntityRelationshipPicker;
