"use client";

import { Workspace } from "@/components/feature-modules/organisation/interface/workspace.interface";
import { useProfile } from "@/components/feature-modules/user/hooks/useProfile";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { AddressFormSchema } from "@/components/ui/forms/bespoke/AddressFormSection";
import { CustomAttributesFormSchema } from "@/components/ui/forms/bespoke/CustomAttributesFormSection";
import { PaymentDetailsFormSchema } from "@/components/ui/forms/bespoke/PaymentDetailsFormSchema";
import { FormStepper } from "@/components/ui/forms/form-stepper";
import { Separator } from "@/components/ui/separator";
import { ClassNameProps } from "@/lib/interfaces/interface";
import { Step } from "@/lib/util/form/form.util";
import { cn, isValidCurrency } from "@/lib/util/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import WorkspaceDetailsForm from "./1.workspace-details";
import WorkspaceBillingForm from "./2.workspace-billing";
import WorkspaceAttributesForm from "./3.workspace-attributes";
import { WorkspaceFormPreview } from "./workspace-preview";

const WorkspaceDetailsFormSchema = z.object({
    displayName: z
        .string({ required_error: "Display Name is required" })
        .min(3, "Display Name is too short"),
    plan: z.enum(["FREE", "STARTUP", "SCALE", "ENTERPRISE"]),
    defaultCurrency: z.string().min(3).max(3).refine(isValidCurrency),
    avatarUrl: z.string().url().optional(),
    isDefault: z.boolean(),
    businessNumber: z.string().optional(),
    taxId: z.string().optional(),
    address: AddressFormSchema,
    payment: PaymentDetailsFormSchema.optional(),
    customAttributes: CustomAttributesFormSchema,
});

export type WorkspaceFormDetails = z.infer<typeof WorkspaceDetailsFormSchema>;
export type WorkspaceFormTab = "base" | "billing" | "custom";

interface Props extends ClassNameProps {
    workspace?: Workspace;
    renderHeader: () => React.ReactNode;
    onSubmit: (values: WorkspaceFormDetails) => Promise<void>;
    setUploadedAvatar: (file: Blob | null) => void;
}

export interface WorkspaceStepFormProps {
    form: UseFormReturn<WorkspaceFormDetails>;
    setUploadedAvatar: (file: Blob | null) => void;
    handlePreviousPage: (tab: WorkspaceFormTab) => void;
    handleNextPage: (tab: WorkspaceFormTab) => void;
    handleFormSubmit: (values: WorkspaceFormDetails) => Promise<void>;
}

export const WorkspaceForm: FC<Props> = ({
    workspace,
    onSubmit,
    setUploadedAvatar,
    renderHeader,
    className,
}) => {
    const { data: user } = useProfile();
    const [activeTab, setActiveTab] = useState<WorkspaceFormTab>("base");

    const form: UseFormReturn<WorkspaceFormDetails> = useForm<WorkspaceFormDetails>({
        resolver: zodResolver(WorkspaceDetailsFormSchema),
        defaultValues: {
            displayName: workspace?.name || "",
            avatarUrl: workspace?.avatarUrl || undefined,
            isDefault: user?.memberships.length === 0,
            plan: workspace?.plan || "FREE",
            defaultCurrency: workspace?.defaultCurrency?.currencyCode || "AUD",
            businessNumber: workspace?.businessNumber || "",
            taxId: workspace?.taxId || "",
            address: {
                street: workspace?.address?.street || "",
                city: workspace?.address?.city || "",
                state: workspace?.address?.state || "",
                postalCode: workspace?.address?.postalCode || "",
                country: workspace?.address?.country || "AU",
            },
            payment: {
                bsb: workspace?.workspacePaymentDetails?.bsb || "",
                accountNumber: workspace?.workspacePaymentDetails?.accountNumber || "",
                accountName: workspace?.workspacePaymentDetails?.accountName || "",
            },
            customAttributes: workspace?.customAttributes || {},
        },
    });

    const handleNextPage = (tab: WorkspaceFormTab) => {
        setActiveTab(tab);
    };

    const handlePreviousPage = (tab: WorkspaceFormTab) => {
        setActiveTab(tab);
    };

    const renderStepComponent = (tab: WorkspaceFormTab) => {
        const props: WorkspaceStepFormProps = {
            form: form,
            setUploadedAvatar: setUploadedAvatar,
            handlePreviousPage: handlePreviousPage,
            handleNextPage: handleNextPage,
            handleFormSubmit: onSubmit,
        };

        const tabMap: Record<WorkspaceFormTab, React.ReactNode> = {
            base: <WorkspaceDetailsForm {...props} />,
            billing: <WorkspaceBillingForm {...props} />,
            custom: <WorkspaceAttributesForm {...props} />,
        };

        return tabMap[tab] || <WorkspaceDetailsForm {...props} />;
    };

    const steps: Step<WorkspaceFormTab>[] = [
        {
            identifier: "base",
            step: 1,
            title: "Workspace Details",
            description: "Enter your workspace's basic details",
        },
        {
            identifier: "billing",
            step: 2,
            title: "Billing Information",
            description:
                "Provide your workspace billing information for invoicing and report generation purposes",
        },
        {
            identifier: "custom",
            step: 3,
            title: "Custom Attributes",
            description:
                "Add any additional attributes for your workspace to be used in invoices and reports",
        },
    ];

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
                        <section className="mt-2">
                            <FormStepper
                                steps={steps}
                                currentStep={activeTab}
                                descriptionType="icon"
                            />
                            <Separator className="mt-6 mb-4" />
                        </section>
                        {renderStepComponent(activeTab)}
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
