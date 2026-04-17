
# Node


## Properties

Name | Type
------------ | -------------
`warnings` | Array&lt;string&gt;
`type` | [NodeType](NodeType.md)
`block` | [Block](Block.md)
`reference` | [ReferencePayload](ReferencePayload.md)
`children` | Array&lt;object&gt;

## Example

```typescript
import type { Node } from ''

// TODO: Update the object below with actual values
const example = {
  "warnings": null,
  "type": null,
  "block": null,
  "reference": null,
  "children": null,
} satisfies Node

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Node
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


