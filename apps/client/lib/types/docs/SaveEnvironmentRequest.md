
# SaveEnvironmentRequest


## Properties

Name | Type
------------ | -------------
`layoutId` | string
`workspaceId` | string
`layout` | [TreeLayout](TreeLayout.md)
`version` | number
`operations` | [Array&lt;StructuralOperationRequest&gt;](StructuralOperationRequest.md)

## Example

```typescript
import type { SaveEnvironmentRequest } from ''

// TODO: Update the object below with actual values
const example = {
  "layoutId": null,
  "workspaceId": null,
  "layout": null,
  "version": null,
  "operations": null,
} satisfies SaveEnvironmentRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SaveEnvironmentRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


