"use client";

import { useProfile } from "@/components/feature-modules/user/hooks/useProfile";
import { Workspace } from "@/components/feature-modules/workspace/interface/workspace.interface";
import { AvatarUploader } from "@/components/ui/AvatarUploader";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { CurrencySelector } from "@/components/ui/forms/currency/form-currency-picker";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ClassNameProps } from "@/lib/interfaces/interface";
import { WorkspacePlan } from "@/lib/types/types";
import { cn, isValidCurrency } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, SquareArrowUpRight } from "lucide-react";
import { FC } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { WorkspaceFormPreview } from "./workspace-preview";

const WorkspaceDetailsFormSchema = z.object({
    displayName: z
        .string({ required_error: "Display Name is required" })
        .min(3, "Display Name is too short"),
    plan: z.nativeEnum(WorkspacePlan),
    defaultCurrency: z.string().min(3).max(3).refine(isValidCurrency),
    avatarUrl: z.string().url().optional(),
    isDefault: z.boolean(),
});

export type WorkspaceFormDetails = z.infer<typeof WorkspaceDetailsFormSchema>;

interface Props extends ClassNameProps {
    workspace?: Workspace;
    renderHeader: () => React.ReactNode;
    onSubmit: (values: WorkspaceFormDetails) => Promise<void>;
    setUploadedAvatar: (file: Blob | null) => void;
}

export const WorkspaceForm: FC<Props> = ({
    workspace,
    onSubmit,
    setUploadedAvatar,
    renderHeader,
    className,
}) => {
    const { data: user } = useProfile();

    const form: UseFormReturn<WorkspaceFormDetails> = useForm<WorkspaceFormDetails>({
        resolver: zodResolver(WorkspaceDetailsFormSchema),
        defaultValues: {
            displayName: workspace?.name || "",
            avatarUrl: workspace?.avatarUrl || undefined,
            isDefault: user?.memberships.length === 0,
            plan: workspace?.plan || WorkspacePlan.FREE,
            defaultCurrency: workspace?.defaultCurrency?.currencyCode || "AUD",
        },
    });

    const handleAvatarUpload = (file: Blob): void => {
        // Store transformed image ready for upload upon form submission
        setUploadedAvatar(file);
        // Set the avatar URL in the form state
        const avatarURL = URL.createObjectURL(file);
        form.setValue("avatarUrl", avatarURL);
        URL.revokeObjectURL(avatarURL); // Clean up the object URL
    };

    const handleAvatarRemoval = (): void => {
        setUploadedAvatar(null);
        form.setValue("avatarUrl", undefined);
    };

    return (
        <div className="flex flex-col md:flex-row p-2 min-h-[100dvh]">
            <section className={cn("w-full md:w-2/5", className)}>
                <header>{renderHeader()}</header>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <section className="mr-8">
                            <FormField
                                control={form.control}
                                name="isDefault"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-end gap-2 mt-4 mb-2">
                                        <FormControl>
                                            <Checkbox
                                                disabled={user?.memberships.length === 0}
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                }}
                                            />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal">
                                            Set as default workspace
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                        </section>
                        <CardContent className="pb-8">
                            <h3 className="text-lg font-semibold mb-1">Workspace Overview</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                Provide some basic information about your workspace. You can update
                                these details later in your workspace settings.
                            </p>
                            <div className="flex flex-col space-y-6 mb-8">
                                <FormField
                                    control={form.control}
                                    name="avatarUrl"
                                    render={(_) => (
                                        <FormItem className="flex flex-col lg:flex-row w-full">
                                            <FormLabel className="w-1/3">
                                                Workspace Avatar
                                            </FormLabel>
                                            <AvatarUploader
                                                onUpload={handleAvatarUpload}
                                                imageURL={form.getValues("avatarUrl")}
                                                onRemove={handleAvatarRemoval}
                                                validation={{
                                                    maxSize: 5 * 1024 * 1024, // 5MB
                                                    allowedTypes: [
                                                        "image/jpeg",
                                                        "image/png",
                                                        "image/webp",
                                                    ],
                                                    errorMessage:
                                                        "Please upload a valid image file (JPEG, PNG, WebP) under 5MB",
                                                }}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="displayName"
                                    render={({ field }) => (
                                        <>
                                            <FormItem className="flex mt-2 flex-col lg:flex-row w-full">
                                                <FormLabel className="w-1/3" htmlFor="displayName">
                                                    Workspace Name *
                                                </FormLabel>
                                                <div className="w-auto flex-grow">
                                                    <Input
                                                        id="displayName"
                                                        placeholder="My Workspace"
                                                        className="w-full"
                                                        {...field}
                                                        required
                                                    />
                                                    <FormMessage className="text-xs mt-2 ml-1" />
                                                </div>
                                            </FormItem>
                                        </>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="defaultCurrency"
                                    render={({ field }) => (
                                        <>
                                            <FormItem className="flex mt-2 flex-col lg:flex-row w-full">
                                                <FormLabel
                                                    className="w-1/3"
                                                    htmlFor="defaultCurrency"
                                                >
                                                    Default Currency *
                                                </FormLabel>
                                                <CurrencySelector
                                                    className="w-auto flex-grow"
                                                    value={field.value}
                                                    onChange={(value) => {
                                                        field.onChange(value);
                                                    }}
                                                />
                                            </FormItem>
                                            <FormMessage />
                                        </>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="plan"
                                    render={({ field }) => (
                                        <>
                                            <FormItem className="flex mt-2 flex-col lg:flex-row w-full">
                                                <div className="w-full lg:w-1/3 mt-2">
                                                    <FormLabel className="w-1/3" htmlFor="plan">
                                                        Workspace Plan *
                                                    </FormLabel>
                                                    <Link
                                                        href={"/pricing"}
                                                        target="_blank"
                                                        className="text-xs text-content flex items-center w-fit h-fit mt-2 hover:opacity-50 transition-opacity"
                                                    >
                                                        Pricing
                                                        <SquareArrowUpRight className="w-3 h-3 ml-1" />
                                                    </Link>
                                                </div>
                                                <Select
                                                    defaultValue={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <FormControl className="flex flex-grow w-auto mt-2">
                                                        <SelectTrigger className="w-full lg:w-auto">
                                                            <SelectValue placeholder="Select a workspace plan" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value="FREE"
                                                            className="flex justify-between"
                                                        >
                                                            <span>Free</span>
                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                - $0/month
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="STARTUP">
                                                            <span>Startup</span>
                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                - $10/month
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="SCALE">
                                                            <span>Scale</span>
                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                - $25/month
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="ENTERPRISE">
                                                            <span>Enterprise</span>
                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                - Custom pricing
                                                            </span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                            <FormMessage />
                                        </>
                                    )}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end mt-4 py-1 border-t ">
                            <Button type="submit" size={"sm"} className="cursor-pointer">
                                Save
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </section>
            <section className="flex flex-grow flex-col relative bg-accent rounded-sm">
                <div className="sticky top-8">
                    <WorkspaceFormPreview data={form.watch()} />
                </div>
            </section>
        </div>
    );
};
