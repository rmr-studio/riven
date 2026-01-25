# WorkflowHumanInteractionConfig

## Properties

| Name      | Type                                                            |
| --------- | --------------------------------------------------------------- |
| `type`    | [WorkflowNodeType](WorkflowNodeType.md)                         |
| `version` | number                                                          |
| `subType` | [WorkflowHumanInteractionType](WorkflowHumanInteractionType.md) |

## Example

```typescript
import type { WorkflowHumanInteractionConfig } from '';

// TODO: Update the object below with actual values
const example = {
  type: null,
  version: null,
  subType: null,
} satisfies WorkflowHumanInteractionConfig;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkflowHumanInteractionConfig;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
