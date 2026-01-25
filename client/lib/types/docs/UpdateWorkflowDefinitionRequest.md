# UpdateWorkflowDefinitionRequest

## Properties

| Name          | Type                        |
| ------------- | --------------------------- |
| `name`        | string                      |
| `description` | string                      |
| `iconColour`  | [IconColour](IconColour.md) |
| `iconType`    | [IconType](IconType.md)     |
| `tags`        | Array&lt;string&gt;         |

## Example

```typescript
import type { UpdateWorkflowDefinitionRequest } from '';

// TODO: Update the object below with actual values
const example = {
  name: null,
  description: null,
  iconColour: null,
  iconType: null,
  tags: null,
} satisfies UpdateWorkflowDefinitionRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdateWorkflowDefinitionRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
