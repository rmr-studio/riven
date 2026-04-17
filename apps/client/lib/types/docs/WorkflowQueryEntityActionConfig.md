
# WorkflowQueryEntityActionConfig

Configuration for QUERY_ENTITY action nodes that query entities by type with filtering.

## Properties

Name | Type
------------ | -------------
`version` | number
`query` | [EntityQuery](EntityQuery.md)
`pagination` | [QueryPagination](QueryPagination.md)
`projection` | [QueryProjection](QueryProjection.md)
`timeoutSeconds` | number
`type` | [WorkflowNodeType](WorkflowNodeType.md)
`subType` | [WorkflowActionType](WorkflowActionType.md)
`config` | { [key: string]: object; }
`configSchema` | [Array&lt;WorkflowNodeConfigField&gt;](WorkflowNodeConfigField.md)

## Example

```typescript
import type { WorkflowQueryEntityActionConfig } from ''

// TODO: Update the object below with actual values
const example = {
  "version": null,
  "query": null,
  "pagination": null,
  "projection": null,
  "timeoutSeconds": null,
  "type": null,
  "subType": null,
  "config": null,
  "configSchema": null,
} satisfies WorkflowQueryEntityActionConfig

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkflowQueryEntityActionConfig
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


