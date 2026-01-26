# HydrateBlocksRequest

## Properties

| Name          | Type                                                    |
| ------------- | ------------------------------------------------------- |
| `references`  | { [key: string]: Array&lt;EntityReferenceRequest&gt;; } |
| `workspaceId` | string                                                  |

## Example

```typescript
import type { HydrateBlocksRequest } from '';

// TODO: Update the object below with actual values
const example = {
  references: null,
  workspaceId: null,
} satisfies HydrateBlocksRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as HydrateBlocksRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
