
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
`method` | string
`authentication` | [AuthenticationType](AuthenticationType.md)
`signature` | [Signature](Signature.md)
`payloadSchema` | [SchemaString](SchemaString.md)
`schema` | [SchemaString](SchemaString.md)
`entityTypeId` | string
`payload` | { [key: string]: string; }
`timeoutSeconds` | number
`config` | { [key: string]: object; }
`entityId` | string
`query` | [EntityQuery](EntityQuery.md)
`pagination` | [QueryPagination](QueryPagination.md)
`projection` | [QueryProjection](QueryProjection.md)
`url` | string
`headers` | { [key: string]: string; }
`body` | { [key: string]: string; }
`expression` | string
`contextEntityId` | string

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
  "entityTypeId": null,
  "payload": null,
  "timeoutSeconds": null,
  "config": null,
  "entityId": null,
  "query": null,
  "pagination": null,
  "projection": null,
  "url": null,
  "headers": null,
  "body": null,
  "expression": null,
  "contextEntityId": null,
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


