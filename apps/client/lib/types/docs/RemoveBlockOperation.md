
# RemoveBlockOperation


## Properties

Name | Type
------------ | -------------
`type` | [BlockOperationType](BlockOperationType.md)
`blockId` | string
`block` | [Node](Node.md)
`parentId` | string
`index` | number
`childrenIds` | { [key: string]: string; }
`fromParentId` | string
`toParentId` | string
`updatedContent` | [Node](Node.md)
`fromIndex` | number
`toIndex` | number

## Example

```typescript
import type { RemoveBlockOperation } from ''

// TODO: Update the object below with actual values
const example = {
  "type": null,
  "blockId": null,
  "block": null,
  "parentId": null,
  "index": null,
  "childrenIds": null,
  "fromParentId": null,
  "toParentId": null,
  "updatedContent": null,
  "fromIndex": null,
  "toIndex": null,
} satisfies RemoveBlockOperation

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RemoveBlockOperation
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


