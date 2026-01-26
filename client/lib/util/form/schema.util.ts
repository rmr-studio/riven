import { Icon, SchemaOptions } from '@/lib/interfaces/common.interface';
import { DataFormat, DataType, IconColour, IconType, SchemaType } from '@/lib/types/types';

export interface AttributeSchemaType {
  label: string;
  key: SchemaType;
  type: DataType;
  format?: DataFormat;
  options?: SchemaOptions;
  icon: Icon;
}

export const attributeTypes: Record<SchemaType, AttributeSchemaType> = {
  [SchemaType.TEXT]: {
    label: 'Text',
    key: SchemaType.TEXT,
    type: DataType.STRING,
    icon: {
      icon: IconType.A_LARGE_SMALL,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.NUMBER]: {
    label: 'Number',
    key: SchemaType.NUMBER,
    type: DataType.NUMBER,
    icon: {
      icon: IconType.CALCULATOR,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.CHECKBOX]: {
    label: 'Checkbox',
    key: SchemaType.CHECKBOX,
    type: DataType.BOOLEAN,
    icon: {
      icon: IconType.CHECK_CHECK,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.DATE]: {
    label: 'Date',
    key: SchemaType.DATE,
    type: DataType.STRING,
    format: DataFormat.DATE,
    icon: {
      icon: IconType.CALENDAR_RANGE,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.DATETIME]: {
    label: 'Date & Time',
    key: SchemaType.DATETIME,
    type: DataType.STRING,
    format: DataFormat.DATETIME,
    icon: {
      icon: IconType.CALENDAR_CLOCK,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.RATING]: {
    label: 'Rating',
    key: SchemaType.RATING,
    type: DataType.NUMBER,
    options: { minimum: 1, maximum: 5 },
    icon: {
      icon: IconType.STAR,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.PHONE]: {
    label: 'Phone',
    key: SchemaType.PHONE,
    type: DataType.STRING,
    format: DataFormat.PHONE,
    icon: {
      icon: IconType.PHONE,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.EMAIL]: {
    label: 'Email',
    key: SchemaType.EMAIL,
    type: DataType.STRING,
    format: DataFormat.EMAIL,
    icon: {
      icon: IconType.AT_SIGN,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.URL]: {
    label: 'URL',
    key: SchemaType.URL,
    type: DataType.STRING,
    format: DataFormat.URL,
    icon: {
      icon: IconType.LINK,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.CURRENCY]: {
    label: 'Currency',
    key: SchemaType.CURRENCY,
    type: DataType.NUMBER,
    format: DataFormat.CURRENCY,
    icon: {
      icon: IconType.DOLLAR_SIGN,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.PERCENTAGE]: {
    label: 'Percentage',
    key: SchemaType.PERCENTAGE,
    type: DataType.NUMBER,
    format: DataFormat.PERCENTAGE,
    icon: {
      icon: IconType.PERCENT,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.SELECT]: {
    label: 'Select',
    key: SchemaType.SELECT,
    type: DataType.STRING,
    icon: {
      icon: IconType.LIST,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.MULTI_SELECT]: {
    label: 'Multi-select',
    key: SchemaType.MULTI_SELECT,
    type: DataType.ARRAY,
    icon: {
      icon: IconType.LIST_CHECKS,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.FILE_ATTACHMENT]: {
    label: 'File Attachments',
    key: SchemaType.FILE_ATTACHMENT,
    type: DataType.ARRAY,
    icon: {
      icon: IconType.PAPERCLIP,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.OBJECT]: {
    label: 'JSON Data',
    key: SchemaType.OBJECT,
    type: DataType.OBJECT,
    icon: {
      icon: IconType.CODE,
      colour: IconColour.NEUTRAL,
    },
  },
  [SchemaType.LOCATION]: {
    label: 'Location',
    key: SchemaType.LOCATION,
    type: DataType.OBJECT,
    icon: {
      icon: IconType.MAP_PIN,
      colour: IconColour.NEUTRAL,
    },
  },
};
