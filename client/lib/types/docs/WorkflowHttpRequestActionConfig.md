
# WorkflowHttpRequestActionConfig

Configuration for HTTP_REQUEST action nodes.

## Properties

Name | Type
------------ | -------------
`version` | number
`name` | string
`config` | { [key: string]: object; }
`subType` | [WorkflowActionType](WorkflowActionType.md)
`type` | [WorkflowNodeType](WorkflowNodeType.md)

## Example

```typescript
import type { WorkflowHttpRequestActionConfig } from ''

// TODO: Update the object below with actual values
const example = {
  "version": null,
  "name": null,
  "config": null,
  "subType": null,
  "type": null,
} satisfies WorkflowHttpRequestActionConfig

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkflowHttpRequestActionConfig
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


