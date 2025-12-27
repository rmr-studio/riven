"use client";

import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { FC, useState } from "react";
import { useConfigForm, useConfigIsDirty } from "../../context/configuration-provider";
import { type EntityTypeFormValues } from "../../context/configuration-provider";

interface Props {
    onSubmit: (values: EntityTypeFormValues) => Promise<void>;
}

export const EntityTypeSaveButton: FC<Props> = ({ onSubmit }) => {
    const isDirty = useConfigIsDirty();
    const form = useConfigForm();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!form) return;

        setIsSaving(true);
        try {
            await form.handleSubmit(onSubmit)();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            variant={isDirty ? "default" : "outline"}
            size="sm"
        >
            <Save className="size-4 mr-2" />
            {isSaving ? "Saving..." : isDirty ? "Save Changes" : "Saved"}
        </Button>
    );
};
