
# UserDisplay


## Properties

Name | Type
------------ | -------------
`id` | string
`email` | string
`name` | string
`avatarUrl` | string

## Example

```typescript
import type { UserDisplay } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "email": null,
  "name": null,
  "avatarUrl": null,
} satisfies UserDisplay

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UserDisplay
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


