# CreateEntityTypeRequest

## Properties

| Name          | Type                                |
| ------------- | ----------------------------------- |
| `name`        | [DisplayName](DisplayName.md)       |
| `key`         | string                              |
| `description` | string                              |
| `type`        | [EntityCategory](EntityCategory.md) |
| `icon`        | [Icon](Icon.md)                     |

## Example

```typescript
import type { CreateEntityTypeRequest } from '';

// TODO: Update the object below with actual values
const example = {
  name: null,
  key: null,
  description: null,
  type: null,
  icon: null,
} satisfies CreateEntityTypeRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateEntityTypeRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
