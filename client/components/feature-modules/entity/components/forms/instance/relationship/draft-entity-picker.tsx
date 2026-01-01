import { useEntityDraft } from "@/components/feature-modules/entity/context/entity-provider";
import { EntityRelationshipDefinition } from "@/components/feature-modules/entity/interface/entity.interface";
import { FC } from "react";
import { useFormState } from "react-hook-form";
import { EntityRelationshipPicker } from "../entity-relationship-picker";

interface Props {
    relationship: EntityRelationshipDefinition;
}

export const DraftEntityRelationshipPicker: FC<Props> = ({ relationship }) => {
    const { form } = useEntityDraft();

    const value = form.watch(relationship.id);

    // Watch for validation errors on this specific field
    const { errors: formErrors } = useFormState({
        control: form.control,
        name: relationship.id,
    });

    const errors = formErrors[relationship.id]?.message
        ? [String(formErrors[relationship.id]?.message)]
        : formErrors[relationship.id]?.type
        ? [String(formErrors[relationship.id]?.type)]
        : undefined;

    const handleBlur = async () => {
        await form.trigger(relationship.id);
    };

    const handleChange = (newValue: string | string[] | null) => {};

    const handleRemove = (entityId: string) => {
        if (Array.isArray(value)) {
            const updatedValue = value.filter((id) => id !== entityId);
            form.setValue(relationship.id, updatedValue);
        } else {
            form.setValue(relationship.id, null);
        }
    };

    return (
        <EntityRelationshipPicker
            relationship={relationship}
            handleBlur={handleBlur}
            value={value}
            errors={errors}
            handleChange={handleChange}
            handleRemove={handleRemove}
        />
    );
};
