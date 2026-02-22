
# BlockType


## Properties

Name | Type
------------ | -------------
`id` | string
`key` | string
`version` | number
`name` | string
`sourceId` | string
`nesting` | [BlockTypeNesting](BlockTypeNesting.md)
`description` | string
`workspaceId` | string
`deleted` | boolean
`strictness` | [ValidationScope](ValidationScope.md)
`system` | boolean
`schema` | [SchemaString](SchemaString.md)
`display` | [BlockDisplay](BlockDisplay.md)
`createdAt` | Date
`updatedAt` | Date
`createdBy` | string
`updatedBy` | string

## Example

```typescript
import type { BlockType } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "key": null,
  "version": null,
  "name": null,
  "sourceId": null,
  "nesting": null,
  "description": null,
  "workspaceId": null,
  "deleted": null,
  "strictness": null,
  "system": null,
  "schema": null,
  "display": null,
  "createdAt": null,
  "updatedAt": null,
  "createdBy": null,
  "updatedBy": null,
} satisfies BlockType

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BlockType
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


