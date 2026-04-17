
# WorkflowConditionControlConfig

Configuration for CONDITION control flow nodes.

## Properties

Name | Type
------------ | -------------
`version` | number
`expression` | string
`contextEntityId` | string
`timeoutSeconds` | number
`type` | [WorkflowNodeType](WorkflowNodeType.md)
`subType` | [WorkflowControlType](WorkflowControlType.md)
`config` | { [key: string]: object; }
`configSchema` | [Array&lt;WorkflowNodeConfigField&gt;](WorkflowNodeConfigField.md)

## Example

```typescript
import type { WorkflowConditionControlConfig } from ''

// TODO: Update the object below with actual values
const example = {
  "version": null,
  "expression": entity.status == 'active' && entity.balance > 0,
  "contextEntityId": {{ steps.fetch_account.output.entityId }},
  "timeoutSeconds": null,
  "type": null,
  "subType": null,
  "config": null,
  "configSchema": null,
} satisfies WorkflowConditionControlConfig

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkflowConditionControlConfig
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


