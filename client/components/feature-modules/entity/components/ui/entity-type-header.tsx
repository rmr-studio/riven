import { IconSelector } from "@/components/ui/icon/icon-selector";
import { IconColour, IconType } from "@/lib/types/types";
import { UseFormReturn } from "react-hook-form";
import { useConfigForm, type EntityTypeFormValues } from "../../context/configuration-provider";

export const EntityTypeConfigurationHeader = () => {
    const form: UseFormReturn<EntityTypeFormValues> = useConfigForm();

    const { watch, setValue } = form;
    const pluralName = watch("pluralName");
    const iconType = watch("icon");
    const iconColour = watch("iconColour");

    const onIconSelect = (icon: IconType, colour: IconColour) => {
        setValue("icon", icon);
        setValue("iconColour", colour);
    };

    return (
        <div className="flex items-center gap-4">
            <IconSelector
                onSelect={onIconSelect}
                icon={iconType}
                colour={iconColour}
                className="size-14 bg-accent/10 mt-1"
                displayIconClassName="size-10"
            />
            <div>
                <h1 className="text-2xl font-semibold">{pluralName}</h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                        Manage object attributes and other relevant settings
                    </span>
                </div>
            </div>
        </div>
    );
};
