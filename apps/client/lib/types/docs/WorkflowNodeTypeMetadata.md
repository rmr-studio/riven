
# WorkflowNodeTypeMetadata

Display metadata for a workflow node type

## Properties

Name | Type
------------ | -------------
`label` | string
`description` | string
`icon` | [IconType](IconType.md)
`category` | [WorkflowNodeType](WorkflowNodeType.md)

## Example

```typescript
import type { WorkflowNodeTypeMetadata } from ''

// TODO: Update the object below with actual values
const example = {
  "label": Create Entity,
  "description": Creates a new entity instance,
  "icon": null,
  "category": null,
} satisfies WorkflowNodeTypeMetadata

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkflowNodeTypeMetadata
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


