
# ReferenceNode

Reference node containing a block with entity or block tree references

## Properties

Name | Type
------------ | -------------
`warnings` | Array&lt;string&gt;
`type` | [NodeType](NodeType.md)
`block` | [Block](Block.md)
`children` | Array&lt;object&gt;
`reference` | [ReferencePayload](ReferencePayload.md)

## Example

```typescript
import type { ReferenceNode } from ''

// TODO: Update the object below with actual values
const example = {
  "warnings": null,
  "type": null,
  "block": null,
  "children": null,
  "reference": null,
} satisfies ReferenceNode

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ReferenceNode
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


