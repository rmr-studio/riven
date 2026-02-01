
# WorkflowNodeConfigField


## Properties

Name | Type
------------ | -------------
`key` | string
`label` | string
`type` | [WorkflowNodeConfigFieldType](WorkflowNodeConfigFieldType.md)
`required` | boolean
`description` | string
`placeholder` | string
`defaultValue` | object
`validation` | { [key: string]: object; }
`options` | { [key: string]: string; }

## Example

```typescript
import type { WorkflowNodeConfigField } from ''

// TODO: Update the object below with actual values
const example = {
  "key": null,
  "label": null,
  "type": null,
  "required": null,
  "description": null,
  "placeholder": null,
  "defaultValue": null,
  "validation": null,
  "options": null,
} satisfies WorkflowNodeConfigField

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkflowNodeConfigField
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


