import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FC } from "react";
import { UseFormReturn } from "react-hook-form";
import { EntityTypeFormValues } from "../../../hooks/form/use-entity-type-form";
import { AttributeFormData } from "../../../interface/entity.interface";

interface Props {
    form: UseFormReturn<EntityTypeFormValues>;
    availableIdentifiers: AttributeFormData[];
}

export const ConfigurationForm: FC<Props> = ({ form, availableIdentifiers }) => {
    return (
        <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">General</h2>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6 items-start">
                    {/* Name */}
                    <FormField
                        control={form.control}
                        name="pluralName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-semibold">Plural noun</FormLabel>
                                <FormDescription className="text-xs italic">
                                    This will be used to label a collection of these entities
                                </FormDescription>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Input placeholder="e.g., Companies" {...field} />
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Plural Name */}
                    <FormField
                        control={form.control}
                        name="singularName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-semibold">Singular noun</FormLabel>
                                <FormDescription className="text-xs italic">
                                    How we should label a single entity of this type
                                </FormDescription>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Input placeholder="e.g., Company" {...field} />
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Description */}
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
                {/* Identifier Key */}
                <FormField
                    control={form.control}
                    name="identifierKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Identifier Key</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-xs">
                                        <SelectValue placeholder="Select a unique identifier" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableIdentifiers.map((attr) => (
                                        <SelectItem key={attr.id} value={attr.id}>
                                            {attr.label}
                                        </SelectItem>
                                    ))}
                                    {availableIdentifiers.length === 0 && (
                                        <SelectItem value="name" disabled>
                                            No unique attributes available
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <FormDescription className="max-w-sm mx-1">
                                This attribute will be used to uniquely identify an entity, and must
                                point to an attribute marked as unique, and mandatory.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};
