
# OverwriteEnvironmentRequest


## Properties

Name | Type
------------ | -------------
`layoutId` | string
`workspaceId` | string
`version` | number
`environment` | [BlockEnvironment](BlockEnvironment.md)

## Example

```typescript
import type { OverwriteEnvironmentRequest } from ''

// TODO: Update the object below with actual values
const example = {
  "layoutId": null,
  "workspaceId": null,
  "version": null,
  "environment": null,
} satisfies OverwriteEnvironmentRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as OverwriteEnvironmentRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


