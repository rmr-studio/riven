# WorkflowDefinitionVersion

## Properties

| Name        | Type                              |
| ----------- | --------------------------------- |
| `id`        | string                            |
| `version`   | number                            |
| `workflow`  | [WorkflowGraph](WorkflowGraph.md) |
| `canvas`    | object                            |
| `createdAt` | Date                              |
| `updatedAt` | Date                              |
| `createdBy` | string                            |
| `updatedBy` | string                            |

## Example

```typescript
import type { WorkflowDefinitionVersion } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  version: null,
  workflow: null,
  canvas: null,
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,
} satisfies WorkflowDefinitionVersion;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkflowDefinitionVersion;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
