
# StructuralOperationRequestData


## Properties

Name | Type
------------ | -------------
`blockId` | string
`type` | [BlockOperationType](BlockOperationType.md)
`block` | [AddBlockOperationAllOfBlock](AddBlockOperationAllOfBlock.md)
`parentId` | string
`index` | number
`fromParentId` | string
`toParentId` | string
`childrenIds` | { [key: string]: string; }
`fromIndex` | number
`toIndex` | number
`updatedContent` | [UpdateBlockOperationAllOfUpdatedContent](UpdateBlockOperationAllOfUpdatedContent.md)

## Example

```typescript
import type { StructuralOperationRequestData } from ''

// TODO: Update the object below with actual values
const example = {
  "blockId": null,
  "type": null,
  "block": null,
  "parentId": null,
  "index": null,
  "fromParentId": null,
  "toParentId": null,
  "childrenIds": null,
  "fromIndex": null,
  "toIndex": null,
  "updatedContent": null,
} satisfies StructuralOperationRequestData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as StructuralOperationRequestData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


