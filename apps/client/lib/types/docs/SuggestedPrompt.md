
# SuggestedPrompt


## Properties

Name | Type
------------ | -------------
`id` | string
`title` | string
`prompt` | string
`category` | [SuggestedPromptCategory](SuggestedPromptCategory.md)
`description` | string
`score` | number
`requiresData` | [Array&lt;RequiredDataSignal&gt;](RequiredDataSignal.md)

## Example

```typescript
import type { SuggestedPrompt } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "title": null,
  "prompt": null,
  "category": null,
  "description": null,
  "score": null,
  "requiresData": null,
} satisfies SuggestedPrompt

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SuggestedPrompt
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


