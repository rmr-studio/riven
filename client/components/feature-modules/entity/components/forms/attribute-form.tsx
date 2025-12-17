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
import { SchemaType } from "@/lib/types/types";
import { FC } from "react";
import { UseFormReturn } from "react-hook-form";
import { AttributeFormValues } from "../types/entity-type-attribute-dialog";
import { EnumOptionsEditor } from "./enum-options-editor";

interface Props {
    form: UseFormReturn<AttributeFormValues>;
    isEditMode?: boolean;
    isIdentifierAttribute?: boolean;
}

export const AttributeForm: FC<Props> = ({
    form,
    isEditMode = false,
    isIdentifierAttribute = false,
}) => {
    const selectedType: SchemaType | "RELATIONSHIP" = form.watch("selectedType");
    if (selectedType === "RELATIONSHIP") return null;

    // Determine what schema options to show based on the selected type

    const requireEnumOptions = [SchemaType.SELECT, SchemaType.MULTI_SELECT].includes(selectedType);
    const requireNumericalValidation = selectedType == SchemaType.NUMBER;
    const requireStringValidation = [SchemaType.TEXT, SchemaType.EMAIL, SchemaType.PHONE].includes(
        selectedType
    );

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
                                        disabled={isIdentifierAttribute}
                                    />
                                </FormControl>
                            </FormItem>
                            <FormDescription className="text-xs italic">
                                {isIdentifierAttribute
                                    ? "This attribute is the identifier key and must be required"
                                    : "Required attributes must have a value for each record"}
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
                                        disabled={isIdentifierAttribute}
                                    />
                                </FormControl>
                            </FormItem>
                            <FormDescription className="text-xs italic">
                                {isIdentifierAttribute
                                    ? "This attribute is the identifier key and must be unique"
                                    : "Unique attributes enforce distinct values across all records. There can be only one record with a given value."}
                            </FormDescription>
                        </>
                    )}
                />
            </div>

            {/* Schema Options */}
            {requireEnumOptions && <EnumOptionsEditor form={form} />}

            {requireNumericalValidation && (
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

            {requireStringValidation && (
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
