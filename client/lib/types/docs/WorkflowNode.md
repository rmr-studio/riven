# WorkflowNode

## Properties

| Name          | Type                                                              |
| ------------- | ----------------------------------------------------------------- |
| `id`          | string                                                            |
| `workspaceId` | string                                                            |
| `key`         | string                                                            |
| `name`        | string                                                            |
| `description` | string                                                            |
| `config`      | [SaveWorkflowNodeRequestConfig](SaveWorkflowNodeRequestConfig.md) |
| `type`        | [WorkflowNodeType](WorkflowNodeType.md)                           |
| `version`     | number                                                            |

## Example

```typescript
import type { WorkflowNode } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  workspaceId: null,
  key: null,
  name: null,
  description: null,
  config: null,
  type: null,
  version: null,
} satisfies WorkflowNode;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkflowNode;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
