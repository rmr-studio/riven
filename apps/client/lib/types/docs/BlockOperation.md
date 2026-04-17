
# BlockOperation


## Properties

Name | Type
------------ | -------------
`type` | [BlockOperationType](BlockOperationType.md)
`blockId` | string
`childrenIds` | { [key: string]: string; }
`parentId` | string
`fromParentId` | string
`toParentId` | string
`updatedContent` | [Node](Node.md)
`fromIndex` | number
`toIndex` | number
`block` | [Node](Node.md)
`index` | number

## Example

```typescript
import type { BlockOperation } from ''

// TODO: Update the object below with actual values
const example = {
  "type": null,
  "blockId": null,
  "childrenIds": null,
  "parentId": null,
  "fromParentId": null,
  "toParentId": null,
  "updatedContent": null,
  "fromIndex": null,
  "toIndex": null,
  "block": null,
  "index": null,
} satisfies BlockOperation

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BlockOperation
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


