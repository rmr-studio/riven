import { FormField } from "@/components/ui/form";
import { IconSelector } from "@/components/ui/icon/icon-selector";
import { ChildNodeProps } from "@/lib/interfaces/interface";
import { FC } from "react";
import { UseFormReturn } from "react-hook-form";
import { useConfigForm, type EntityTypeFormValues } from "../../context/configuration-provider";

interface Props extends ChildNodeProps {}

export const EntityTypeHeader: FC<Props> = ({ children }) => {
    const form: UseFormReturn<EntityTypeFormValues> = useConfigForm();

    const { watch, setValue } = form;
    const pluralName = watch("pluralName");

    return (
        <div className="flex items-center gap-4">
            <FormField
                control={form.control}
                name="icon"
                render={({ field }) => {
                    return (
                        <IconSelector
                            onSelect={field.onChange}
                            icon={field.value}
                            className="size-14 bg-accent/10 mt-1"
                            displayIconClassName="size-10"
                        />
                    );
                }}
            />

            <div>
                <h1 className="text-2xl font-semibold">{pluralName}</h1>
                <div className="flex items-center gap-2 mt-1">{children}</div>
            </div>
        </div>
    );
};
