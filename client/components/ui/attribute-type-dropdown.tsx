import { DataType } from "@/lib/types/types";
import { AttributeSchemaType, attributeTypes } from "@/lib/util/form/schema.util";
import { cn } from "@/lib/util/utils";
import { Check, ChevronsUpDown, Link2 } from "lucide-react";
import { Dispatch, FC, SetStateAction, useMemo } from "react";
import { Button } from "./button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./command";
import { FormControl } from "./form";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface Props {
    attributeKey: string;
    onChange: (value: string) => void;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

export type AttributeKey = DataType | "RELATIONSHIP";

export const AttributeTypeDropdown: FC<Props> = ({ onChange, attributeKey, open, setOpen }) => {
    const groupedAttributes = useMemo(() => {
        const groups: Partial<Record<DataType, AttributeSchemaType[]>> = {
            [DataType.STRING]: [],
            [DataType.NUMBER]: [],
            [DataType.BOOLEAN]: [],
            [DataType.OBJECT]: [],
            [DataType.ARRAY]: [],
        };

        Object.values(attributeTypes).forEach((attr) => {
            if (groups[attr.type]) {
                groups[attr.type]!.push(attr);
            }
        });

        return groups;
    }, []);

    const selectedAttribute = useMemo(() => {
        if (attributeKey === "RELATIONSHIP") {
            return { label: "Relationship", icon: Link2 };
        }
        return (
            Object.values(attributeTypes).find((attr) => attr.key === attributeKey) ||
            Object.values(attributeTypes)[0]
        );
    }, [attributeKey]);
    const getGroupName = (type: DataType): string => {
        switch (type) {
            case DataType.STRING:
                return "Text";
            case DataType.NUMBER:
                return "Number";
            case DataType.BOOLEAN:
                return "Boolean";
            case DataType.OBJECT:
                return "Object";
            case DataType.ARRAY:
                return "Array";
            default:
                return type;
        }
    };

    return (
        <Popover modal={true} onOpenChange={setOpen} open={open}>
            <FormControl>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                        disabled={open}
                    >
                        <div className="flex items-center gap-2">
                            <selectedAttribute.icon className="h-4 w-4" />
                            <span>{selectedAttribute.label}</span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
            </FormControl>
            <PopoverContent
                className="w-[400px] p-0"
                align="start"
                portal={true}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                }}
            >
                <Command>
                    <CommandInput placeholder="Search attribute types..." />
                    <CommandList>
                        <CommandEmpty>No attribute type found.</CommandEmpty>
                        <CommandGroup heading="Relationship">
                            <CommandItem
                                className="px-0 text-sm text-primary/80"
                                value="relationship"
                                onSelect={() => {
                                    onChange("RELATIONSHIP");
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-1 size-3.5",
                                        attributeKey === "RELATIONSHIP"
                                            ? "opacity-100"
                                            : "opacity-0"
                                    )}
                                />
                                <Link2 className="mr-1 size-3.5" />
                                Relationship
                            </CommandItem>
                        </CommandGroup>
                        {Object.entries(groupedAttributes).map(
                            ([type, attrs]) =>
                                attrs &&
                                attrs.length > 0 && (
                                    <CommandGroup
                                        key={type}
                                        heading={getGroupName(type as DataType)}
                                    >
                                        {attrs.map((attr) => (
                                            <CommandItem
                                                className="text-sm px-0 text-primary/80"
                                                key={attr.key}
                                                value={attr.key}
                                                onSelect={() => {
                                                    onChange(attr.key);
                                                    setOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-1 size-3.5",
                                                        attributeKey === attr.key
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                                <attr.icon className="mr-1 size-3.5" />
                                                {attr.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
