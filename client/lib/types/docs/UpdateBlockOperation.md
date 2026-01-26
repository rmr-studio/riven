# UpdateBlockOperation

## Properties

| Name             | Type                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------- |
| `blockId`        | string                                                                                |
| `type`           | [BlockOperationType](BlockOperationType.md)                                           |
| `updatedContent` | [UpdateBlockOperationAllOfUpdatedContent](UpdateBlockOperationAllOfUpdatedContent.md) |

## Example

```typescript
import type { UpdateBlockOperation } from '';

// TODO: Update the object below with actual values
const example = {
  blockId: null,
  type: null,
  updatedContent: null,
} satisfies UpdateBlockOperation;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdateBlockOperation;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
