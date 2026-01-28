
# WorkflowNodeConfig

Polymorphic workflow node configuration. Discriminated by \'type\' and \'subType\' fields.

## Properties

Name | Type
------------ | -------------
`version` | number
`cronExpression` | string
`interval` | [WorkflowScheduleTriggerConfigInterval](WorkflowScheduleTriggerConfigInterval.md)
`timeZone` | [WorkflowScheduleTriggerConfigTimeZone](WorkflowScheduleTriggerConfigTimeZone.md)
`subType` | [WorkflowControlType](WorkflowControlType.md)
`type` | [WorkflowNodeType](WorkflowNodeType.md)
`key` | string
`operation` | [OperationType](OperationType.md)
`field` | Array&lt;string&gt;
`expressions` | object
`method` | [RequestMethodType](RequestMethodType.md)
`authentication` | [AuthenticationType](AuthenticationType.md)
`signature` | [Signature](Signature.md)
`payloadSchema` | [SchemaString](SchemaString.md)
`schema` | [SchemaString](SchemaString.md)
`name` | string
`config` | { [key: string]: object; }

## Example

```typescript
import type { WorkflowNodeConfig } from ''

// TODO: Update the object below with actual values
const example = {
  "version": null,
  "cronExpression": null,
  "interval": null,
  "timeZone": null,
  "subType": null,
  "type": null,
  "key": null,
  "operation": null,
  "field": null,
  "expressions": null,
  "method": null,
  "authentication": null,
  "signature": null,
  "payloadSchema": null,
  "schema": null,
  "name": null,
  "config": null,
} satisfies WorkflowNodeConfig

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkflowNodeConfig
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


