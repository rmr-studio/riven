
# ColumnConfiguration


## Properties

Name | Type
------------ | -------------
`order` | Array&lt;string&gt;
`overrides` | [{ [key: string]: ColumnOverride; }](ColumnOverride.md)

## Example

```typescript
import type { ColumnConfiguration } from ''

// TODO: Update the object below with actual values
const example = {
  "order": null,
  "overrides": null,
} satisfies ColumnConfiguration

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ColumnConfiguration
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


