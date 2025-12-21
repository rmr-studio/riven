"use client";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChildNodeProps } from "@/lib/interfaces/interface";
import { toKeyCase } from "@/lib/util/utils";
import { PopoverClose } from "@radix-ui/react-popover";
import { Database, Info, Plus } from "lucide-react";
import { FC, useEffect } from "react";
import { useNewEntityTypeForm } from "../../hooks/use-new-entity-type-form";
import { EntityType } from "../../interface/entity.interface";

interface Props extends ChildNodeProps {
    entityTypes?: EntityType[];
    organisationId: string;
}

export const NewEntityTypeForm: FC<Props> = ({ entityTypes = [], organisationId, children }) => {
    const { form, keyManuallyEdited, setKeyManuallyEdited, handleSubmit } = useNewEntityTypeForm(
        organisationId,
        entityTypes
    );

    // Watch the pluralName field for dynamic title and key generation
    const pluralName = form.watch("pluralName");

    // Auto-generate key from pluralName
    useEffect(() => {
        if (!keyManuallyEdited && pluralName) {
            const generatedKey = toKeyCase(pluralName);
            form.setValue("key", generatedKey, { shouldValidate: false });
        }
    }, [pluralName, keyManuallyEdited, form]);

    const onSubmit = async (values: any) => {
        await handleSubmit(values);
        form.reset();
        setKeyManuallyEdited(false);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-full my-2 lg:min-w-3xl" align="end">
                <h1>Create a new Entity type</h1>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="flex flex-col lg:flex-row gap-2">
                            <FormField
                                control={form.control}
                                name="pluralName"
                                render={({ field }) => (
                                    <FormItem className="w-full flex flex-col">
                                        <FormLabel>Plural Noun</FormLabel>
                                        <FormDescription className="text-xs italic">
                                            This will be used to label a collection of these
                                            entities
                                        </FormDescription>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 flex-shrink-0">
                                                <Database className="h-4 w-4 text-primary" />
                                            </div>
                                            <FormControl>
                                                <div className="h-auto flex flex-grow items-end">
                                                    <Input
                                                        placeholder="e.g., Companies"
                                                        {...field}
                                                        className="flex-1"
                                                    />
                                                </div>
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Singular Noun */}
                            <FormField
                                control={form.control}
                                name="singularName"
                                render={({ field }) => (
                                    <FormItem className="w-full flex flex-col">
                                        <FormLabel>Singular Noun</FormLabel>
                                        <FormDescription className="text-xs italic">
                                            How we should label a single entity of this type
                                        </FormDescription>
                                        <FormControl>
                                            <div className="h-auto flex flex-grow items-end">
                                                <Input placeholder="e.g., Company" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex flex-col lg:flex-row gap-2">
                            <FormField
                                control={form.control}
                                name="key"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel className="flex items-center gap-1">
                                            Identifier
                                            <Info className="h-3 w-3 text-muted-foreground" />
                                        </FormLabel>
                                        <div className="flex items-center gap-2">
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., companies"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        setKeyManuallyEdited(true);
                                                    }}
                                                    className="flex-1"
                                                />
                                            </FormControl>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            <span className="font-medium">Important:</span> Once an
                                            object is created the slug cannot be changed.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem className="gap-2 flex flex-col items-start">
                                        <FormLabel className="flex items-center gap-1">
                                            Type
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger
                                                    onPointerDown={(e) => {
                                                        // Prevent the click from closing the popover
                                                        e.stopPropagation();
                                                    }}
                                                    className="min-w-3xs w-full"
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent
                                                onCloseAutoFocus={(e) => {
                                                    // Prevent focus returning to popover which would close it
                                                    e.preventDefault();
                                                }}
                                            >
                                                <SelectItem value="STANDARD">Standard</SelectItem>
                                                <SelectItem value="RELATIONSHIP">
                                                    Relationship
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe what this entity type represents..."
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <footer className="pt-4 flex w-full gap-2 justify-end">
                            <PopoverClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        form.reset();
                                        setKeyManuallyEdited(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </PopoverClose>
                            <Button type="submit">
                                <Plus className="size-4" />
                                <span>Create Entity Type</span>
                            </Button>
                        </footer>
                    </form>
                </Form>
            </PopoverContent>
        </Popover>
    );
};
