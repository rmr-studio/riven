
# WorkflowScheduleTriggerConfig

Configuration for SCHEDULE trigger nodes. Triggers workflow execution on a schedule.

## Properties

Name | Type
------------ | -------------
`version` | number
`cronExpression` | string
`interval` | string
`timeZone` | string
`type` | [WorkflowNodeType](WorkflowNodeType.md)
`subType` | [WorkflowTriggerType](WorkflowTriggerType.md)
`config` | { [key: string]: object; }
`configSchema` | [Array&lt;WorkflowNodeConfigField&gt;](WorkflowNodeConfigField.md)

## Example

```typescript
import type { WorkflowScheduleTriggerConfig } from ''

// TODO: Update the object below with actual values
const example = {
  "version": null,
  "cronExpression": null,
  "interval": null,
  "timeZone": null,
  "type": null,
  "subType": null,
  "config": null,
  "configSchema": null,
} satisfies WorkflowScheduleTriggerConfig

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkflowScheduleTriggerConfig
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


