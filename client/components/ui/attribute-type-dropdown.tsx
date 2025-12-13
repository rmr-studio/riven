import { Schema, SchemaOptions } from "@/lib/interfaces/common.interface";
import { DataFormat, DataType } from "@/lib/types/types";
import { cn } from "@/lib/util/utils";
import {
    AtSign,
    Calendar,
    Check,
    CheckSquare,
    ChevronsUpDown,
    Clock,
    Code,
    DollarSign,
    Hash,
    Link,
    Link2,
    List,
    ListChecks,
    MapPin,
    Paperclip,
    Percent,
    Phone,
    Stars,
    Type,
} from "lucide-react";
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
    key: string;
    onChange: (value: string) => void;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

export type AttributeKey = DataType | "RELATIONSHIP";

export interface AttributeSchemaType {
    label: string;
    key: string;
    type: DataType;
    format?: DataFormat;
    options?: SchemaOptions;
    icon: FC<React.SVGProps<SVGSVGElement>>;
    schemaBuilder?: (schema: Schema, config: any) => Schema;
}

export const attributeTypes: AttributeSchemaType[] = [
    { label: "Text", key: "text", type: DataType.STRING, icon: Type },
    { label: "Number", key: "number", type: DataType.NUMBER, icon: Hash },
    { label: "Checkbox", key: "checkbox", type: DataType.BOOLEAN, icon: CheckSquare },
    {
        label: "Date",
        key: "date",
        type: DataType.STRING,
        format: DataFormat.DATE,
        icon: Calendar,
    },
    {
        label: "DateTime",
        key: "datetime",
        type: DataType.STRING,
        format: DataFormat.DATETIME,
        icon: Clock,
    },
    {
        label: "Rating",
        key: "rating",
        type: DataType.NUMBER,
        options: { minimum: 1, maximum: 5 },
        icon: Stars,
    },
    {
        label: "Phone",
        key: "phone",
        type: DataType.STRING,
        format: DataFormat.PHONE,
        icon: Phone,
    },
    {
        label: "Email",
        key: "email",
        type: DataType.STRING,
        format: DataFormat.EMAIL,
        icon: AtSign,
    },
    { label: "URL", key: "url", type: DataType.STRING, format: DataFormat.URL, icon: Link },
    {
        label: "Currency",
        key: "currency",
        type: DataType.NUMBER,
        format: DataFormat.CURRENCY,
        icon: DollarSign,
    },
    {
        label: "Percentage",
        key: "percentage",
        type: DataType.NUMBER,
        format: DataFormat.PERCENTAGE,
        icon: Percent,
    },
    {
        label: "Select",
        key: "select",
        type: DataType.STRING,
        icon: List,
    },
    {
        label: "Multi-select",
        type: DataType.ARRAY,
        key: "multi_select",
        icon: ListChecks,
    },
    { label: "File Attachments", key: "attachments", type: DataType.ARRAY, icon: Paperclip },
    { label: "JSON Data", key: "json_data", type: DataType.OBJECT, icon: Code },
    {
        label: "Location",
        key: "location",
        type: DataType.OBJECT,
        icon: MapPin,
    },
];

export const AttributeTypeDropdown: FC<Props> = ({ onChange, key, open, setOpen }) => {
    const groupedAttributes = useMemo(() => {
        const groups: Partial<Record<DataType, AttributeSchemaType[]>> = {
            [DataType.STRING]: [],
            [DataType.NUMBER]: [],
            [DataType.BOOLEAN]: [],
            [DataType.OBJECT]: [],
            [DataType.ARRAY]: [],
        };

        attributeTypes.forEach((attr) => {
            if (groups[attr.type]) {
                groups[attr.type]!.push(attr);
            }
        });

        return groups;
    }, []);

    const selectedAttribute = useMemo(() => {
        if (key === "RELATIONSHIP") {
            return { label: "Relationship", icon: Link2 };
        }
        return attributeTypes.find((attr) => attr.key === key) || attributeTypes[0];
    }, [key]);
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
        <Popover modal={true} open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                        <div className="flex items-center gap-2">
                            <selectedAttribute.icon className="h-4 w-4" />
                            <span>{selectedAttribute.label}</span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent
                className="w-[400px] p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
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
                                        key === "RELATIONSHIP" ? "opacity-100" : "opacity-0"
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
                                                        key === attr.key
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
