# SchemaUUID

## Properties

| Name         | Type                                            |
| ------------ | ----------------------------------------------- |
| `label`      | string                                          |
| `key`        | [SchemaType](SchemaType.md)                     |
| `icon`       | [Icon](Icon.md)                                 |
| `type`       | [DataType](DataType.md)                         |
| `format`     | [DataFormat](DataFormat.md)                     |
| `required`   | boolean                                         |
| `properties` | [{ [key: string]: SchemaUUID; }](SchemaUUID.md) |
| `items`      | [SchemaUUID](SchemaUUID.md)                     |
| `unique`     | boolean                                         |
| `_protected` | boolean                                         |
| `options`    | [SchemaOptions](SchemaOptions.md)               |

## Example

```typescript
import type { SchemaUUID } from '';

// TODO: Update the object below with actual values
const example = {
  label: null,
  key: null,
  icon: null,
  type: null,
  format: null,
  required: null,
  properties: null,
  items: null,
  unique: null,
  _protected: null,
  options: null,
} satisfies SchemaUUID;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SchemaUUID;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
