# CreateWorkflowEdgeRequest

## Properties

| Name           | Type   |
| -------------- | ------ |
| `sourceNodeId` | string |
| `targetNodeId` | string |
| `label`        | string |

## Example

```typescript
import type { CreateWorkflowEdgeRequest } from '';

// TODO: Update the object below with actual values
const example = {
  sourceNodeId: null,
  targetNodeId: null,
  label: null,
} satisfies CreateWorkflowEdgeRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateWorkflowEdgeRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
