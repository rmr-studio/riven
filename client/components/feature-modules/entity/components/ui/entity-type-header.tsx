import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";
import { IconSelector } from "@/components/ui/icon/icon-selector";
import { ChildNodeProps } from "@/lib/interfaces/interface";
import { Cog, File } from "lucide-react";
import Link from "next/link";
import { FC } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import {
    useConfigCurrentType,
    useConfigForm,
    type EntityTypeFormValues,
} from "../../context/configuration-provider";

interface Props extends ChildNodeProps {}

export const EntityTypeHeader: FC<Props> = ({ children }) => {
    const type = useConfigCurrentType();
    const form: UseFormReturn<EntityTypeFormValues> = useConfigForm();

    const name = useWatch({
        control: form.control,
        name: "pluralName",
    });

    const { key } = type;

    return (
        <div className="flex gap-4">
            <FormField
                control={form.control}
                name="icon"
                render={({ field }) => {
                    return (
                        <IconSelector
                            onSelect={field.onChange}
                            icon={field.value}
                            className="size-14 bg-accent/10 mt-1"
                            displayIconClassName="size-12"
                        />
                    );
                }}
            />

            <div>
                <div className="flex gap-1 items-center">
                    <h1 className="text-2xl font-semibold">{name}</h1>
                </div>

                <div className="flex items-center gap-2">{children}</div>
                <div className="flex gap-1 items-center mt-1">
                    <Link href={`/dashboard/workspace/${type.workspaceId}/entity/${key}`}>
                        <Button
                            variant={"secondary"}
                            className="relative p-1 h-6 mt-1 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            size={"xs"}
                        >
                            <File />
                            Entities
                        </Button>
                    </Link>
                    <Link
                        href={`/dashboard/workspace/${type.workspaceId}/entity/${key}/settings`}
                    >
                        <Button
                            size={"xs"}
                            variant={"secondary"}
                            className="p-1 h-6 mt-1 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                            <Cog className="size-4 " />
                            Settings
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};
