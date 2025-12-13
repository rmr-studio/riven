import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FC } from "react";
import { UseFormReturn } from "react-hook-form";
import { AttributeFormValues } from "./attribute-dialog";
import { attributeTypes } from "@/components/ui/attribute-type-dropdown";
import { EnumOptionsEditor } from "./enum-options-editor";

interface Props {
    form: UseFormReturn<AttributeFormValues>;
    isEditMode?: boolean;
}

export const AttributeForm: FC<Props> = ({ form, isEditMode = false }) => {
    const selectedType = form.watch("selectedType");

    // Determine what schema options to show based on the selected type
    const selectedAttr = attributeTypes.find((attr) => attr.key === selectedType);
    const isSelectType = selectedType === "select" || selectedType === "multi_select";
    const isNumberType = selectedAttr?.type === "NUMBER";
    const isStringType = selectedAttr?.type === "STRING";

    return (
        <>
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter attribute name" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Key</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="attribute_key"
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
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Add a description for this attribute"
                                rows={3}
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="required"
                    render={({ field }) => (
                        <>
                            <FormItem className="flex items-center justify-between space-y-0 mb-1">
                                <FormLabel>Required</FormLabel>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                            <FormDescription className="text-xs italic">
                                Required attributes must have a value for each record
                            </FormDescription>
                        </>
                    )}
                />
                <FormField
                    control={form.control}
                    name="unique"
                    render={({ field }) => (
                        <>
                            <FormItem className="flex items-center justify-between space-y-0 mb-1">
                                <FormLabel>Unique</FormLabel>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                            <FormDescription className="text-xs italic">
                                Unique attributes enforce distinct values across all records. There
                                can be only one record with a given value.
                            </FormDescription>
                        </>
                    )}
                />
            </div>

            {/* Schema Options */}
            {isSelectType && <EnumOptionsEditor form={form} />}

            {isNumberType && (
                <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-3">Value Constraints</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="minimum"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Minimum Value</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Min"
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value === ""
                                                        ? undefined
                                                        : parseFloat(e.target.value)
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="maximum"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Maximum Value</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Max"
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value === ""
                                                        ? undefined
                                                        : parseFloat(e.target.value)
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            )}

            {isStringType && (
                <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-3">String Constraints</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="minLength"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Minimum Length</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Min length"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value === ""
                                                            ? undefined
                                                            : parseInt(e.target.value)
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxLength"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Maximum Length</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Max length"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value === ""
                                                            ? undefined
                                                            : parseInt(e.target.value)
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="regex"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Regex Pattern (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="^[A-Za-z]+$"
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Regular expression pattern for validation
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            )}
        </>
    );
};
