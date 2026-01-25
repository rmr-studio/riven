# WorkflowUtilityConfig

## Properties

| Name      | Type                                                      |
| --------- | --------------------------------------------------------- |
| `type`    | [WorkflowNodeType](WorkflowNodeType.md)                   |
| `version` | number                                                    |
| `subType` | [WorkflowUtilityActionType](WorkflowUtilityActionType.md) |

## Example

```typescript
import type { WorkflowUtilityConfig } from '';

// TODO: Update the object below with actual values
const example = {
  type: null,
  version: null,
  subType: null,
} satisfies WorkflowUtilityConfig;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkflowUtilityConfig;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
