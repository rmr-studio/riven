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
import { Switch } from "@/components/ui/switch";
import { EntityRelationshipCardinality } from "@/lib/types/types";
import { FC } from "react";
import { UseFormReturn } from "react-hook-form";
import { EntityType } from "../../interface/entity.interface";
import { AttributeFormValues } from "./attribute-dialog";

interface Props {
    type?: EntityType;
    avaiableTypes?: EntityType[];
    form: UseFormReturn<AttributeFormValues>;
    isEditMode?: boolean;
}

export const RelationshipAttributeForm: FC<Props> = ({ type, avaiableTypes, form, isEditMode = false }) => {
    return (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                            <span className="text-xs font-semibold">
                                {type?.name?.plural?.charAt(0) || "E"}
                            </span>
                        </div>
                        <span className="font-medium">
                            {type?.name?.plural || "Current Entity"}
                        </span>
                    </div>
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Associated attribute name</FormLabel>
                                <FormControl>
                                    <Input placeholder="E.g. Person" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex items-center justify-center pt-8">
                    <FormField
                        control={form.control}
                        name="cardinality"
                        render={({ field }) => (
                            <FormItem>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem
                                            value={EntityRelationshipCardinality.ONE_TO_ONE}
                                        >
                                            One to one
                                        </SelectItem>
                                        <SelectItem
                                            value={EntityRelationshipCardinality.ONE_TO_MANY}
                                        >
                                            One to many
                                        </SelectItem>
                                        <SelectItem
                                            value={EntityRelationshipCardinality.MANY_TO_ONE}
                                        >
                                            Many to one
                                        </SelectItem>
                                        <SelectItem
                                            value={EntityRelationshipCardinality.MANY_TO_MANY}
                                        >
                                            Many to many
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <FormField
                control={form.control}
                name="entityTypeKeys"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Target Entity Type</FormLabel>
                        <Select
                            onValueChange={(value) => field.onChange([value])}
                            value={field.value?.[0]}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select entity type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {avaiableTypes?.map((et) => (
                                    <SelectItem key={et.key} value={et.key}>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
                                                <span className="text-xs">
                                                    {et.name.plural.charAt(0)}
                                                </span>
                                            </div>
                                            <span>{et.name.plural}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="targetAttributeName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Associated attribute name (other side)</FormLabel>
                        <FormControl>
                            <Input placeholder="E.g. Company" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Key</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="relationship_key"
                                    {...field}
                                    disabled={isEditMode}
                                    className={isEditMode ? "bg-muted cursor-not-allowed" : ""}
                                />
                            </FormControl>
                            <FormDescription className="text-xs">
                                {isEditMode
                                    ? "Key cannot be changed after creation"
                                    : "Auto-generated from name"}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="inverseName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Inverse Label (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Inverse relationship name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="minOccurs"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Min Occurrences</FormLabel>
                            <FormControl>
                                <Input type="number" min={0} placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="maxOccurs"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Max Occurrences</FormLabel>
                            <FormControl>
                                <Input type="number" min={0} placeholder="Unlimited" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="bidirectional"
                render={({ field }) => (
                    <FormItem className="rounded-lg border p-3">
                        <div className="flex items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <FormLabel>Bidirectional</FormLabel>
                                <FormDescription>
                                    Add this relationship to the other entity
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </div>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="allowPolymorphic"
                render={({ field }) => (
                    <FormItem className="rounded-lg border p-3">
                        <div className="flex items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <FormLabel>Allow any entity type</FormLabel>
                                <FormDescription>
                                    Enable polymorphic relationships across all entity types
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </div>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel>Required</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </>
    );
};
