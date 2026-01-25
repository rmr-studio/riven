# CreateBlockTypeRequest

## Properties

| Name          | Type                                  |
| ------------- | ------------------------------------- |
| `key`         | string                                |
| `name`        | string                                |
| `description` | string                                |
| `mode`        | [ValidationScope](ValidationScope.md) |
| `schema`      | [SchemaString](SchemaString.md)       |
| `display`     | [BlockDisplay](BlockDisplay.md)       |
| `workspaceId` | string                                |

## Example

```typescript
import type { CreateBlockTypeRequest } from '';

// TODO: Update the object below with actual values
const example = {
  key: null,
  name: null,
  description: null,
  mode: null,
  schema: null,
  display: null,
  workspaceId: null,
} satisfies CreateBlockTypeRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateBlockTypeRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
