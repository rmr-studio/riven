
# SaveEnvironmentResponse


## Properties

Name | Type
------------ | -------------
`success` | boolean
`error` | string
`newVersion` | number
`conflict` | boolean
`layout` | [TreeLayout](TreeLayout.md)
`latestVersion` | number
`lastModifiedBy` | string
`lastModifiedAt` | Date
`idMappings` | { [key: string]: string; }

## Example

```typescript
import type { SaveEnvironmentResponse } from ''

// TODO: Update the object below with actual values
const example = {
  "success": null,
  "error": null,
  "newVersion": null,
  "conflict": null,
  "layout": null,
  "latestVersion": null,
  "lastModifiedBy": null,
  "lastModifiedAt": null,
  "idMappings": null,
} satisfies SaveEnvironmentResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SaveEnvironmentResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


