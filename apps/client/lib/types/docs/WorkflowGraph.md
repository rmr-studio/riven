
# WorkflowGraph


## Properties

Name | Type
------------ | -------------
`workflowDefinitionId` | string
`nodes` | [Array&lt;WorkflowNode&gt;](WorkflowNode.md)
`edges` | [Array&lt;WorkflowEdge&gt;](WorkflowEdge.md)
`root` | [WorkflowNode](WorkflowNode.md)

## Example

```typescript
import type { WorkflowGraph } from ''

// TODO: Update the object below with actual values
const example = {
  "workflowDefinitionId": null,
  "nodes": null,
  "edges": null,
  "root": null,
} satisfies WorkflowGraph

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkflowGraph
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


