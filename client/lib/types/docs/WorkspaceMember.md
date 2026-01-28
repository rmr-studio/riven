
# WorkspaceMember


## Properties

Name | Type
------------ | -------------
`workspace` | [WorkspaceDisplay](WorkspaceDisplay.md)
`user` | [UserDisplay](UserDisplay.md)
`role` | [WorkspaceRoles](WorkspaceRoles.md)
`memberSince` | Date

## Example

```typescript
import type { WorkspaceMember } from ''

// TODO: Update the object below with actual values
const example = {
  "workspace": null,
  "user": null,
  "role": null,
  "memberSince": null,
} satisfies WorkspaceMember

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WorkspaceMember
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


