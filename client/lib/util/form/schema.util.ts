import { SchemaOptions } from "@/lib/interfaces/common.interface";
import { DataFormat, DataType, SchemaType } from "@/lib/types/types";
import {
    AtSign,
    Calendar,
    CheckSquare,
    Clock,
    Code,
    DollarSign,
    Hash,
    Link,
    List,
    ListChecks,
    MapPin,
    Paperclip,
    Percent,
    Phone,
    Stars,
    Type,
} from "lucide-react";
import { FC } from "react";

export interface AttributeSchemaType {
    label: string;
    key: SchemaType;
    type: DataType;
    format?: DataFormat;
    options?: SchemaOptions;
    icon: FC<React.SVGProps<SVGSVGElement>>;
}

export const attributeTypes: Record<SchemaType, AttributeSchemaType> = {
    [SchemaType.TEXT]: {
        label: "Text",
        key: SchemaType.TEXT,
        type: DataType.STRING,
        icon: Type,
    },
    [SchemaType.NUMBER]: {
        label: "Number",
        key: SchemaType.NUMBER,
        type: DataType.NUMBER,
        icon: Hash,
    },
    [SchemaType.CHECKBOX]: {
        label: "Checkbox",
        key: SchemaType.CHECKBOX,
        type: DataType.BOOLEAN,
        icon: CheckSquare,
    },
    [SchemaType.DATE]: {
        label: "Date",
        key: SchemaType.DATE,
        type: DataType.STRING,
        format: DataFormat.DATE,
        icon: Calendar,
    },
    [SchemaType.DATETIME]: {
        label: "Date & Time",
        key: SchemaType.DATETIME,
        type: DataType.STRING,
        format: DataFormat.DATETIME,
        icon: Clock,
    },
    [SchemaType.RATING]: {
        label: "Rating",
        key: SchemaType.RATING,
        type: DataType.NUMBER,
        options: { minimum: 1, maximum: 5 },
        icon: Stars,
    },
    [SchemaType.PHONE]: {
        label: "Phone",
        key: SchemaType.PHONE,
        type: DataType.STRING,
        format: DataFormat.PHONE,
        icon: Phone,
    },
    [SchemaType.EMAIL]: {
        label: "Email",
        key: SchemaType.EMAIL,
        type: DataType.STRING,
        format: DataFormat.EMAIL,
        icon: AtSign,
    },
    [SchemaType.URL]: {
        label: "URL",
        key: SchemaType.URL,
        type: DataType.STRING,
        format: DataFormat.URL,
        icon: Link,
    },
    [SchemaType.CURRENCY]: {
        label: "Currency",
        key: SchemaType.CURRENCY,
        type: DataType.NUMBER,
        format: DataFormat.CURRENCY,
        icon: DollarSign,
    },
    [SchemaType.PERCENTAGE]: {
        label: "Percentage",
        key: SchemaType.PERCENTAGE,
        type: DataType.NUMBER,
        format: DataFormat.PERCENTAGE,
        icon: Percent,
    },
    [SchemaType.SELECT]: {
        label: "Select",
        key: SchemaType.SELECT,
        type: DataType.STRING,
        icon: List,
    },
    [SchemaType.MULTI_SELECT]: {
        label: "Multi-select",
        key: SchemaType.MULTI_SELECT,
        type: DataType.ARRAY,
        icon: ListChecks,
    },
    [SchemaType.FILE_ATTACHMENT]: {
        label: "File Attachments",
        key: SchemaType.FILE_ATTACHMENT,
        type: DataType.ARRAY,
        icon: Paperclip,
    },
    [SchemaType.OBJECT]: {
        label: "JSON Data",
        key: SchemaType.OBJECT,
        type: DataType.OBJECT,
        icon: Code,
    },
    [SchemaType.LOCATION]: {
        label: "Location",
        key: SchemaType.LOCATION,
        type: DataType.OBJECT,
        icon: MapPin,
    },
};
