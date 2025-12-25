"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/components/ui/form";
import { IconSelector } from "@/components/ui/icon/icon-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconColour, IconType } from "@/lib/types/types";
import { AlertCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FC, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useEntityTypeForm } from "../../hooks/form/type/use-configuration-form";
import { type EntityType } from "../../interface/entity.interface";

import { ConfigurationForm } from "../forms/type/configuration-form";
import { EntityTypesAttributes } from "./entity-type-attributes";

interface EntityTypeOverviewProps {
    entityType: EntityType;
    organisationId: string;
}

export const EntityTypeOverview: FC<EntityTypeOverviewProps> = ({ entityType, organisationId }) => {
    // Read tab query parameter from URL
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    // Valid tab values
    const validTabs = ["configuration", "attributes"];
    const defaultTab = validTabs.includes(tabParam || "") ? tabParam! : "configuration";

    // Active tab state
    const [activeTab, setActiveTab] = useState<string>(defaultTab);

    // Sync active tab with URL parameter changes (e.g., browser back/forward)
    useEffect(() => {
        if (defaultTab !== activeTab) {
            setActiveTab(defaultTab);
        }
    }, [defaultTab]);

    // Update URL when tab changes
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", value);
        router.push(`${pathname}?${params.toString()}`);
    };

    // Configuration form needs to be global for unsaved value accessibility
    const { form } = useEntityTypeForm(organisationId, entityType);

    // Global Form Values
    const identifierKey = form.watch("identifierKey");
    const iconType = form.watch("icon");
    const iconColour = form.watch("iconColour");
    const pluralName = form.watch("pluralName");

    // Determine which tabs have validation errors
    const tabErrors = useMemo(() => {
        const errors = form.formState.errors;
        const configurationFields = [
            "pluralName",
            "singularName",
            "key",
            "identifierKey",
            "description",
            "type",
        ];

        const hasConfigurationErrors = configurationFields.some(
            (field) => errors[field as keyof typeof errors]
        );

        return {
            configuration: hasConfigurationErrors,
        };
    }, [form.formState.errors]);

    const validName = pluralName && pluralName.trim().length > 0;

    // Clear manual error on pluralName when user enters a valid name
    useEffect(() => {
        if (validName && form.formState.errors.pluralName?.type === "manual") {
            form.clearErrors("pluralName");
        }
    }, [validName, form]);

    const handleInvalidSubmit = (errors: typeof form.formState.errors) => {
        const errorMessages: string[] = [];

        // Collect all error messages
        Object.entries(errors).forEach(([field, error]) => {
            if (error && typeof error === "object" && "message" in error) {
                const fieldName = field.replace(/([A-Z])/g, " $1").toLowerCase();
                errorMessages.push(`${fieldName}: ${error.message}`);
            }
        });

        // Show toast with all validation errors
        toast.error("Validation errors", {
            description:
                errorMessages.length > 0
                    ? errorMessages.join("\n")
                    : "Please check all required fields and try again.",
        });
    };

    const onIconSelect = (icon: IconType, colour: IconColour) => {
        form.setValue("icon", icon);
        form.setValue("iconColour", colour);
    };

    return (
        <>
            <Form {...form}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
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
                    </div>

                    {/* Validation Errors */}
                    {form.formState.errors.root && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                {form.formState.errors.root.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="justify-start w-2/5">
                            <TabsTrigger value="configuration">
                                <div className="flex items-center gap-2">
                                    Configuration
                                    {tabErrors.configuration && (
                                        <AlertCircle className="size-4 mr-1 text-destructive" />
                                    )}
                                </div>
                            </TabsTrigger>

                            <TabsTrigger value="attributes">
                                <div className="flex items-center gap-2">
                                    Attributes
                                    <Badge className="h-4 w-5 border border-border ">
                                        {entityType.attributes.first + entityType.attributes.second}
                                    </Badge>
                                </div>
                            </TabsTrigger>
                        </TabsList>

                        {/* Configuration Tab */}
                        <TabsContent value="configuration" className="space-y-6">
                            <ConfigurationForm
                                form={form}
                                availableIdentifiers={Object.entries(
                                    entityType.schema.properties ?? {}
                                )
                                    .filter(([, attr]) => attr.unique && attr.required)
                                    .map(([id, attr]) => ({
                                        id,
                                        schema: attr,
                                    }))}
                            />
                        </TabsContent>

                        {/* Attributes Tab */}
                        <TabsContent value="attributes" className="space-y-4">
                            <EntityTypesAttributes
                                type={entityType}
                                identifierKey={identifierKey}
                                organisationId={organisationId}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </Form>
        </>
    );
};
