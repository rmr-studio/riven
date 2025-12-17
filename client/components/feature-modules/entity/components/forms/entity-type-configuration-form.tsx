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
import { Database } from "lucide-react";
import { FC } from "react";
import { UseFormReturn } from "react-hook-form";
import { EntityTypeFormValues } from "../../hooks/use-entity-type-form";
import { AttributeFormData } from "../../interface/entity.interface";

interface Props {
    form: UseFormReturn<EntityTypeFormValues>;
    mode: "create" | "edit";
    keyManuallyEdited: boolean;
    setKeyManuallyEdited: (value: boolean) => void;
    availableIdentifiers: AttributeFormData[];
}

export const ConfigurationForm: FC<Props> = ({
    form,
    mode,
    keyManuallyEdited,
    setKeyManuallyEdited,
    availableIdentifiers,
}) => {
    return (
        <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">General</h2>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
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
                                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                                        <Database className="h-4 w-4 text-primary" />
                                    </div>
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

                {/* Key / Slug */}
                <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Identifier / Slug</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g., companies"
                                    disabled={mode === "edit"}
                                    {...field}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        if (mode === "create") {
                                            setKeyManuallyEdited(true);
                                        }
                                    }}
                                />
                            </FormControl>
                            <FormDescription className="text-xs italic">
                                A unique key used to identify and link this particular entity type.
                                This cannot be changed later.
                                {mode === "create" && !keyManuallyEdited && (
                                    <span className="block mt-1 text-muted-foreground">
                                        Auto-generated from plural noun. Edit to customize.
                                    </span>
                                )}
                            </FormDescription>
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
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a unique identifier" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableIdentifiers.map((attr) => (
                                        <SelectItem key={attr.label} value={attr.label}>
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
                            <FormDescription>
                                This attribute will be used to uniquely identify an entity. This
                                value must reference an attribute marked as "Unique", and must be a
                                Required field.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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

                {/* Type */}
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={mode === "edit"}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="STANDARD">Standard</SelectItem>
                                    <SelectItem value="RELATIONSHIP">Relationship</SelectItem>
                                </SelectContent>
                            </Select>
                            {mode === "edit" && (
                                <FormDescription>
                                    Entity type cannot be changed after creation
                                </FormDescription>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};
