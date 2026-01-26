# WorkflowDefinition

## Properties

| Name          | Type                                                      |
| ------------- | --------------------------------------------------------- |
| `id`          | string                                                    |
| `workspaceId` | string                                                    |
| `name`        | string                                                    |
| `description` | string                                                    |
| `status`      | [WorkflowDefinitionStatus](WorkflowDefinitionStatus.md)   |
| `icon`        | [Icon](Icon.md)                                           |
| `tags`        | Array&lt;string&gt;                                       |
| `definition`  | [WorkflowDefinitionVersion](WorkflowDefinitionVersion.md) |
| `createdAt`   | Date                                                      |
| `updatedAt`   | Date                                                      |
| `createdBy`   | string                                                    |
| `updatedBy`   | string                                                    |

## Example

```typescript
import type { WorkflowDefinition } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  workspaceId: null,
  name: null,
  description: null,
  status: null,
  icon: null,
  tags: null,
  definition: null,
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,
} satisfies WorkflowDefinition;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkflowDefinition;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
